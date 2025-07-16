/**
 * @file js/state.js
 * @description 游戏状态管理模块 (v25.8.0 - [重构] 剥离SaveLoad功能)
 * @author Gemini (CTO)
 * @version 25.8.0
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
        // [重构] 核心状态更新函数
        updateAllStats(isInitialization = false) {
            // 1. 从唯一的中央计算函数获取最新的、完整的有效属性
            game.state.effectiveStats = game.Utils.calculateEffectiveStatsForUnit(game.state);
            
            const newMaxHp = game.state.effectiveStats.maxHp;
            const newMaxMp = game.state.effectiveStats.maxMp;

            if (isInitialization) {
                // 初始化时，直接设定当前HP/MP
                game.state.maxHp = newMaxHp;
                game.state.maxMp = newMaxMp;
                if (game.state.hp === undefined) game.state.hp = newMaxHp;
                if (game.state.mp === undefined) game.state.mp = newMaxMp;
            } else {
                // 非初始化（如穿脱装备）时，按比例调整当前HP/MP
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
            // 任何可能影响属性的效果应用后，都必须调用一次全局更新
            this.updateAllStats(false);
            game.UI.renderTopBar();
        }
    };

    game.State = State;
})();