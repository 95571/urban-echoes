/**
 * @file js/actions/system.js
 * @description 动作模块 - 系统流程控制 (v47.0.0 - [引擎] 新增场景交互分页动作)
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
                        <div class="item-actions">
                            ${buttonsHtml}
                        </div>
                    </li>
                `;
            });
            slotsHtml += '</ul>';

            game.UI.showCustomModal('杭城旧梦', slotsHtml);
        },

        async importSave(slot) {
            if (!slot) return;
            const meta = game.SaveLoad.getMeta();

            if (meta[slot]) {
                const choice = await game.UI.showConfirmation({
                    title: '确认覆盖', text: `此操作将覆盖“存档 ${slot}”中的现有数据，是否继续？`,
                    options: [{ text: '覆盖', value: true, class: 'danger-button' }, { text: '取消', value: false, class: 'secondary-action' }]
                });
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

                        game.UI.log(game.Utils.formatMessage('gameImported', { slot: slot }), 'var(--success-color)');
                        game.SaveLoad.renderSystemMenu();

                    } catch (err) {
                        game.UI.log(game.Utils.formatMessage('errorLoadGame'), "var(--error-color)");
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

        showAchievements() {
            game.UI.showConfirmation(gameData.systemMessages.achievementsContent);
        },
        showAbout() {
            game.UI.showConfirmation(gameData.systemMessages.aboutContent);
        },
        exitToTitle() {
            game.State.init(null);
        },
        setUIMode: game.State.setUIMode,
        showMap() {
            game.State.setUIMode('MAP');
        },
        exitMenu() {
            const gameState = game.State.get();
            game.State.setUIMode(gameState.previousGameState || 'EXPLORE');
        },
        saveGame(slot) { if (slot) game.SaveLoad.save(slot); },

        async loadGame(slot) {
            if (!slot) return;
            if (game.State.get().gameState === 'TITLE') {
                game.SaveLoad.load(slot);
                return;
            }
            const choice = await game.UI.showConfirmation({
                title: '确认加载', text: '加载新存档将覆盖当前未保存的进度，确定要继续吗？',
                options: [
                    { text: '加载', value: true, class: 'danger-button' },
                    { text: '取消', value: false, class: 'secondary-action' }
                ]
            });
            if (choice && choice.originalOption && choice.originalOption.value) {
                game.SaveLoad.load(slot);
            }
        },
        exportSave(slot) {
            if (!slot) return;
            const savedString = localStorage.getItem(game.SAVE_KEY_PREFIX + slot);
            if (!savedString) {
                game.UI.log(game.Utils.formatMessage('noSaveFile'), "var(--error-color)");
                return;
            }
            try {
                const saveData = JSON.parse(savedString);
                const fileName = `都市回响-存档-${slot}-${saveData.name}-${new Date().toJSON().slice(0,10)}.json`;
                const fileToSave = new Blob([JSON.stringify(saveData, null, 2)], {
                    type: 'application/json'
                });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(fileToSave);
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(a.href);
                game.UI.log(game.Utils.formatMessage('gameExported', { slot: slot }), 'var(--primary-color)');
            } catch(e) {
                console.error("Export save failed:", e);
                game.UI.log("导出存档失败！", "var(--error-color)");
            }
        },
        async resetGame() {
            const choice = await game.UI.showConfirmation({
                title: "【危险】确定要删除所有存档并重置游戏吗？",
                options: [{text: '全部删除', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]
            });
            if (choice && choice.originalOption && choice.originalOption.value) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        },
        // [新增] 场景交互分页动作
        paginateHotspots(direction) {
            const state = game.State.get();
            const newIndex = (state.hotspotPageIndex || 0) + parseInt(direction, 10);

            // 这个动作只负责修改页码，渲染逻辑会在 ui_screens.js 中处理边界判断
            state.hotspotPageIndex = newIndex;
            game.UI.render();
        }
    });
})();