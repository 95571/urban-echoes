/**
 * @file js/combat.js
 * @description 战斗系统模块 (v52.2.1 - [优化] 调整日志颜色)
 * @author Gemini (CTO)
 * @version 55.2.0
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

            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('encounter'), color: 'var(--error-color)' });
            gameState.isCombat = true;

            const createCombatant = (template, type, combatId) => {
                const combatant = JSON.parse(JSON.stringify(template));
                combatant.effectiveStats = game.Utils.calculateEffectiveStatsForUnit(template);
                combatant.maxHp = combatant.effectiveStats.maxHp;
                combatant.maxMp = combatant.effectiveStats.maxMp;
                combatant.hp = combatant.maxHp;
                combatant.mp = combatant.maxMp;
                combatant.hasTakenExtraTurnThisRound = false;
                combatant.activeEffects = combatant.activeEffects || []; // 确保有效果数组

                if (type === 'player') {
                    combatant.hp = gameState.hp;
                    combatant.mp = gameState.mp;
                    combatant.activeEffects = gameState.activeEffects; // 玩家状态同步
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
            playerCombatant.effectiveStats = gameState.effectiveStats;

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
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('newRound'), color: 'var(--secondary-color)' });
            
            // [修改] 在回合开始时，为所有单位处理效果Tick
            [...cs.playerParty, ...cs.enemies].forEach(u => {
                u.hasTakenExtraTurnThisRound = false;
                if (u.hp > 0) {
                    game.Effects.tick(u);
                }
            });
            
            cs.turnOrder = [...cs.playerParty, ...cs.enemies]
                .filter(u => u.hp > 0)
                .sort((a, b) => (b.effectiveStats.spd || 0) - (a.effectiveStats.spd || 0));
            this.nextTurn();
        },

        nextTurn() {
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

            this.doTurn(unit);
        },

        doTurn(unit) {
            const cs = game.State.get().combatState;
            unit.isDefending = false;
            cs.activeUnit = unit;
            game.Events.publish(EVENTS.UI_RENDER);
            if (unit.type === 'player') {
                this.waitForPlayerInput();
            } else {
                setTimeout(() => {
                    const target = cs.playerParty.find(p => p.hp > 0);
                    if(target) this.performAttack(unit, target);
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

        endTurn(unit) {
            const cs = game.State.get().combatState;
            if (!cs || cs.isOver) return;
            cs.isWaitingForPlayerInput = false;

            const extraTurnCheck = this.checkForExtraTurn(unit);
            if (extraTurnCheck.triggered) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('extraTurnSuccess', {name: unit.name}), color: 'var(--primary-color)' });
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
            const chance = Math.max(0, 0.05 + speedAdvantage * 0.02);
            const cappedChance = Math.min(chance, 0.5);

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

            callback(player);

            if (!game.State.get().isCombat) return;

            cs.isWaitingForPlayerInput = false;
            game.Events.publish(EVENTS.UI_RENDER);

            setTimeout(() => this.endTurn(player), 200);
        },

        playerAttack() { this.playerAction(player => {
            const cs = game.State.get().combatState;
            const livingEnemies = cs.enemies.filter(e => e.hp > 0);
            if (livingEnemies.length === 0) return;
            let target = cs.focusedTargetId ? cs.enemies.find(e => e.combatId === cs.focusedTargetId && e.hp > 0) : null;
            if (!target) {
                target = livingEnemies[0];
                cs.focusedTargetId = target.combatId;
            }
            this.performAttack(player, target);
        })},

        playerDefend() { this.playerAction(player => {
            player.isDefending = true;
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('defendAction', {name: player.name}) });
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
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('fleeFail'), color: 'var(--error-color)' });
            }
        })},

        triggerAnimation(element, animationClass) {
            if (!element || element.classList.contains(animationClass)) return;

            const animationEndHandler = () => {
                element.classList.remove(animationClass);
                element.removeEventListener('animationend', animationEndHandler);
            };
            element.addEventListener('animationend', animationEndHandler);
            element.classList.add(animationClass);
        },

        showDamagePopup(damage, targetUnit) {
             const targetEl = document.getElementById(targetUnit.combatId);
            if (!targetEl) return;

            const screenEl = game.dom.screen;
            const popup = document.createElement('span');
            popup.textContent = '-' + damage;
            popup.className = 'damage-popup';

            screenEl.appendChild(popup);

            const targetRect = targetEl.getBoundingClientRect();
            const screenRect = screenEl.getBoundingClientRect();

            const popupLeft = (targetRect.left + targetRect.width / 2) - screenRect.left - (popup.offsetWidth / 2);
            const popupTop = targetRect.top - screenRect.top - popup.offsetHeight;

            popup.style.left = `${popupLeft}px`;
            popup.style.top = `${popupTop}px`;

            popup.addEventListener('animationend', () => {
                popup.remove();
            });
        },

        performAttack(attacker, defender) {
            const attackerEl = document.getElementById(attacker.combatId);
            const defenderEl = document.getElementById(defender.combatId);

            if (attacker.type === 'enemy' && attackerEl) {
                this.triggerAnimation(attackerEl, 'combatant-attack');
            }

            const defenseModifier = defender.isDefending ? 0.5 : 1;
            let damage = Math.max(1, Math.floor(((attacker.effectiveStats.attack || 5) - (defender.effectiveStats.defense || 0)) * defenseModifier));

            const damageDelay = (attacker.type === 'enemy') ? 150 : 0;

            setTimeout(() => {
                defender.hp = Math.max(0, defender.hp - damage);

                if (defenderEl) {
                    this.triggerAnimation(defenderEl, 'combatant-hit');
                }
                this.showDamagePopup(damage, defender);

                if (defender.type === 'player') {
                    const mainPlayerState = game.State.get();
                    mainPlayerState.hp = defender.hp;
                    game.Events.publish(EVENTS.STATE_CHANGED);
                }
                
                const messageColor = attacker.type === 'enemy' ? 'var(--error-color)' : 'var(--log-color-success)';
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('attackDamage', { attackerName: attacker.name, defenderName: defender.name, damage: damage }), color: messageColor });

                if (defender.hp === 0) {
                    game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('unitDefeated', { unitName: defender.name }), color: 'var(--text-muted-color)' });
                    if(game.State.get().combatState.focusedTargetId === defender.combatId) {
                        game.State.get().combatState.focusedTargetId = null;
                    }
                }
            }, damageDelay);
        },

        async end(outcome) {
            const gameState = game.State.get();
            const combatState = gameState.combatState;
            if (!combatState || combatState.isOver) return;
            combatState.isOver = true;

            let message;
            if (outcome === 'win') {
                message = combatState.victoryPrompt || game.Utils.formatMessage('combatWinPrompt');
            } else if (outcome === 'loss') {
                message = combatState.defeatPrompt || game.Utils.formatMessage('combatLossPrompt');
            } else {
                message = '';
            }
            
            const logMessage = outcome === 'win' ? game.Utils.formatMessage('combatWin') :
                               outcome === 'loss' ? game.Utils.formatMessage('combatLoss') :
                               '';
            const logColor = outcome === 'win' ? 'var(--log-color-success)' : 'var(--error-color)';
            if (logMessage) game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: logMessage, color: logColor });

            if (outcome !== 'fled' && message) {
                 await game.UI.showMessage(message);
            }

            gameState.isCombat = false;
            const victoryActionBlock = combatState.victoryActionBlock;
            const defeatActionBlock = combatState.defeatActionBlock;

            // [修改] 战斗结束后，将战斗中的临时状态同步回主玩家状态
            const playerCombatant = combatState.playerParty[0];
            gameState.hp = playerCombatant.hp;
            gameState.mp = playerCombatant.mp;
            gameState.activeEffects = playerCombatant.activeEffects;

            delete gameState.combatState;
            game.UI.isCombatScreenInitialized = false;
            game.State.setUIMode('EXPLORE');

            if (outcome === 'win' && victoryActionBlock) {
                await game.Actions.executeActionBlock(victoryActionBlock);
            } else if (outcome === 'loss' && defeatActionBlock) {
                await game.Actions.executeActionBlock(defeatActionBlock);
            }
             game.Events.publish(EVENTS.STATE_CHANGED); // 确保战斗结束后UI刷新
        },

        getCombatActionAvailability() {
            const gameState = game.State.get();
            if (!gameState.isCombat) return {};
            return {
                attack: true,
                defend: true,
                skill: false,
                item: gameState.inventory.some(i => gameData.items[i.id]?.type === 'consumable'),
                flee: gameState.combatState.fleeable,
            };
        }
    };

    game.Combat = Combat;

})();