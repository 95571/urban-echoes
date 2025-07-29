/**
 * @file js/combat.js
 * @description 战斗系统模块 (v59.2.1 - [优化] 统一战斗日志颜色)
 * @author Gemini (CTO)
 * @version 59.2.1
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const Combat = {
        start(combatData) {
            const gameState = game.State.get();
            if (!combatData || !combatData.enemies) {
                console.error("无法开始战斗：缺少战斗配置数据。");
                return;
            }

            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('encounter'), color: 'var(--log-color-danger)' });
            gameState.isCombat = true;

            const createCombatant = (template, type, combatId) => {
                const combatant = JSON.parse(JSON.stringify(template));
                if (!combatant.activeEffects) combatant.activeEffects = [];
                (combatant.passiveEffects || []).forEach(effectId => {
                    if (!combatant.activeEffects.some(e => e.id === effectId)) {
                        game.Effects.add(combatant, effectId);
                    }
                });
                combatant.effectiveStats = game.Utils.calculateEffectiveStatsForUnit(combatant);
                combatant.maxHp = combatant.effectiveStats.maxHp;
                combatant.maxMp = combatant.effectiveStats.maxMp;
                combatant.hp = combatant.maxHp;
                combatant.mp = combatant.maxMp;
                combatant.hasTakenExtraTurnThisRound = false;
                
                if (type === 'player') {
                    combatant.hp = gameState.hp;
                    combatant.mp = gameState.mp;
                    combatant.activeEffects = JSON.parse(JSON.stringify(gameState.activeEffects));
                }

                return { ...combatant, type, combatId, isDefending: false };
            };

            const enemies = [];
            let enemyCounter = {};
            combatData.enemies.forEach(enemyInfo => {
                const monsterTemplate = gameData.monsters[enemyInfo.id];
                if (!monsterTemplate) return;
                for (let i = 0; i < enemyInfo.quantity; i++) {
                    const count = enemyCounter[enemyInfo.id] || 0;
                    const combatId = `enemy_${enemyInfo.id}_${count}`;
                    enemies.push(createCombatant(monsterTemplate, 'enemy', combatId));
                    enemyCounter[enemyInfo.id] = count + 1;
                }
            });

            const playerCombatant = createCombatant(gameState, 'player', 'player_0');
            
            gameState.combatState = {
                playerParty: [playerCombatant],
                enemies: enemies,
                turnOrder: [],
                activeUnit: null,
                focusedTargetId: null,
                isOver: false,
                isWaitingForPlayerInput: false,
                fleeable: combatData.fleeable !== false,
                victoryActionBlock: combatData.victoryActionBlock,
                defeatActionBlock: combatData.defeatActionBlock,
                victoryPrompt: combatData.victoryPrompt,
                defeatPrompt: combatData.defeatPrompt
            };

            game.State.setUIMode('COMBAT');
            this.startRound();
        },

        startRound() {
            const cs = game.State.get().combatState;
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('newRound'), color: 'var(--log-color-primary)' });
            
            [...cs.playerParty, ...cs.enemies].forEach(u => {
                u.hasTakenExtraTurnThisRound = false;
            });
            
            cs.turnOrder = [...cs.playerParty, ...cs.enemies]
                .filter(u => u.hp > 0)
                .sort((a, b) => (b.effectiveStats.spd || 0) - (a.effectiveStats.spd || 0));
            this.nextTurn();
        },

        async nextTurn() {
            const cs = game.State.get().combatState;
            if (!cs || cs.isOver) return;

            if (cs.enemies.every(e => e.hp <= 0)) { this.end('win'); return; }
            if (cs.playerParty.every(p => p.hp <= 0)) { this.end('loss'); return; }

            if (cs.turnOrder.length === 0) {
                this.startRound();
                return;
            }

            const unit = cs.turnOrder.shift();
            if (unit.hp <= 0) {
                this.nextTurn();
                return;
            }

            await this.doTurn(unit);
        },

        async doTurn(unit) {
            const cs = game.State.get().combatState;
            unit.isDefending = false;
            cs.activeUnit = unit;
            
            game.Events.publish(EVENTS.COMBAT_TURN_START, { source: unit });
            await game.Effects.tick(unit);

            if (unit.hp <= 0) {
                this.endTurn(unit);
                return;
            }

            game.Events.publish(EVENTS.UI_RENDER);

            if (unit.type === 'player') {
                this.waitForPlayerInput();
            } else {
                setTimeout(async () => {
                    const target = cs.playerParty.find(p => p.hp > 0);
                    if(target) {
                        await this.performAttack(unit, target);
                    }
                    this.endTurn(unit);
                }, 800);
            }
        },

        waitForPlayerInput() {
            const cs = game.State.get().combatState;
            if (!cs) return;
            cs.isWaitingForPlayerInput = true;
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('playerTurn'), color: "var(--log-color-primary)" });
            game.Events.publish(EVENTS.UI_RENDER);
        },

        async endTurn(unit) {
            const cs = game.State.get().combatState;
            if (!cs || cs.isOver) return;
            cs.isWaitingForPlayerInput = false;

            game.Events.publish(EVENTS.COMBAT_TURN_END, { source: unit });
            
            const extraTurnCheck = this.checkForExtraTurn(unit);
            if (extraTurnCheck.triggered) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('extraTurnSuccess', {name: unit.name}), color: 'var(--log-color-primary)' });
                setTimeout(() => this.doTurn(unit), 500);
            } else {
                cs.activeUnit = null;
                setTimeout(() => this.nextTurn(), 200);
            }
        },

        checkForExtraTurn(unit) {
            if (unit.hasTakenExtraTurnThisRound) {
                return { triggered: false };
            }
            const cs = game.State.get().combatState;
            if (!cs) return { triggered: false };
            const opponents = (unit.type === 'player' ? cs.enemies : cs.playerParty).filter(u => u.hp > 0);
            if (opponents.length === 0) return { triggered: false };
            const selfSpd = unit.effectiveStats.spd || 10;
            const avgOpponentSpd = opponents.reduce((sum, o) => sum + (o.effectiveStats.spd || 10), 0) / opponents.length;
            const speedAdvantage = selfSpd - avgOpponentSpd;
            const chance = 0.05 + speedAdvantage * 0.02;
            const cappedChance = Math.min(Math.max(0, chance), 0.5);
            if (Math.random() < cappedChance) {
                unit.hasTakenExtraTurnThisRound = true;
                return { triggered: true };
            }
            return { triggered: false };
        },

        playerAction(callback) {
            const cs = game.State.get().combatState;
            if (!cs || !cs.isWaitingForPlayerInput) return;
            const player = cs.playerParty[0];
            cs.isWaitingForPlayerInput = false;
            game.Events.publish(EVENTS.UI_RENDER);
            (async () => {
                await callback(player);
                if (game.State.get().isCombat) {
                    this.endTurn(player);
                }
            })();
        },

        playerAttack() { this.playerAction(async (player) => {
            const cs = game.State.get().combatState;
            const livingEnemies = cs.enemies.filter(e => e.hp > 0);
            if (livingEnemies.length === 0) return;
            let target = cs.focusedTargetId ? cs.enemies.find(e => e.combatId === cs.focusedTargetId && e.hp > 0) : null;
            if (!target) {
                target = livingEnemies[0];
                cs.focusedTargetId = target.combatId;
            }
            await this.performAttack(player, target);
        })},

        playerDefend() { this.playerAction(player => {
            player.isDefending = true;
            game.Events.publish(EVENTS.COMBAT_DEFEND, { source: player });
            // [修改] 优化日志颜色
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('defendAction', {name: player.name}), color: 'var(--log-color-primary)' });
        })},

        playerFlee() { this.playerAction(player => {
            const gameState = game.State.get();
            if (!gameState.combatState.fleeable) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: "无法从这场战斗中逃跑！", color: 'var(--error-color)' });
                return;
            }
            const baseFleeChance = 0.5 + ((gameState.effectiveStats.lck - 5) * 0.05);
            if (Math.random() < baseFleeChance) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('fleeSuccess'), color: 'var(--log-color-success)' });
                this.end('fled');
            } else {
                // [修改] 优化日志颜色
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('fleeFail'), color: 'var(--log-color-danger)' });
            }
        })},

        triggerAnimation(element, animationClass) {
            if (!element || element.classList.contains(animationClass)) return;
            element.classList.add(animationClass);
            element.addEventListener('animationend', () => element.classList.remove(animationClass), { once: true });
        },

        showDamagePopup(damage, targetUnit) {
             const targetEl = document.getElementById(targetUnit.combatId);
            if (!targetEl) return;
            const screenEl = game.dom.screen;
            const popup = document.createElement('span');
            popup.textContent = '-' + Math.round(damage);
            popup.className = 'damage-popup';
            screenEl.appendChild(popup);
            const targetRect = targetEl.getBoundingClientRect();
            const screenRect = screenEl.getBoundingClientRect();
            popup.style.left = `${(targetRect.left + targetRect.width / 2) - screenRect.left - (popup.offsetWidth / 2)}px`;
            popup.style.top = `${targetRect.top - screenRect.top - popup.offsetHeight}px`;
            popup.addEventListener('animationend', () => popup.remove());
        },

        async performAttack(attacker, defender) {
            const attackStartContext = { source: attacker, target: defender };
            await game.Events.publish(EVENTS.COMBAT_ATTACK_START, attackStartContext);

            const attackerEl = document.getElementById(attacker.combatId);
            if (attacker.type === 'enemy' && attackerEl) this.triggerAnimation(attackerEl, 'combatant-attack');

            const defenseModifier = defender.isDefending ? 0.5 : 1;
            const currentAttackerStats = game.Utils.calculateEffectiveStatsForUnit(attacker);
            let damage = Math.max(1, ((currentAttackerStats.attack || 5) - (defender.effectiveStats.defense || 0)) * defenseModifier);

            const takeDamageStartContext = { source: defender, target: attacker, damageDealt: damage };
            await game.Events.publish(EVENTS.COMBAT_TAKE_DAMAGE_START, takeDamageStartContext);
            
            await new Promise(resolve => setTimeout(resolve, (attacker.type === 'enemy') ? 150 : 0));

            defender.hp = Math.max(0, defender.hp - damage);
            const defenderEl = document.getElementById(defender.combatId);
            if (defenderEl) this.triggerAnimation(defenderEl, 'combatant-hit');
            this.showDamagePopup(damage, defender);

            if (defender.type === 'player') {
                 game.State.get().hp = defender.hp;
                 game.Events.publish(EVENTS.STATE_CHANGED);
            }
            
            const logColor = attacker.type === 'enemy' ? 'var(--log-color-danger)' : 'var(--log-color-success)';
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('attackDamage', { attackerName: attacker.name, defenderName: defender.name, damage: Math.round(damage) }), color: logColor });
            
            const eventContext = { source: attacker, target: defender, damageDealt: damage };
            await game.Events.publish(EVENTS.COMBAT_TAKE_DAMAGE_END, eventContext);
            await game.Events.publish(EVENTS.COMBAT_ATTACK_END, eventContext);

            if (defender.hp === 0) {
                // [修改] 优化日志颜色
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('unitDefeated', { unitName: defender.name }), color: 'var(--log-color-primary)' });
                if(game.State.get().combatState.focusedTargetId === defender.combatId) game.State.get().combatState.focusedTargetId = null;
            }
        },

        async end(outcome) {
            const gameState = game.State.get();
            const combatState = gameState.combatState;
            if (!combatState || combatState.isOver) return;
            combatState.isOver = true;

            const playerCombatant = combatState.playerParty[0];
            gameState.hp = playerCombatant.hp;
            gameState.mp = playerCombatant.mp;
            gameState.activeEffects = playerCombatant.activeEffects;
            game.Events.publish(EVENTS.STATE_CHANGED);

            let message = outcome === 'win' ? (combatState.victoryPrompt || game.Utils.formatMessage('combatWinPrompt')) :
                          outcome === 'loss' ? (combatState.defeatPrompt || game.Utils.formatMessage('combatLossPrompt')) : '';
            
            const logMessage = outcome === 'win' ? game.Utils.formatMessage('combatWin') : outcome === 'loss' ? game.Utils.formatMessage('combatLoss') : '';
            if (logMessage) game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: logMessage, color: outcome === 'win' ? 'var(--log-color-success)' : 'var(--log-color-danger)' });

            if (outcome !== 'fled' && message) await game.UI.showMessage(message);
            
            gameState.isCombat = false; 
            delete gameState.combatState;
            game.UI.isCombatScreenInitialized = false;
            game.State.setUIMode('EXPLORE');

            if (outcome === 'win' && combatState.victoryActionBlock) {
                await game.Actions.executeActionBlock(combatState.victoryActionBlock);
            } else if (outcome === 'loss' && combatState.defeatActionBlock) {
                await game.Actions.executeActionBlock(combatState.defeatActionBlock);
            }
        },

        getCombatActionAvailability() {
            const gameState = game.State.get();
            if (!gameState.isCombat) return {};
            return {
                attack: true, defend: true, flee: gameState.combatState.fleeable,
                skill: false,
                item: gameState.inventory.some(i => gameData.items[i.id]?.type === 'consumable'),
            };
        }
    };

    game.Combat = Combat;

})();