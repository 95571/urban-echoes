/**
 * @file js/ui_menus.js
 * @description UI模块 - 菜单渲染器 (v60.0.0 - [重构] 全新状态页面)
 * @author Gemini (CTO)
 * @version 60.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const menuRenderers = {
        STATUS(container) {
            const gameState = game.State.get();
            container.innerHTML = '';
            
            // --- [新增] 初始化状态页的内部状态 ---
            if (this.activeTab === undefined) {
                this.activeTab = 'SKILLS'; 
            }

            // --- [重构] 两栏式布局 ---
            const statusContainer = createElement('div', { id: 'status-container-grid' });
            const leftPanel = createElement('div', { id: 'status-left-panel' });
            const rightPanel = createElement('div', { id: 'status-right-panel' });

            const unit = gameState; // 当前只支持玩家
            const effectiveStats = unit.effectiveStats;

            // --- [重构] 左侧面板：角色核心信息 ---
            leftPanel.append(
                createElement('div', { className: 'status-main-avatar', innerHTML: game.UI.getAvatarHtml(unit) }),
                createElement('div', { className: 'status-main-header' }, [
                    createElement('h3', { textContent: unit.name }),
                    createElement('p', { textContent: '一个刚踏入社会的毕业生，未来充满无限可能。' })
                ]),
                createElement('div', { className: 'status-resource-bars' }, [
                    this.createResourceBar('HP', unit.hp, unit.maxHp),
                    this.createResourceBar('MP', unit.mp, unit.maxMp)
                ]),
                this.renderAttributesGrid(effectiveStats)
            );
            
            // --- [重构] 右侧面板：装备与能力详情 ---
            const tabContainer = createElement('div', { id: 'status-tabs-container' });
            const tabContent = createElement('div', { id: 'status-tab-content' });

            const createTabButton = (tabName, label) => {
                return createElement('button', {
                    className: `status-tab-button ${this.activeTab === tabName ? 'active' : ''}`,
                    textContent: label,
                    eventListeners: { click: () => {
                        this.activeTab = tabName;
                        this.STATUS(container); // 重新渲染整个状态页以更新Tab
                    }}
                });
            };

            tabContainer.append(
                createTabButton('SKILLS', '技能'),
                createTabButton('PERKS', '专长'),
                createTabButton('EFFECTS', '效果')
            );
            
            // --- [新增] 根据激活的Tab渲染内容 ---
            switch (this.activeTab) {
                case 'SKILLS':
                    tabContent.appendChild(this.renderSkillList(unit));
                    break;
                case 'PERKS':
                    tabContent.appendChild(this.renderPerksList(unit));
                    break;
                case 'EFFECTS':
                    tabContent.appendChild(this.renderActiveEffectsList(unit));
                    break;
            }

            rightPanel.append(
                this.renderEquipmentGrid(unit.equipped),
                tabContainer,
                tabContent
            );
            
            statusContainer.append(leftPanel, rightPanel);
            container.appendChild(statusContainer);
        },
        
        createResourceBar(type, current, max) {
            const icon = type === 'HP' ? gameData.icons.health : gameData.icons.energy;
            const barClass = type === 'HP' ? 'hp-bar' : 'mp-bar';
            return createElement('div', { className: `resource-bar ${barClass}`, attributes: { title: `${type}: ${Math.ceil(current)} / ${max}` } }, [
                createElement('div', { className: 'resource-bar-fill', style: { width: (max > 0 ? (current / max) * 100 : 0) + '%' } }),
                createElement('div', { className: 'resource-bar-text', innerHTML: `<span>${icon}</span> ${Math.ceil(current)} / ${max}` })
            ]);
        },

        renderAttributesGrid(stats) {
            const grid = createElement('div', { className: 'status-attributes-grid' });
            const coreStatsList = createElement('ul', { className: 'stat-list' });
            const derivedStatsList = createElement('ul', { className: 'stat-list' });
            
            coreStatsList.appendChild(createElement('li', { className: 'stat-list-header', textContent: '核心属性' }));
            Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).forEach(([key, name]) => {
                coreStatsList.appendChild(createElement('li', {}, [
                    createElement('span', { innerHTML: `${gameData.icons[key]} ${name}` }),
                    createElement('span', { textContent: stats[key] })
                ]));
            });

            derivedStatsList.appendChild(createElement('li', { className: 'stat-list-header', textContent: '派生属性' }));
            [
                { name: `${gameData.icons.attack} 攻击`, value: stats.attack },
                { name: `${gameData.icons.defense} 防御`, value: stats.defense },
                { name: `${gameData.icons.spd} 行动力`, value: stats.spd }
            ].forEach(stat => {
                derivedStatsList.appendChild(createElement('li', {}, [
                    createElement('span', { innerHTML: stat.name }),
                    createElement('span', { textContent: stat.value })
                ]));
            });
            
            grid.append(coreStatsList, derivedStatsList);
            return grid;
        },

        renderEquipmentGrid(equipped) {
            const container = createElement('div', { className: 'status-equipment-display' });
            container.appendChild(createElement('h4', { textContent: '装备' }));
            const grid = createElement('div', { className: 'equipped-grid' });
            for (const slotId in equipped) {
                const slot = equipped[slotId];
                const itemData = slot.itemId ? gameData.items[slot.itemId] : null;
                const card = createElement('div', {
                    className: 'equipped-slot-card',
                    // [修改] 点击装备槽将调用新的动作
                    dataset: { action: 'showEquipmentSelection', slotId: slotId },
                }, [
                    createElement('div', { className: 'slot-icon', style: { backgroundImage: `url('${itemData ? itemData.imageUrl : ''}')` } }),
                    createElement('div', { className: 'slot-item-name', textContent: itemData ? itemData.name : '无' }),
                    createElement('div', { className: 'slot-type-name', textContent: slot.name })
                ]);
                grid.appendChild(card);
            }
            container.appendChild(grid);
            return container;
        },

        renderSkillList(unit) {
            const section = createElement('div', { className: 'skill-list-container' });
            const grid = createElement('div', { className: 'skill-grid-container' });
            const skillState = unit.skillState;
            if (!skillState || Object.keys(skillState).length === 0) {
                grid.appendChild(createElement('p', { className: 'empty-list-text', textContent: '尚未学习任何技能。' }));
                section.appendChild(grid);
                return section;
            }
            for (const skillId in skillState) {
                const state = skillState[skillId];
                const data = gameData.skillLibrary[skillId];
                if (!data) continue;
                const requiredProf = game.Proficiency.getRequiredForLevel(skillId, state.level + 1);
                const progressPercent = requiredProf > 0 && requiredProf !== Infinity ? Math.min(100, (state.proficiency / requiredProf) * 100) : (state.level >= 100 ? 100 : 0);
                const skillEntry = createElement('div', {
                    className: 'skill-list-entry',
                    dataset: { id: skillId }, // Future use: click to see perk tree
                }, [
                    createElement('div', { className: 'skill-list-header' }, [
                        createElement('strong', { textContent: data.name }),
                        createElement('span', { textContent: `Lv. ${state.level}` })
                    ]),
                    createElement('div', { className: 'proficiency-bar', attributes: { title: `熟练度: ${state.level >= 100 ? 'MAX' : `${state.proficiency} / ${requiredProf}`}` } }, [
                        createElement('div', { className: 'proficiency-bar-fill', style: { width: `${progressPercent}%` } })
                    ])
                ]);
                grid.appendChild(skillEntry);
            }
            section.appendChild(grid);
            game.UI.makeListDraggable(section);
            return section;
        },
        
        renderPerksList(unit){
            const section = createElement('div', { className: 'perks-list-container' });
            const list = createElement('ul', { className: 'stat-list perks-list' });
            let hasPerks = false;
            if (unit.skillState) {
                for (const skillId in unit.skillState) {
                    const skillState = unit.skillState[skillId];
                    if (skillState.unlockedPerks && skillState.unlockedPerks.length > 0) hasPerks = true;
                    skillState.unlockedPerks.forEach(perkId => {
                        const perkData = gameData.perkLibrary[perkId];
                        if (!perkData) return;
                        list.appendChild(createElement('li', { attributes: { title: perkData.description } }, [
                            createElement('span', { className: 'perk-icon', textContent: perkData.icon || '✨' }),
                            createElement('span', { textContent: perkData.name })
                        ]));
                    });
                }
            }
            if (!hasPerks) {
                list.appendChild(createElement('p', { className: 'empty-list-text', textContent: '尚未掌握任何专长。' }));
            }
            section.appendChild(list);
            game.UI.makeListDraggable(section);
            return section;
        },

        renderActiveEffectsList(unit) {
            const section = createElement('div', { className: 'effects-list-container' });
            const list = createElement('ul', { className: 'stat-list effects-list' });
            const visibleEffects = (unit.activeEffects || []).filter(effect => !effect.isHidden);

            if(visibleEffects.length === 0) {
                list.appendChild(createElement('p', { className: 'empty-list-text', textContent: '当前没有生效中的状态效果。' }));
            } else {
                visibleEffects.forEach(effect => {
                    const durationText = effect.duration === -1 ? ' (永久)' : ` (剩余 ${effect.duration} 时段)`;
                    list.appendChild(createElement('li', { attributes: { title: effect.description } }, [
                        createElement('span', { innerHTML: `${effect.icon} ${effect.name}` }),
                        createElement('span', { textContent: durationText })
                    ]));
                });
            }
            section.appendChild(list);
            game.UI.makeListDraggable(section);
            return section;
        },

        // --- [修改] INVENTORY 渲染器，移除装备显示 ---
        INVENTORY(container) {
            const gameState = game.State.get();
            container.innerHTML = '';
            // [移除] 不再在此处渲染装备
            // container.appendChild(this.renderEquippedItems(gameState.equipped)); 
            
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
                if (itemData.type === 'consumable') actions.push(createElement('button', { textContent: '使用', dataset: { action: 'useItem', index: item.originalIndex } }));
                if (itemData.slot) actions.push(createElement('button', { textContent: '装备', dataset: { action: 'equipItem', index: item.originalIndex } }));
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
        },

        QUESTS(container) {
            container.innerHTML = '';
            const gameState = game.State.get();

            const activeQuestsList = [];
            const completedQuestsList = [];
            const allJobData = { ...gameData.jobs };

            for (const varId in gameState.variables) {
                if (varId.startsWith('q_')) {
                    const questState = gameState.variables[varId];
                    const jobData = Object.values(allJobData).find(j => j.questVariable === varId);
                    if (!jobData) continue;
                    if (questState === 1) activeQuestsList.push(jobData);
                    else if (questState === 2) completedQuestsList.push(jobData);
                }
            }
            
            const createQuestList = (title, quests) => {
                const listEl = createElement('ul', { className: 'quest-list' });
                if (quests.length === 0) {
                    const emptyText = title === '进行中' ? '当前没有进行中的任务。' : '尚未完成任何值得记录的任务。';
                    listEl.appendChild(createElement('li', {}, [
                        createElement('p', { textContent: emptyText, style: { padding: '10px', color: 'var(--text-muted-color)' } })
                    ]));
                } else {
                    quests.forEach(jobData => {
                        const isMainQuest = jobData.isMain ? 'main-quest' : '';
                        const isCompleted = title === '已完成' ? 'completed' : '';
                        const questEntry = createElement('li', {
                            className: `quest-title-entry ${isMainQuest} ${isCompleted}`,
                            textContent: jobData.title,
                            dataset: { jobId: jobData.id },
                            eventListeners: { click: () => game.UI.showQuestDetails(jobData.id) }
                        });
                        listEl.appendChild(questEntry);
                    });
                }
                
                game.UI.makeListDraggable(listEl);

                return createElement('div', { className: 'quest-section' }, [
                    createElement('h4', { className: 'quest-section-header', textContent: title }),
                    listEl
                ]);
            };

            const questContainer = createElement('div', { className: 'quest-container' }, [
                createQuestList('进行中', activeQuestsList),
                createQuestList('已完成', completedQuestsList)
            ]);
            
            container.appendChild(questContainer);
        },

        PARTY(container) {
            container.innerHTML = '';
            const list = createElement('ul', { className: 'party-member-list' });
            const party = game.State.get().party;
            if (!party || party.length === 0) {
                list.appendChild(createElement('li', { textContent: '你还没有建立任何稳定的人际关系。' }));
                container.appendChild(list);
                return;
            }
            party.forEach(person => {
                const memberItem = createElement('li', { className: 'relationship-entry', dataset: { id: person.id } }, [
                    createElement('div', { className: 'party-member-avatar', innerHTML: game.UI.getAvatarHtml(person) }),
                    createElement('div', { className: 'party-member-info' }, [
                        createElement('strong', { textContent: person.name }),
                        createElement('small', { textContent: person.description })
                    ])
                ]);
                list.appendChild(memberItem);
            });
            container.appendChild(list);
        },

        SYSTEM(container) {
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

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.menuRenderers = menuRenderers;

})();