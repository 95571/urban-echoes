/**
 * @file js/ui_menu_system.js
 * @description UI模块 - 系统菜单渲染器 (v64.0.0)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const systemScreenRenderer = {
        render(container) {
            container.innerHTML = '';
            container.appendChild(createElement('h4', { textContent: '存档管理' }));
            const listContainer = createElement('div', {});
            const meta = game.SaveLoad.getMeta();
            const slotsList = createElement('ul', { className: 'save-slot-list' });
            
            Array.from({ length: game.NUM_SAVE_SLOTS }, (_, i) => i + 1).forEach(slot => {
                const slotData = meta[slot];
                const info = slotData ? `${slotData.name} - ${slotData.time}` : '[空]';
                
                const buttons = [
                    createElement('button', { innerHTML: gameData.icons.save, dataset: { action: 'saveGame', slot: slot }, attributes: { title: '保存' }})
                ];
                if (slotData) {
                    buttons.push(createElement('button', { innerHTML: gameData.icons.load, dataset: { action: 'loadGame', slot: slot }, attributes: { title: '读取' }}));
                    buttons.push(createElement('button', { innerHTML: gameData.icons.export, dataset: { action: 'exportSave', slot: slot }, attributes: { title: '导出' }}));
                }
                buttons.push(createElement('button', { innerHTML: gameData.icons.import, dataset: { action: 'importSave', slot: slot }, attributes: { title: '导入' }}));

                slotsList.appendChild(createElement('li', {}, [
                    createElement('div', {}, [
                        createElement('strong', { textContent: `存档 ${slot}` }),
                        createElement('small', { textContent: info, style: { display: 'block', color: 'var(--text-muted-color)' } })
                    ]),
                    createElement('div', { className: 'item-actions' }, buttons)
                ]));
            });
            listContainer.appendChild(slotsList);
            container.appendChild(listContainer);

            container.appendChild(createElement('div', { style: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' } }, [
                createElement('button', { textContent: '回到开始界面', dataset: { action: 'exitToTitle' }, style: { width: '100%' } }),
                createElement('button', { textContent: '删除所有数据并重置游戏', className: 'danger-button', dataset: { action: 'resetGame' }, style: { width: '100%' } })
            ]));
        }
    };

    if (!window.game.UI.menuRenderers) window.game.UI.menuRenderers = {};
    window.game.UI.menuRenderers.SYSTEM = systemScreenRenderer.render.bind(systemScreenRenderer);
})();