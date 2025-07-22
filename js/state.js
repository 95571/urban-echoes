/**
 * @file js/state.js
 * @description 游戏状态管理模块 (v45.1.0 - [修复] 修正布局重构后的函数调用)
 * @author Gemini (CTO)
 * @version 45.1.0
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
            game.UI.render();
        },

        applyEffect(effect) {
            if (!effect) return;
            const state = game.state;
            if (effect.stats) {
                for (const stat in effect.stats) {
                    state.stats[stat] = Math.max(1, (state.stats[stat] || 0) + effect.stats[stat]);
                }
            }
            if (typeof effect.gold === 'number') {
                state.gold = Math.max(0, (state.gold || 0) + effect.gold);
            }
            if(typeof effect.hp === 'number') {
                state.hp = Math.max(0, Math.min(state.maxHp, state.hp + effect.hp));
            }
            if(typeof effect.mp === 'number') {
                state.mp = Math.max(0, Math.min(state.maxMp, state.mp + effect.mp));
            }
            this.updateAllStats(false);
            // [修复] 调用重构后的函数名
            if (game.state.gameState !== 'TITLE') {
                game.UI.renderLeftPanel();
            }
        }
    };

    game.State = State;
})();