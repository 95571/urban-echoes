/**
 * @file js/ui_menu_status.js
 * @description UI模块 - 状态菜单渲染器 (v64.0.0)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const statusScreenRenderer = {
        render(container) {
            const gameState = game.State.get();
            container.innerHTML = '';
            
            if (this.activeTab === undefined) {
                this.activeTab = 'SKILLS'; 
            }

            const statusContainer = createElement('div', { id: 'status-container-grid' });
            const leftPanel = createElement('div', { id: 'status-left-panel' });
            const rightPanel = createElement('div', { id: 'status-right-panel' });

            const unit = gameState;
            const effectiveStats = unit.effectiveStats;

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
            
            const tabContainer = createElement('div', { id: 'status-tabs-container' });
            const tabContent = createElement('div', { id: 'status-tab-content' });

            const createTabButton = (tabName, label) => {
                return createElement('button', {
                    className: `status-tab-button ${this.activeTab === tabName ? 'active' : ''}`,
                    textContent: label,
                    eventListeners: { click: () => {
                        this.activeTab = tabName;
                        this.render(container);
                    }}
                });
            };

            tabContainer.append(
                createTabButton('SKILLS', '技能'),
                createTabButton('PERKS', '专长'),
                createTabButton('EFFECTS', '效果')
            );
            
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
        }
    };

    if (!window.game.UI.menuRenderers) window.game.UI.menuRenderers = {};
    window.game.UI.menuRenderers.STATUS = statusScreenRenderer.render.bind(statusScreenRenderer);
})();