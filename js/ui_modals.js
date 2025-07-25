/**
 * @file js/ui_modals.js
 * @description UI模块 - 叙事UI与自定义弹窗管理器 (v54.2.0 - [重构] 弹窗系统完全迁移至createElement)
 * @author Gemini (CTO)
 * @version 54.2.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    // --- 叙事UI管理器 (NarrativeManager) ---
    // （此部分代码未作修改，保持原样）
    const NarrativeManager = {
        init() {
            const dom = game.dom;
            const ids = [ "narrative-ui", "narrative-avatar", "narrative-box", "narrative-name", "narrative-text", "narrative-continue-indicator", "narrative-options" ];
            dom['narrative-ui'].innerHTML = `<div id="narrative-options"></div><div class="narrative-wrapper"><div id="narrative-avatar"></div><div id="narrative-box"><div id="narrative-name"></div><div id="narrative-text"></div><div id="narrative-continue-indicator" class="hidden">▼</div></div></div>`;
            ids.forEach(id => dom[id] = document.getElementById(id));
        },
        show(initialDialogueId) {
            return new Promise(resolve => {
                const initialNode = gameData.dialogues[initialDialogueId];
                if (!initialNode) {
                    console.error(`[NarrativeManager] Dialogue with ID "${initialDialogueId}" not found.`);
                    resolve({ value: false, error: 'Dialogue not found' });
                    return;
                }
                game.narrativeContext = { currentNode: initialNode, currentSegmentIndex: 0, resolve, isWaitingForChoice: false };
                this.toggleUiElements(true);
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
                const ui = game.dom["narrative-ui"];
                ui.classList.remove('hidden');
                setTimeout(() => ui.classList.add('visible'), 10);
                this.showNextSegment();
            });
        },
        hide() {
            if (!game.narrativeContext) return;
            clearTimeout(game.UI.typewriterTimeout);
            game.UI.isTyping = false;
            const ui = game.dom["narrative-ui"];
            ui.classList.remove('visible');
            this.toggleUiElements(false);
            setTimeout(() => {
                ui.classList.add('hidden');
                game.narrativeContext = null;
                game.Events.publish(EVENTS.UI_RENDER);
            }, 400); 
        },
        toggleUiElements(isNarrativeActive) {
            const dom = game.dom;
            ['left-panel', 'main-content', 'bottom-nav'].forEach(id => dom[id]?.classList.toggle('dimmed', isNarrativeActive));
            dom.screen.querySelectorAll('.hotspot-card, .sparkle-hotspot, .hotspot-arrow').forEach(el => {
                el.style.opacity = isNarrativeActive ? '0' : '1';
                el.style.pointerEvents = isNarrativeActive ? 'none' : 'all';
            });
            if (gameData.settings.narrativeUiSceneBlur) {
                const mapArea = dom.screen.querySelector('.map-area');
                if (mapArea) {
                    mapArea.style.transition = 'filter 0.3s ease-in-out';
                    mapArea.style.filter = isNarrativeActive ? 'blur(3px)' : 'none';
                }
            }
        },
        showNextSegment() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            if (game.UI.isTyping) {
                clearTimeout(game.UI.typewriterTimeout);
                game.UI.isTyping = false;
                const segment = ctx.currentNode.dialogueText[ctx.currentSegmentIndex - 1];
                game.dom["narrative-text"].innerHTML = segment.text.replace(/\n/g, '<br>');
                this.onSegmentComplete();
                return;
            }
            if (ctx.isWaitingForChoice) return;
            const dialogueText = ctx.currentNode.dialogueText;
            const hasDialogue = Array.isArray(dialogueText) && dialogueText.length > 0;
            if (!hasDialogue || ctx.currentSegmentIndex >= dialogueText.length) {
                this.showOptions();
                if (!hasDialogue) {
                    const defaultAvatar = game.State.get().currentLocationId ? gameData.locations[game.State.get().currentLocationId].imageUrl || 'images/player_dialogue.png' : 'images/player_dialogue.png';
                    this.updateAvatar(defaultAvatar, '');
                    game.dom["narrative-text"].innerHTML = '';
                }
                return;
            }
            const segment = dialogueText[ctx.currentSegmentIndex];
            ctx.currentSegmentIndex++;
            this.updateAvatar(segment.avatar, segment.name);
            game.dom["narrative-continue-indicator"].classList.add('hidden');
            game.UI.typewriter(game.dom["narrative-text"], segment.text.replace(/\n/g, '<br>'), () => this.onSegmentComplete());
        },
        onSegmentComplete() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            const hasMoreSegments = ctx.currentNode.dialogueText && ctx.currentSegmentIndex < ctx.currentNode.dialogueText.length;
            if (hasMoreSegments) {
                game.dom["narrative-continue-indicator"].classList.remove('hidden');
            } else {
                this.showOptions();
            }
        },
        updateAvatar(imageUrl, name) {
            const dom = game.dom;
            dom["narrative-avatar"].style.backgroundImage = `url('${imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')`;
            dom["narrative-name"].textContent = name || '';
            dom["narrative-name"].style.display = name ? 'block' : 'none';
        },
        showOptions() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            ctx.isWaitingForChoice = true;
            game.dom["narrative-continue-indicator"].classList.add('hidden');
            game.dom["narrative-box"].style.cursor = 'default';
            const options = ctx.currentNode.options || [];
            const availableOptions = options.filter(opt => game.ConditionChecker.evaluate(opt.conditions));
            if (availableOptions.length === 0) {
                ctx.resolve({ value: true });
                this.hide();
                return;
            }
            const optionsContainer = game.dom["narrative-options"];
            optionsContainer.innerHTML = ''; // Clear old options
            availableOptions.forEach((opt, index) => {
                const btn = createElement('button', {
                    textContent: opt.text,
                    className: opt.class || '',
                    dataset: { index: index },
                    eventListeners: {
                        click: async (e) => {
                            e.stopPropagation();
                            await this.handleChoice(opt);
                        }
                    }
                });
                optionsContainer.appendChild(btn);
            });
        },
        async handleChoice(chosenOption) {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            game.dom["narrative-options"].innerHTML = '';
            if (chosenOption.actionBlock) {
                await game.Actions.executeActionBlock(chosenOption.actionBlock);
            }
            if (chosenOption.transitionTo) {
                const nextNode = gameData.dialogues[chosenOption.transitionTo];
                if (nextNode) {
                    ctx.currentNode = nextNode;
                    ctx.currentSegmentIndex = 0;
                    ctx.isWaitingForChoice = false;
                    game.dom["narrative-box"].style.cursor = 'pointer';
                    this.showNextSegment();
                } else {
                    console.error(`[NarrativeManager] Transition failed: Dialogue node "${chosenOption.transitionTo}" not found.`);
                    ctx.resolve({ value: false, error: 'Transition failed' });
                    this.hide();
                }
            } else if (chosenOption.subDialogue) {
                this.hide();
                setTimeout(() => {
                    const sub = chosenOption.subDialogue;
                    if (sub.type === 'job_board') game.UI.showJobBoard(sub.payload);
                    else game.UI.showCustomModal(sub.payload);
                }, 400);
            } else {
                ctx.resolve({ value: chosenOption.value, originalOption: chosenOption });
                this.hide();
            }
        }
    };
    
    // --- 自定义弹窗管理器 (ModalManager) [重构] ---
    const ModalManager = {
        stack: [],
        baseZIndex: 1200,
        async push(modalConfig) {
            return new Promise(resolve => {
                modalConfig.resolve = resolve;
                const newModalEl = this.createModalElement(modalConfig, this.stack.length);
                modalConfig.domElement = newModalEl;
                this.stack.push(modalConfig);
                document.body.appendChild(newModalEl);
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
        createModalElement(modalConfig, stackIndex) {
            const zIndex = this.baseZIndex + stackIndex * 10;
            let overlay;
            switch(modalConfig.type) {
                case 'job_board':       overlay = this.createJobBoardDOM(modalConfig); break;
                case 'job_details':     overlay = this.createJobDetailsDOM(modalConfig); break;
                case 'quest_details':   overlay = this.createQuestDetailsDOM(modalConfig); break;
                case 'item_details':    overlay = this.createItemDetailsDOM(modalConfig); break;
                case 'quantity_prompt': overlay = this.createQuantityPromptDOM(modalConfig); break;
                case 'confirmation':    overlay = this.createConfirmationDOM(modalConfig); break;
                default:                overlay = this.createCustomModalDOM(modalConfig); break;
            }
            overlay.style.zIndex = zIndex;
            return overlay;
        },

        /**
         * [重构] 创建弹窗基本框架，使用createElement
         * @param {string} title - 弹窗标题
         * @param {HTMLElement|Array<HTMLElement>} contentEl - 内容区域的DOM元素或元素数组
         * @param {HTMLElement|Array<HTMLElement>} [actionsEl] - 动作区域的DOM元素或元素数组
         * @returns {HTMLElement} 创建好的弹窗遮罩层元素
         */
        createModalFrame(title, contentEl, actionsEl) {
            const contentElements = Array.isArray(contentEl) ? contentEl : [contentEl];
            const actionsElements = Array.isArray(actionsEl) ? actionsEl : (actionsEl ? [actionsEl] : []);

            const box = createElement('div', { className: 'custom-modal-box' }, [
                createElement('h3', { className: 'custom-modal-title', textContent: title }),
                createElement('div', { className: 'custom-modal-content' }, contentElements),
                actionsElements.length > 0 ? createElement('div', { className: 'custom-modal-actions' }, actionsElements) : null
            ].filter(Boolean)); // 过滤掉null，避免空actions div

            const overlay = createElement('div', {
                className: 'custom-modal-overlay',
                eventListeners: {
                    click: (e) => { if (e.target === overlay) this.resolveCurrent(null); }
                }
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
                    eventListeners: {
                        click: () => this.resolveCurrent({ value: opt.value, originalOption: opt })
                    }
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
            const { item, itemData, index, isEquipped, slotId } = modalConfig.payload;
            
            const content = createElement('div', { className: 'item-details-content' }, [
                createElement('div', { className: 'item-details-image', style: { backgroundImage: `url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')` } }),
                createElement('div', { className: 'item-details-info' }, [
                    createElement('h4', { textContent: `${itemData.name}${item.quantity > 1 ? ` &times;${item.quantity}`: ''}` }),
                    createElement('p', { textContent: itemData.description })
                ]),
                createElement('div', { className: 'item-details-effects' }, [
                    createElement('h4', { textContent: '效果' }),
                    createElement('div', { className: 'item-details-effects-list' }, [
                        createElement('p', { innerHTML: itemData.useDescription || '该物品没有特殊效果。' })
                    ])
                ])
            ]);

            this.makeListDraggable(content.querySelector('.item-details-effects-list'));

            let actionButtons = [];
            if (isEquipped) {
                actionButtons.push(createElement('button', { textContent: '卸下', dataset: { action: 'unequipItem', slot: slotId } }));
            } else {
                if (itemData.type === 'consumable') actionButtons.push(createElement('button', { textContent: '使用', dataset: { action: 'useItem', index: index } }));
                if (itemData.slot) actionButtons.push(createElement('button', { textContent: '装备', dataset: { action: 'equipItem', index: index } }));
                actionButtons.push(createElement('button', { textContent: '丢弃', className: 'danger-button', dataset: { action: 'dropItem', index: index } }));
            }
            actionButtons.push(createElement('button', { textContent: '关闭', className: 'secondary-action custom-modal-close-btn' }));
            
            actionButtons.forEach(btn => btn.addEventListener('click', () => this.hideAll()));
            actionButtons.find(btn => btn.classList.contains('custom-modal-close-btn')).addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发hideAll
                this.resolveCurrent(null);
            });

            return this.createModalFrame('物品详情', content, actionButtons);
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
            this.makeListDraggable(jobList);
            
            const content = createElement('div', { className: 'job-board-content' }, [jobList]);
            const closeButton = createElement('button', { textContent: '关闭', className: 'secondary-action', eventListeners: { click: () => this.resolveCurrent(null) } });
            
            return this.createModalFrame(title, content, closeButton);
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

                actions = [
                    createElement('button', { textContent: '返回', className: 'secondary-action', eventListeners: { click: () => this.pop() } }),
                    createElement('button', { 
                        textContent: '接受任务', 
                        attributes: { disabled: !requirementsMet },
                        eventListeners: { click: async () => {
                            await game.Actions.acceptJob(jobId);
                            this.hideAll();
                        }}
                    })
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

        makeListDraggable(element) {
            if (!element || element.scrollHeight <= element.clientHeight) { element.classList.remove('is-scrollable'); return; }
            element.classList.add('is-scrollable');
            let isDown = false, startY, scrollTop;
            const start = e => { isDown = true; element.style.cursor = 'grabbing'; startY = (e.pageY || e.touches[0].pageY) - element.offsetTop; scrollTop = element.scrollTop; e.preventDefault(); };
            const end = () => { isDown = false; element.style.cursor = 'grab'; };
            const move = e => { if (!isDown) return; e.preventDefault(); const y = (e.pageY || e.touches[0].pageY) - element.offsetTop; element.scrollTop = scrollTop - (y - startY); };
            element.addEventListener('mousedown', start);
            element.addEventListener('mouseleave', end);
            element.addEventListener('mouseup', end);
            element.addEventListener('mousemove', move);
            element.addEventListener('touchstart', start, { passive: false });
            element.addEventListener('touchend', end);
            element.addEventListener('touchmove', move, { passive: false });
        }
    };

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.ModalManager = ModalManager;
    window.game.UI.NarrativeManager = NarrativeManager;

})();