/**
 * @file js/save_load.js
 * @description 游戏存读档模块 (v25.8.0 - [新增] 模块独立)
 * @author Gemini (CTO)
 * @version 25.8.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const SaveLoad = {
        getMeta() { try { return JSON.parse(localStorage.getItem(game.SAVE_META_KEY)) || {}; } catch { return {}; } },
        
        async save(slot) {
            const gameState = game.State.get();
            if (gameState.isCombat || gameState.gameState === 'SEQUENCE' || game.UI.ModalManager.stack.length > 0) {
                game.UI.log(game.Utils.formatMessage('errorCannotSave'), 'var(--error-color)');
                return;
            }
            const meta = this.getMeta();
            const choice = meta[slot] ? await game.UI.showConfirmation({title: `确定要覆盖存档 ${slot} 吗？`, options: [{text: '覆盖', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]}) : {value: true};
            
            const confirmed = choice.originalOption ? choice.originalOption.value : choice.value;
            if (!confirmed) return;

            try {
                // 在保存前，移除临时的有效属性，只保存基础属性
                const stateToSave = JSON.parse(JSON.stringify(gameState));
                delete stateToSave.effectiveStats; 

                const time = stateToSave.time;
                const timeString = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
                meta[slot] = { name: stateToSave.name, time: timeString, timestamp: Date.now() };
                localStorage.setItem(game.SAVE_KEY_PREFIX + slot, JSON.stringify(stateToSave));
                localStorage.setItem(game.SAVE_META_KEY, JSON.stringify(meta));
                game.UI.log(game.Utils.formatMessage('gameSaved', { slot: slot }), 'var(--success-color)');
            } catch (e) { game.UI.log(game.Utils.formatMessage('errorSaveGame'), "var(--error-color)"); console.error("Save failed: ", e); }
            this.renderSystemMenu();
        },

        async load(slot) {
            game.UI.ModalManager.hideAll();

            setTimeout(() => {
                try {
                    const savedString = localStorage.getItem(game.SAVE_KEY_PREFIX + slot);
                    if (!savedString) throw new Error('Save file not found');
                    
                    const savedState = JSON.parse(savedString);
                    
                    game.state = savedState;
                    // 读取存档后，立刻调用全局更新来重新计算并生成最新的有效属性
                    game.State.updateAllStats(true);
                    
                    game.UI.render(); 
                    
                    game.UI.log(game.Utils.formatMessage('gameLoaded', { slot: slot }), 'var(--primary-color)');

                } catch (e) { 
                    game.UI.log(game.Utils.formatMessage('errorLoadGame'), "var(--error-color)"); 
                    console.error("Load failed: ", e);
                    game.Actions.exitToTitle();
                }
            }, 250);
        },
        
        renderSystemMenu() {
            if(game.State.get().gameState === 'MENU' && game.State.get().menu.current === 'SYSTEM') {
                const contentEl = document.getElementById('menu-content');
                if(contentEl) game.UI.menuRenderers.SYSTEM(contentEl);
            }
        }
    };

    game.SaveLoad = SaveLoad;
})();