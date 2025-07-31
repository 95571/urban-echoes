/**
 * @file js/ui_menu_inventory.js
 * @description UI模块 - 物品菜单渲染器 (v65.0.0 - [BUG修复] 修正物品可用逻辑)
 * @author Gemini (CTO)
 * @version 65.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const inventoryScreenRenderer = {
        render(container) {
            const gameState = game.State.get();
            container.innerHTML = '';
            
            container.appendChild(createElement('h4', { textContent: '背包' }));
            const currentFilter = gameState.menu.inventoryFilter || '全部';
            container.appendChild(this.renderInventoryFilters(currentFilter));
            
            const filteredInventory = gameState.inventory
                .map((item, index) => ({...item, originalIndex: index}))
                .filter(item => {
                    const itemData = gameData.items[item.id];
                    if (!itemData) return false;
                    switch (currentFilter) {
                        case '装备': return !!itemData.slot;
                        case '消耗品': return itemData.type === 'consumable';
                        case '材料': return itemData.type === 'material';
                        case '重要': return itemData.droppable === false;
                        case '全部': default: return true;
                    }
                });
            container.appendChild(this.renderInventoryList(filteredInventory));
        },

        renderInventoryFilters(currentFilter) {
            const filters = ['全部', '装备', '消耗品', '材料', '重要'];
            return createElement('div', { className: 'inventory-filter-tabs' }, 
                filters.map(filter => 
                    createElement('button', {
                        className: `inventory-filter-tab ${filter === currentFilter ? 'active' : ''}`,
                        textContent: filter,
                        dataset: { filter: filter }
                    })
                )
            );
        },

        renderInventoryList(filteredInventory) {
            const list = createElement('ul', { id: 'inventory-list', className: 'menu-list' });
            if (!filteredInventory || filteredInventory.length === 0) {
                list.appendChild(createElement('li', { style: { border: 'none', background: 'transparent' } }, [
                    createElement('p', { textContent: '这里空空如也...', style: { padding: '10px', color: 'var(--text-muted-color)', width: '100%', textAlign: 'center' } })
                ]));
                return list;
            }
            filteredInventory.forEach(item => {
                const itemData = gameData.items[item.id];
                const actions = [];
                
                // [核心修复] 判断物品是否可用的逻辑，从检查type变为检查是否存在onUseActionBlock
                if (itemData.onUseActionBlock) {
                    actions.push(createElement('button', { textContent: '使用', dataset: { action: 'useItem', index: item.originalIndex } }));
                }

                if (itemData.slot) {
                    actions.push(createElement('button', { textContent: '装备', dataset: { action: 'equipItem', index: item.originalIndex } }));
                }
                
                if (itemData.droppable !== false) {
                   actions.push(createElement('button', { textContent: '丢弃', className: 'danger-button', dataset: { action: 'dropItem', index: item.originalIndex } }));
                }

                const listItem = createElement('li', {}, [
                    createElement('div', { className: 'inventory-item-entry', dataset: { index: item.originalIndex } }, [
                        createElement('div', { className: 'item-icon', style: { backgroundImage: `url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')` } }),
                        createElement('span', { className: 'item-name-quantity', textContent: `${itemData.name} x${item.quantity}` })
                    ]),
                    createElement('div', { className: 'item-actions' }, actions)
                ]);
                list.appendChild(listItem);
            });
            game.UI.makeListDraggable(list);
            return list;
        }
    };

    if (!window.game.UI.menuRenderers) window.game.UI.menuRenderers = {};
    window.game.UI.menuRenderers.INVENTORY = inventoryScreenRenderer.render.bind(inventoryScreenRenderer);
})();