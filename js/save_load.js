/**
 * @file js/save_load.js
 * @description 游戏存读档模块 (v52.1.0 - [优化] 调整日志颜色)
 * @author Gemini (CTO)
 * @version 52.1.0
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
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('errorCannotSave'), color: 'var(--error-color)' });
                return;
            }
            const meta = this.getMeta();
            const choice = meta[slot] ? await game.UI.showConfirmation({title: `确定要覆盖存档 ${slot} 吗？`, options: [{text: '覆盖', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]}) : {value: true};
            
            const confirmed = choice.originalOption ? choice.originalOption.value : choice.value;
            if (!confirmed) {
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
                return;
            }

            try {
                const stateToSave = JSON.parse(JSON.stringify(gameState));
                delete stateToSave.effectiveStats; 

                const time = stateToSave.time;
                const timeString = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
                meta[slot] = { name: stateToSave.name, time: timeString, timestamp: Date.now() };
                localStorage.setItem(game.SAVE_KEY_PREFIX + slot, JSON.stringify(stateToSave));
                localStorage.setItem(game.SAVE_META_KEY, JSON.stringify(meta));
                
                // [修改] 使用新的高亮日志颜色
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameSaved', { slot: slot }), color: 'var(--log-color-success)' });
                game.Events.publish(EVENTS.GAME_SAVED);

            } catch (e) { 
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('errorSaveGame'), color: "var(--error-color)" });
                console.error("Save failed: ", e); 
            }
        },

        async load(slot) {
            game.UI.ModalManager.hideAll();

            setTimeout(() => {
                try {
                    const savedString = localStorage.getItem(game.SAVE_KEY_PREFIX + slot);
                    if (!savedString) throw new Error('Save file not found');
                    
                    const savedState = JSON.parse(savedString);
                    
                    game.state = savedState;
                    game.State.updateAllStats(true);
                    
                    game.Events.publish(EVENTS.GAME_LOADED); 
                    
                    // [修改] 使用新的高亮日志颜色
                    game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameLoaded', { slot: slot }), color: 'var(--log-color-primary)' });

                } catch (e) { 
                    game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('errorLoadGame'), color: "var(--error-color)" }); 
                    console.error("Load failed: ", e);
                    game.Actions.exitToTitle();
                }
            }, 250);
        }
    };

    game.SaveLoad = SaveLoad;
})();