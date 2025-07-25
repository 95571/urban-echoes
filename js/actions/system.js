/**
 * @file js/actions/system.js
 * @description 动作模块 - 系统流程控制 (v52.0.0 - 架构升级 "磐石计划")
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions) game.Actions = {};

    Object.assign(game.Actions, {
        showLoadScreen() {
            const meta = game.SaveLoad.getMeta();
            let slotsHtml = '<ul class="save-slot-list">';
            Array.from({ length: game.NUM_SAVE_SLOTS }, (_, i) => i + 1).forEach(slot => {
                const slotData = meta[slot];
                const info = slotData ? `${slotData.name} - ${slotData.time}` : '[空]';
                let buttonsHtml = '';
                if (slotData) {
                    buttonsHtml += `<button data-action="loadGame" data-slot="${slot}" title="读取">${gameData.icons.load}</button>`;
                    buttonsHtml += `<button data-action="exportSave" data-slot="${slot}" title="导出">${gameData.icons.export}</button>`;
                }
                buttonsHtml += `<button data-action="importSave" data-slot="${slot}" title="导入">${gameData.icons.import}</button>`;

                slotsHtml += `
                    <li>
                        <div>
                            <strong>存档 ${slot}</strong>
                            <small style="display:block; color:var(--text-muted-color);">${info}</small>
                        </div>
                        <div class="item-actions">${buttonsHtml}</div>
                    </li>`;
            });
            slotsHtml += '</ul>';
            game.UI.showCustomModal({ title: '杭城旧梦', html: slotsHtml });
        },

        async importSave(slot) {
            if (!slot) return;
            const meta = game.SaveLoad.getMeta();
            if (meta[slot]) {
                const choice = await game.UI.showConfirmation(gameData.systemMessages.overwriteSave);
                if (!choice || !choice.originalOption.value) return;
            }
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            fileInput.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const saveData = JSON.parse(event.target.result);
                        if (!saveData.id || !saveData.name || !saveData.time || !saveData.stats) {
                           throw new Error("Invalid save file format.");
                        }
                        const time = saveData.time;
                        const timeString = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
                        meta[slot] = { name: saveData.name, time: timeString, timestamp: Date.now() };
                        localStorage.setItem(game.SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
                        localStorage.setItem(game.SAVE_META_KEY, JSON.stringify(meta));
                        
                        game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameImported', { slot: slot }), color: 'var(--success-color)' });
                        game.Events.publish(EVENTS.GAME_SAVED); // 发布事件通知UI刷新（例如SYSTEM菜单）

                        game.UI.ModalManager.hideAll();
                        this.showLoadScreen();
                    } catch (err) {
                        game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('errorLoadGame'), color: "var(--error-color)" });
                        console.error("Import save failed:", err);
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },

        newGame() {
            game.State.init(null);
            this.startSequence('character_creation');
        },

        showAchievements() { game.UI.showCustomModal(gameData.systemMessages.achievementsContent); },
        showAbout() { game.UI.showCustomModal(gameData.systemMessages.aboutContent); },
        exitToTitle() { game.State.init(null); },
        setUIMode: game.State.setUIMode,
        showMap() { game.State.setUIMode('MAP'); },
        exitMenu() { game.State.setUIMode(game.State.get().previousGameState || 'EXPLORE'); },
        saveGame(slot) { if (slot) game.SaveLoad.save(slot); },

        async loadGame(slot) {
            if (!slot) return;
            if (game.State.get().gameState === 'TITLE') {
                game.SaveLoad.load(slot);
                return;
            }
            const choice = await game.UI.showConfirmation(gameData.systemMessages.loadConfirm);
            if (choice && choice.originalOption && choice.originalOption.value) {
                game.SaveLoad.load(slot);
            } else {
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
            }
        },
        exportSave(slot) {
            if (!slot) return;
            const savedString = localStorage.getItem(game.SAVE_KEY_PREFIX + slot);
            if (!savedString) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('noSaveFile'), color: "var(--error-color)" });
                return;
            }
            try {
                const saveData = JSON.parse(savedString);
                const fileName = `都市回响-存档-${slot}-${saveData.name}-${new Date().toJSON().slice(0,10)}.json`;
                const fileToSave = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(fileToSave);
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(a.href);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameExported', { slot: slot }), color: 'var(--primary-color)' });
            } catch(e) {
                console.error("Export save failed:", e);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: "导出存档失败！", color: "var(--error-color)" });
            }
        },
        async resetGame() {
            const choice = await game.UI.showConfirmation(gameData.systemMessages.resetConfirm);
            if (choice && choice.originalOption && choice.originalOption.value) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            } else {
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
            }
        },
        paginateHotspots(direction) {
            const state = game.State.get();
            state.hotspotPageIndex = (state.hotspotPageIndex || 0) + parseInt(direction, 10);
            game.Events.publish(EVENTS.UI_RENDER);
        }
    });
})();