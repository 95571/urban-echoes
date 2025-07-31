/**
 * @file js/ui_modals.js
 * @description UI模块 - 自定义弹窗管理器 (v64.0.0 - [BUG修复] 修正物品详情的使用按钮逻辑)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    function _createItemDetailBlock(itemData, item) {
        const displayData = itemData || {
            name: '无装备',
            description: '该槽位当前没有装备任何物品。',
            useDescription: '没有可用的效果。',
            imageUrl: ''
        };
        const displayItem = item || { quantity: 0 };

        const content = createElement('div', { className: 'item-details-content' }, [
            createElement('div', { className: 'item-details-image', style: { backgroundImage: `url('${displayData.imageUrl}')` } }),
            createElement('div', { className: 'item-details-info' }, [
                createElement('h4', { textContent: `${displayData.name}${displayItem.quantity > 1 ? ` &times;${displayItem.quantity}`: ''}` }),
                createElement('p', { textContent: displayData.description })
            ]),
            createElement('div', { className: 'item-details-effects' }, [
                createElement('h4', { textContent: '效果' }),
                createElement('div', { className: 'item-details-effects-list' }, [
                    createElement('p', { innerHTML: displayData.useDescription })
                ])
            ])
        ]);
        game.UI.makeListDraggable(content.querySelector('.item-details-effects-list'));
        return content;
    }
    
    const ModalManager = {
        stack: [],
        baseZIndex: 1200,
        async push(modalConfig) {
            return new Promise(resolve => {
                modalConfig.resolve = resolve;
                const newModalEl = this.createModalElement(modalConfig, this.stack.length);
                modalConfig.domElement = newModalEl;
                this.stack.push(modalConfig);
                game.dom['main-content'].appendChild(newModalEl);
                setTimeout(() => newModalEl.classList.add('visible'), 10);
            });
        },
        pop() {
            if (this.stack.length === 0) return;
            const modalToPop = this.stack.pop();
            if (modalToPop.domElement) {
                modalToPop.domElement.classList.remove('visible');
                setTimeout(() => modalToPop.domElement.remove(), 200);
            }
        },
        hideAll() { while(this.stack.length > 0) this.pop(); },
        resolveCurrent(value) {
            if (this.stack.length === 0) return;
            const currentModal = this.stack[this.stack.length - 1];
            if (currentModal.resolve) currentModal.resolve(value);
            this.pop();
        },
        
        refreshTopModal() {
            if (this.stack.length === 0) return;

            const modalConfig = this.stack[this.stack.length - 1];
            const oldElement = modalConfig.domElement;
            
            if (!oldElement || !oldElement.parentNode) return;

            const newElement = this.createModalElement(modalConfig, this.stack.length - 1);
            newElement.classList.add('visible');
            
            modalConfig.domElement = newElement;
            oldElement.parentNode.replaceChild(newElement, oldElement);
        },

        createModalElement(modalConfig, stackIndex) {
            const zIndex = this.baseZIndex + stackIndex * 10;
            let overlay;
            switch(modalConfig.type) {
                case 'job_board':           overlay = this.createJobBoardDOM(modalConfig); break;
                case 'job_details':         overlay = this.createJobDetailsDOM(modalConfig); break;
                case 'quest_details':       overlay = this.createQuestDetailsDOM(modalConfig); break;
                case 'item_details':        overlay = this.createItemDetailsDOM(modalConfig); break;
                case 'quantity_prompt':     overlay = this.createQuantityPromptDOM(modalConfig); break;
                case 'confirmation':        overlay = this.createConfirmationDOM(modalConfig); break;
                case 'equipment_selection': overlay = this.createEquipmentSelectionDOM(modalConfig); break;
                default:                    overlay = this.createCustomModalDOM(modalConfig); break;
            }
            overlay.style.zIndex = zIndex;

            if (modalConfig.type === 'item_details' && modalConfig.payload.isFromEquipSelection) {
                overlay.classList.add('equip-detail-view');
            }

            return overlay;
        },

        createModalFrame(title, contentEl, actionsEl, isLarge = false) {
            const contentElements = Array.isArray(contentEl) ? contentEl : [contentEl];
            const actionsElements = Array.isArray(actionsEl) ? actionsEl : (actionsEl ? [actionsEl] : []);

            const box = createElement('div', { className: `custom-modal-box ${isLarge ? 'large' : ''}` }, [
                createElement('h3', { className: 'custom-modal-title', textContent: title }),
                createElement('div', { className: 'custom-modal-content' }, contentElements),
                actionsElements.length > 0 ? createElement('div', { className: 'custom-modal-actions' }, actionsElements) : null
            ].filter(Boolean));

            const overlay = createElement('div', {
                className: 'custom-modal-overlay',
                eventListeners: { click: (e) => { if (e.target === overlay) this.resolveCurrent(null); } }
            }, [box]);
            
            return overlay;
        },

        createConfirmationDOM(modalConfig) {
            const { title, html, options } = modalConfig.payload;
            const content = createElement('div', { innerHTML: html });
            
            const actionButtons = (options || []).map(opt =>
                createElement('button', {
                    textContent: opt.text,
                    className: opt.class || '',
                    eventListeners: { click: () => this.resolveCurrent({ value: opt.value, originalOption: opt }) }
                })
            );

            return this.createModalFrame(title, content, actionButtons);
        },

        createCustomModalDOM(modalConfig) {
            const { title, html } = modalConfig.payload;
            const content = createElement('div', { innerHTML: html });
            const closeButton = createElement('button', {
                className: 'secondary-action custom-modal-close-btn',
                textContent: '关闭',
                eventListeners: { click: () => this.resolveCurrent(null) }
            });
            return this.createModalFrame(title, content, closeButton);
        },

        createItemDetailsDOM(modalConfig) {
            const { item, itemData, index, isEquipped, slotId, isFromEquipSelection } = modalConfig.payload;
            const content = _createItemDetailBlock(itemData, item);
            const actionButtons = [];

            if (isEquipped) {
                actionButtons.push(createElement('button', { 
                    textContent: '卸下', 
                    eventListeners: { click: async () => {
                        await game.Actions.unequipItem(slotId);
                        this.hideAll();
                    }}
                }));
            } else {
                // [核心修复] 统一使用 onUseActionBlock 判断是否可使用
                if (itemData.onUseActionBlock) {
                    actionButtons.push(createElement('button', {
                        textContent: '使用',
                        eventListeners: { click: async () => {
                            await game.Actions.useItem(index);
                        }}
                    }));
                }
                if (itemData.slot) {
                    actionButtons.push(createElement('button', {
                        textContent: '装备',
                        eventListeners: { click: async () => {
                            await game.Actions.equipItem(index);
                            if (isFromEquipSelection) {
                                this.pop();
                                this.refreshTopModal();
                            } else {
                                this.hideAll();
                            }
                        }}
                    }));
                }
                if (itemData.droppable !== false && !isFromEquipSelection) {
                    actionButtons.push(createElement('button', {
                        textContent: '丢弃',
                        className: 'danger-button',
                        eventListeners: { click: async () => {
                            await game.Actions.dropItem(index);
                        }}
                    }));
                }
            }

            const closeButton = createElement('button', {
                textContent: '关闭',
                className: 'secondary-action',
                eventListeners: { click: (e) => { e.stopPropagation(); this.resolveCurrent(null); }}
            });
            const allButtons = [...actionButtons, closeButton];
            return this.createModalFrame('物品详情', content, allButtons);
        },
        
        createJobBoardDOM(modalConfig) {
            const { title, jobs } = modalConfig.payload;
            const jobList = createElement('ul', { className: 'job-list' });
            
            if (jobs && jobs.length > 0) {
                const availableJobs = jobs.filter(job => {
                    const jobData = gameData.jobs[job.id];
                    return jobData && (game.State.get().variables[jobData.questVariable] || 0) === 0;
                });
                if (availableJobs.length > 0) {
                    availableJobs.forEach(job => {
                        const jobData = gameData.jobs[job.id];
                        const jobItem = createElement('li', {
                            className: 'job-item',
                            dataset: { jobId: job.id },
                            eventListeners: { click: () => game.UI.showJobDetails(job.id) }
                        }, [
                            createElement('h4', { textContent: jobData.title }),
                            createElement('p', { innerHTML: `报酬: <span class="job-reward">${jobData.reward}</span>` })
                        ]);
                        jobList.appendChild(jobItem);
                    });
                } else {
                    jobList.appendChild(createElement('li', {}, [createElement('p', { textContent: '所有可接的任务都在进行中。', style: { padding: '10px', color: 'var(--text-muted-color)' } })]));
                }
            } else {
                 jobList.appendChild(createElement('li', {}, [createElement('p', { textContent: '目前没有新的兼职信息。' })]));
            }
            
            game.UI.makeListDraggable(jobList);
            const content = createElement('div', { className: 'job-board-content' }, [jobList]);
            const closeButton = createElement('button', { textContent: '关闭', className: 'secondary-action', eventListeners: { click: () => this.resolveCurrent(null) } });
            
            return this.createModalFrame(title, content, closeButton, true);
        },

        createJobDetailsDOM(modalConfig) {
            const { jobId } = modalConfig.payload;
            const jobData = gameData.jobs[jobId];
            let content, actions;

            if (jobData) {
                const requirementsMet = game.ConditionChecker.evaluate(jobData.requirements);
                const requirementsText = (jobData.requirements && jobData.requirements.length > 0) 
                    ? jobData.requirements.map(r => r.text).join('，') 
                    : '无';

                content = createElement('div', { className: 'job-details-content' }, [
                    createElement('h4', { textContent: '任务描述' }),
                    createElement('p', { textContent: jobData.description }),
                    createElement('h4', { textContent: '任务要求' }),
                    createElement('p', { textContent: requirementsText, style: { color: !requirementsMet ? 'var(--error-color)' : '' } }),
                    createElement('h4', { textContent: '任务报酬' }),
                    createElement('p', {}, [createElement('strong', { textContent: jobData.reward })])
                ]);

                const acceptButtonConfig = {
                    textContent: '接受任务',
                    eventListeners: { click: async () => { 
                        await game.Actions.acceptJob(jobId);
                        this.pop();
                        this.refreshTopModal();
                    }}
                };

                if (!requirementsMet) {
                    acceptButtonConfig.attributes = { disabled: true };
                }
                
                actions = [
                    createElement('button', { textContent: '返回', className: 'secondary-action', eventListeners: { click: () => this.pop() } }),
                    createElement('button', acceptButtonConfig)
                ];

            } else {
                content = createElement('p', { textContent: '错误：找不到兼职信息。'});
                actions = [createElement('button', { textContent: '返回', className: 'secondary-action', eventListeners: { click: () => this.pop() } })];
            }

            return this.createModalFrame(jobData ? jobData.title : '兼职详情', content, actions);
        },

        createQuestDetailsDOM(modalConfig) {
            const { jobData, questInstance, status } = modalConfig.payload;
            
            let objectivesHtml = '';
            if (status === 'active' && questInstance && questInstance.objectives) {
                objectivesHtml = `<h4>任务目标</h4><ul>${questInstance.objectives.map(obj => `<li>- ${obj.text} (${obj.current || 0}/${obj.target})</li>`).join('')}</ul>`;
            } else if (status === 'completed') {
                objectivesHtml = `<h4>任务目标</h4><p>已完成</p>`;
            }

            const content = createElement('div', { 
                className: 'quest-details-content',
                innerHTML: `<h4>任务描述</h4><p>${jobData.description}</p>${objectivesHtml}<h4>任务报酬</h4><p><strong>${jobData.reward}</strong></p>`
            });
            const closeButton = createElement('button', { textContent: '关闭', className: 'secondary-action', eventListeners: { click: () => this.resolveCurrent(null) } });
            
            return this.createModalFrame(jobData.title, content, closeButton);
        },

        createQuantityPromptDOM(modalConfig) {
            const { title, max } = modalConfig.payload;
            const input = createElement('input', { className: 'quantity-input', attributes: { type: 'number', value: 1, min: 1, max: max } });
            const slider = createElement('input', { className: 'quantity-slider', attributes: { type: 'range', value: 1, min: 1, max: max } });

            const syncValues = (source) => {
                let value = Math.max(1, Math.min(max, parseInt(source.value, 10) || 1));
                input.value = value;
                slider.value = value;
            };
            input.oninput = () => syncValues(input);
            slider.oninput = () => syncValues(slider);
            
            const content = createElement('div', { className: 'quantity-prompt-content' }, [
                createElement('div', { className: 'quantity-prompt-header', textContent: title }),
                createElement('div', { className: 'quantity-controls' }, [input, slider])
            ]);
            
            const actions = [
                createElement('button', { textContent: '取消', className: 'secondary-action', eventListeners: { click: () => this.resolveCurrent(null) } }),
                createElement('button', { textContent: '确认', eventListeners: { click: () => this.resolveCurrent(parseInt(input.value, 10)) } })
            ];

            return this.createModalFrame('选择数量', content, actions);
        },
        
        createEquipmentSelectionDOM(modalConfig) {
            const { slotId } = modalConfig.payload;
            const gameState = game.State.get();
            const slotName = gameState.equipped[slotId]?.name || '装备';
            const currentlyEquippedId = gameState.equipped[slotId]?.itemId;
            
            const mainContainer = createElement('div', { className: 'equipment-selection-container' });
            const leftPanel = createElement('div', { className: 'current-equipment-panel' });
            const rightPanel = createElement('div', { className: 'available-equipment-panel' });

            rightPanel.appendChild(createElement('h4', { textContent: '从背包选择' }));
            const availableItems = gameState.inventory
                .map((item, index) => ({...item, originalIndex: index}))
                .filter(i => gameData.items[i.id]?.slot === slotId);

            const list = createElement('ul', { className: 'menu-list' });
            if (availableItems.length === 0) {
                list.appendChild(createElement('li', { className: 'empty-list-item' }, [
                    createElement('p', { className: 'empty-list-text', textContent: `背包中没有可用于此槽位的装备。` })
                ]));
            } else {
                availableItems.forEach(invItem => {
                    const itemData = gameData.items[invItem.id];
                    const listItem = createElement('li', { 
                        className: 'equipment-selection-item',
                        eventListeners: { click: () => game.UI.showItemDetails(invItem.originalIndex, { isFromEquipSelection: true }) }
                    }, [
                        createElement('div', { className: 'inventory-item-entry' }, [
                            createElement('div', { className: 'item-icon', style: { backgroundImage: `url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')` } }),
                            createElement('span', { className: 'item-name-quantity', textContent: `${itemData.name}` })
                        ]),
                    ]);
                    list.appendChild(listItem);
                });
            }
            rightPanel.appendChild(list);
            game.UI.makeListDraggable(list);
            
            leftPanel.appendChild(createElement('h4', { textContent: '当前装备' }));
            const itemData = currentlyEquippedId ? gameData.items[currentlyEquippedId] : null;
            const item = currentlyEquippedId ? { id: currentlyEquippedId, quantity: 1 } : null;
            leftPanel.appendChild(_createItemDetailBlock(itemData, item));
            
            mainContainer.append(leftPanel, rightPanel);
            
            const actions = [];
            if (currentlyEquippedId) {
                 actions.push(createElement('button', { 
                    textContent: '卸下', 
                    className: 'danger-button', 
                    eventListeners: { click: async () => { 
                        await game.Actions.unequipItem(slotId);
                        this.refreshTopModal();
                    }}
                }));
            }
            actions.push(createElement('button', { 
                textContent: '关闭', 
                className: 'secondary-action', 
                style: { marginLeft: currentlyEquippedId ? 'auto' : '0' },
                eventListeners: { click: () => this.resolveCurrent(null) } 
            }));
            
            return this.createModalFrame(`更换${slotName}装备`, mainContainer, actions, true);
        }
    };

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.ModalManager = ModalManager;

})();