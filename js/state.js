/**
 * @file js/state.js
 * @description 游戏状态管理模块 (v59.1.0 - [重构] 适配上下文效果)
 * @author Gemini (CTO)
 * @version 59.1.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const State = {
        init(savedState = null) {
            game.state = savedState ? savedState : JSON.parse(JSON.stringify(gameData.initialPlayerState));
            this.updateAllStats(true);
            this.setUIMode(game.state.gameState);
        },

        updateAllStats(isInitialization = false) {
            game.state.effectiveStats = game.Utils.calculateEffectiveStatsForUnit(game.state);

            const newMaxHp = game.state.effectiveStats.maxHp;
            const newMaxMp = game.state.effectiveStats.maxMp;

            if (isInitialization) {
                game.state.maxHp = newMaxHp;
                game.state.maxMp = newMaxMp;
                if (game.state.hp === undefined) game.state.hp = newMaxHp;
                if (game.state.mp === undefined) game.state.mp = newMaxMp;
            } else {
                const hpRatio = (game.state.maxHp > 0) ? (game.state.hp / game.state.maxHp) : 1;
                const mpRatio = (game.state.maxMp > 0) ? (game.state.mp / game.state.maxMp) : 1;
                game.state.maxHp = newMaxHp;
                game.state.maxMp = newMaxMp;
                game.state.hp = Math.round(newMaxHp * (isNaN(hpRatio) ? 1 : hpRatio));
                game.state.mp = Math.round(newMaxMp * (isNaN(mpRatio) ? 1 : mpRatio));
            }
        },

        get() { return game.state; },

        setUIMode(mode, options = {}) {
            if (mode === 'MENU' && game.state.gameState !== 'MENU' && game.state.gameState !== 'TITLE') {
                game.state.previousGameState = game.state.gameState;
            }
            game.state.gameState = mode;
            if (mode === "MENU") {
                if (!game.state.menu) game.state.menu = {};
                game.state.menu.current = options.screen;

                if (options.screen === 'INVENTORY' && !game.state.menu.inventoryFilter) {
                    game.state.menu.inventoryFilter = '全部';
                }

                if (options.screen !== 'STATUS') game.state.menu.skillDetailView = null;
                if(options.screen !== 'PARTY' && options.screen !== 'STATUS') game.state.menu.statusViewTargetId = null;
            }
            game.Events.publish(EVENTS.UI_RENDER);
        },
        
        /**
         * [修改] applyEffect现在接受 targetUnit 和 triggerContext
         * @param {object} targetUnit - 效果应用的目标单位
         * @param {object} effect - 效果负载, e.g., { hp: 10, gold: -5 }
         * @param {object} [triggerContext={}] - 触发事件的上下文
         */
        applyEffect(targetUnit, effect, triggerContext = {}) {
            if (!effect || !targetUnit) return;
            const state = this.get();
            let changed = false;
            
            // 构建用于公式计算的完整上下文
            const context = { ...targetUnit, ...targetUnit.effectiveStats, context: triggerContext };

            if (effect.stats) {
                for (const stat in effect.stats) {
                    const value = game.Utils.evaluateFormula(effect.stats[stat], context);
                    targetUnit.stats[stat] = Math.max(1, (targetUnit.stats[stat] || 0) + value);
                    changed = true;
                }
            }
            if (typeof effect.gold !== 'undefined') {
                const value = game.Utils.evaluateFormula(effect.gold, context);
                state.gold = Math.max(0, (state.gold || 0) + value);
                changed = true;
            }
            if(typeof effect.hp !== 'undefined') {
                const value = game.Utils.evaluateFormula(effect.hp, context);
                targetUnit.hp = Math.max(0, Math.min(targetUnit.maxHp, (targetUnit.hp || 0) + value));
                changed = true;
            }
            if(typeof effect.mp !== 'undefined') {
                const value = game.Utils.evaluateFormula(effect.mp, context);
                targetUnit.mp = Math.max(0, Math.min(targetUnit.maxMp, (targetUnit.mp || 0) + value));
                changed = true;
            }

            if (changed) {
                // 如果是玩家，则更新全局状态
                if (targetUnit.id === 'player') {
                    this.updateAllStats(false);
                    game.Events.publish(EVENTS.STATE_CHANGED);
                } else {
                    // 如果是其他单位（如敌人），只需确保UI能刷新即可
                    game.Events.publish(EVENTS.UI_RENDER);
                }
            }
        }
    };

    game.State = State;
})();