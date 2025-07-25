/**
 * @file js/ui_menus.js
 * @description UI模块 - 菜单渲染器 (v54.4.0 - [修复] 恢复被误删的任务日志(QUESTS)渲染器)
 * @author Gemini (CTO)
 * @version 54.4.0
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

            if (gameState.menu.skillDetailView) {
                this.renderSkillDetail(container, gameState.menu.skillDetailView);
                return;
            }
            
            const targetId = gameState.menu.statusViewTargetId;
            const isPlayer = !targetId;
            const unit = isPlayer ? gameState : gameState.party.find(p => p.id === targetId);
            
            if (!unit) {
                container.appendChild(createElement('p', { textContent: '错误：找不到要查看的角色。' }));
                container.appendChild(createElement('button', { textContent: '返回', className: 'back-button', dataset: { action: 'backToPartyScreen' } }));
                return;
            }

            if (!isPlayer) {
                 container.appendChild(createElement('button', { textContent: '返回人际关系', className: 'back-button', dataset: { action: 'backToPartyScreen' } }));
            }

            const avatar = createElement('div', { className: 'status-avatar-area', innerHTML: game.UI.getAvatarHtml(unit) });
            const header = createElement('div', { className: 'status-header' }, [
                createElement('h3', { textContent: unit.name }),
                createElement('p', { textContent: isPlayer ? '一个刚踏入社会的毕业生，未来充满无限可能。' : (unit.description || "暂无更多信息。"), style: { padding: '0 10px', lineHeight: '1.6' } })
            ]);

            container.appendChild(avatar);
            container.appendChild(header);

            if (isPlayer) {
                const effectiveStats = unit.effectiveStats;
                const playerSectionsContainer = createElement('div', {});
                const coreStatsSection = createElement('div', { className: 'status-section' }, [ createElement('h4', { textContent: '核心属性' }) ]);
                const coreStatsList = createElement('ul', { className: 'stat-list core-stats' });
                Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).forEach(([key, name]) => {
                    coreStatsList.appendChild(createElement('li', {}, [
                        createElement('span', { innerHTML: `${gameData.icons[key]} ${name}` }),
                        createElement('span', { textContent: effectiveStats[key] })
                    ]));
                });
                coreStatsSection.appendChild(coreStatsList);
                playerSectionsContainer.appendChild(coreStatsSection);
                const derivedStatsSection = createElement('div', { className: 'status-section' }, [ createElement('h4', { textContent: '派生属性' }) ]);
                const derivedStatsList = createElement('ul', { className: 'stat-list' });
                [
                    { name: `${gameData.icons.health} 健康上限`, value: effectiveStats.maxHp },
                    { name: `${gameData.icons.energy} 精力上限`, value: effectiveStats.maxMp },
                    { name: `${gameData.icons.attack} 攻击`, value: effectiveStats.attack },
                    { name: `${gameData.icons.defense} 防御`, value: effectiveStats.defense },
                    { name: `${gameData.icons.spd} 行动力`, value: effectiveStats.spd }
                ].forEach(stat => {
                    derivedStatsList.appendChild(createElement('li', {}, [
                        createElement('span', { innerHTML: stat.name }),
                        createElement('span', { textContent: stat.value })
                    ]));
                });
                derivedStatsSection.appendChild(derivedStatsList);
                playerSectionsContainer.appendChild(derivedStatsSection);
                playerSectionsContainer.appendChild(this.renderPerksList(unit));
                playerSectionsContainer.appendChild(this.renderSkillList(unit));
                container.appendChild(playerSectionsContainer);
            }
        },

        renderPerksList(unit){
            const section = createElement('div', { className: 'status-section' });
            section.appendChild(createElement('h4', { textContent: '已掌握专长' }));
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
                            createElement('span', { className: 'perk-icon', textContent: '✨' }),
                            createElement('span', { textContent: perkData.name })
                        ]));
                    });
                }
            }
            if (!hasPerks) {
                list.appendChild(createElement('li', { textContent: '尚未掌握任何专长。' }));
            }
            section.appendChild(list);
            return section;
        },

        renderSkillList(unit) {
            const section = createElement('div', { className: 'status-section' });
            section.appendChild(createElement('h4', { textContent: '技能熟练度' }));
            const grid = createElement('div', { className: 'skill-grid-container' });
            const skillState = unit.skillState;
            if (!skillState || Object.keys(skillState).length === 0) {
                grid.appendChild(createElement('p', { textContent: '尚未学习任何技能。' }));
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
                    dataset: { id: skillId },
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
            return section;
        },

        renderSkillDetail(container, skillId) {
            const gameState = game.State.get();
            const skillData = gameData.skillLibrary[skillId];
            const skillState = gameState.skillState[skillId];
            container.appendChild(createElement('button', { textContent: '返回状态页', className: 'back-button', dataset: { action: 'viewSkillDetail', id: '' } }));
            if (!skillData || !skillState) {
                container.appendChild(createElement('p', { textContent: '无法找到技能详情。' }));
                return;
            }
            container.appendChild(createElement('div', { style: { textAlign: 'center', margin: '1rem 0' } }, [
                createElement('h3', { textContent: `${skillData.name} - 专长树` }),
                createElement('p', { textContent: skillData.description })
            ]));
            const perkTreeContainer = createElement('div', { className: 'perk-tree-container' });
            const perksByTier = {};
            if (skillData.perkTree) {
                for (const level in skillData.perkTree) {
                    skillData.perkTree[level].forEach(perkId => {
                        if (!perksByTier[level]) perksByTier[level] = [];
                        perksByTier[level].push(perkId);
                    });
                }
            }
            Object.keys(perksByTier).sort((a,b) => a-b).forEach(level => {
                const tierDiv = createElement('div', { className: 'perk-tier' });
                tierDiv.appendChild(createElement('h4', { className: 'perk-tier-header', textContent: `等级 ${level} 自动解锁` }));
                const nodesList = createElement('div', { className: 'perk-nodes-list' });
                perksByTier[level].forEach(perkId => {
                    const perkData = gameData.perkLibrary[perkId];
                    const isLearned = skillState.unlockedPerks.includes(perkId);
                    const node = createElement('div', { className: 'perk-node' }, [
                        createElement('div', { className: 'perk-node-icon', textContent: '✨' }),
                        createElement('div', { className: 'perk-node-info' }, [
                            createElement('strong', { textContent: perkData.name }),
                            createElement('small', { textContent: perkData.description })
                        ]),
                        isLearned ? createElement('span', { 
                            textContent: '✓ 已掌握', 
                            style: { color: 'var(--success-color)', gridColumn: '1 / -1', fontWeight: 'bold', fontSize: '0.9em', marginTop: '5px' }
                        }) : null
                    ].filter(Boolean));
                    nodesList.appendChild(node);
                });
                tierDiv.appendChild(nodesList);
                perkTreeContainer.appendChild(tierDiv);
            });
            container.appendChild(perkTreeContainer);
        },

        INVENTORY(container) {
            const gameState = game.State.get();
            container.innerHTML = '';
            container.appendChild(this.renderEquippedItems(gameState.equipped));
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

        renderEquippedItems(equipped) {
            const fragment = document.createDocumentFragment();
            fragment.appendChild(createElement('h4', { textContent: '装备中' }));
            const grid = createElement('div', { id: 'equipped-grid', className: 'equipped-grid' });
            for (const slotId in equipped) {
                const slot = equipped[slotId];
                const itemData = slot.itemId ? gameData.items[slot.itemId] : null;
                const card = createElement('div', {
                    className: 'equipped-slot-card',
                    dataset: itemData ? { action: 'showEquippedItemDetails', slotId: slotId, itemId: slot.itemId } : {},
                    eventListeners: itemData ? { click: () => game.UI.showEquippedItemDetails(slot.itemId, slotId) } : {}
                }, [
                    createElement('div', { className: 'slot-icon', style: { backgroundImage: `url('${itemData ? itemData.imageUrl : ''}')` } }),
                    createElement('div', { className: 'slot-item-name', textContent: itemData ? itemData.name : '无' }),
                    createElement('div', { className: 'slot-type-name', textContent: slot.name })
                ]);
                grid.appendChild(card);
            }
            fragment.appendChild(grid);
            return fragment;
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
                actions.push(createElement('button', { textContent: '丢弃', className: 'danger-button', dataset: { action: 'dropItem', index: item.originalIndex } }));
                const listItem = createElement('li', {}, [
                    createElement('div', { className: 'inventory-item-entry', dataset: { index: item.originalIndex } }, [
                        createElement('div', { className: 'item-icon', style: { backgroundImage: `url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')` } }),
                        createElement('span', { className: 'item-name-quantity', textContent: `${itemData.name} x${item.quantity}` })
                    ]),
                    createElement('div', { className: 'item-actions' }, actions)
                ]);
                list.appendChild(listItem);
            });
            return list;
        },

        // --- [新增] 任务日志渲染器 ---
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
                game.UI.ModalManager.makeListDraggable(listEl);
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