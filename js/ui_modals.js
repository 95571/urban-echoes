/**
 * @file js/ui_modals.js
 * @description UI模块 - 弹窗管理器 (v49.2.0 - [优化] 装备详情弹窗增加卸下按钮)
 * @author Gemini (CTO)
 * @version 49.2.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const ModalManager = {
        stack: [],
        baseZIndex: 1000,

        async push(modalConfig) {
            return new Promise(resolve => {
                modalConfig.resolve = resolve;

                const newModalEl = this.createModalElement(modalConfig, this.stack.length);
                modalConfig.domElement = newModalEl;

                this.stack.push(modalConfig);
                document.body.appendChild(newModalEl);

                game.UI.renderBottomNav();

                setTimeout(() => newModalEl.classList.add('visible'), 10);
            });
        },

        pop() {
            if (this.stack.length === 0) return;

            const modalToPop = this.stack.pop();
            clearTimeout(game.UI.typewriterTimeout);
            game.UI.isTyping = false;

            if (modalToPop.domElement) {
                modalToPop.domElement.classList.remove('visible');
                setTimeout(() => {
                    modalToPop.domElement.remove();
                }, 100);
            }

            game.UI.renderBottomNav();
        },

        createModalElement(modalConfig, stackIndex) {
            const zIndex = this.baseZIndex + stackIndex * 10;
            let overlay;

            switch(modalConfig.type) {
                case 'custom':
                    overlay = this.createCustomModalDOM(modalConfig);
                    break;
                case 'job_board':
                    overlay = this.createJobBoardDOM(modalConfig);
                    break;
                case 'job_details':
                    overlay = this.createJobDetailsDOM(modalConfig);
                    break;
                case 'quest_details':
                    overlay = this.createQuestDetailsDOM(modalConfig);
                    break;
                case 'item_details':
                    overlay = this.createItemDetailsDOM(modalConfig);
                    break;
                case 'quantity_prompt':
                    overlay = this.createQuantityPromptDOM(modalConfig);
                    break;
                default:
                    overlay = this.createStandardDialogueDOM(modalConfig);
                    break;
            }
            overlay.style.zIndex = zIndex;
            return overlay;
        },

        createQuantityPromptDOM(modalConfig) {
            const { title, max, onConfirm } = modalConfig.payload;

            const contentHtml = `
                <div class="quantity-prompt-content">
                    <div class="quantity-prompt-header">${title}</div>
                    <div class="quantity-controls">
                        <input type="number" class="quantity-input" value="1" min="1" max="${max}">
                        <input type="range" class="quantity-slider" value="1" min="1" max="${max}">
                    </div>
                </div>
            `;

            const actionsHtml = `
                <button class="quantity-cancel-btn secondary-action">取消</button>
                <button class="quantity-confirm-btn danger-button">确认</button>
            `;

            const overlay = this.createModalFrame('选择数量', contentHtml, actionsHtml);

            const input = overlay.querySelector('.quantity-input');
            const slider = overlay.querySelector('.quantity-slider');
            const confirmBtn = overlay.querySelector('.quantity-confirm-btn');
            const cancelBtn = overlay.querySelector('.quantity-cancel-btn');

            const syncValues = (source) => {
                let value = parseInt(source.value, 10);
                if (isNaN(value) || value < 1) value = 1;
                if (value > max) value = max;
                input.value = value;
                slider.value = value;
            };

            input.oninput = () => syncValues(input);
            slider.oninput = () => syncValues(slider);

            input.onblur = () => {
                if (input.value === '') {
                    input.value = 1;
                    syncValues(input);
                }
            }

            confirmBtn.onclick = () => {
                const quantity = parseInt(input.value, 10);
                if (quantity > 0 && onConfirm) {
                    onConfirm(quantity);
                }
                this.pop();
            };

            cancelBtn.onclick = () => this.pop();

            return overlay;
        },

        resolveCurrent(value) {
            if (this.stack.length === 0) return;
            const currentModal = this.stack[this.stack.length - 1];
            if (currentModal.resolve) {
                currentModal.resolve(value);
            }
            this.pop();
        },

        hideAll() {
            while(this.stack.length > 0) {
                this.pop();
            }
        },

        createModalFrame(title, contentHtml, actionsHtml) {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';

            const box = document.createElement('div');
            box.className = 'custom-modal-box';

            box.innerHTML = `
                <h3 class="custom-modal-title">${title}</h3>
                <div class="custom-modal-content">${contentHtml}</div>
                ${actionsHtml ? `<div class="custom-modal-actions">${actionsHtml}</div>` : ''}
            `;

            overlay.appendChild(box);

            if (!overlay.querySelector('.quantity-prompt-content')) {
                 overlay.onclick = (e) => { if (e.target === overlay) this.pop(); };
            }

            return overlay;
        },

        createCustomModalDOM(modalConfig) {
            const title = modalConfig.title || '';
            const contentHtml = modalConfig.html || '';
            const actionsHtml = `<button class="custom-modal-close-btn">关闭</button>`;

            const overlay = this.createModalFrame(title, contentHtml, actionsHtml);

            const closeBtn = overlay.querySelector('.custom-modal-close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => this.pop();
            }

            return overlay;
        },

        createItemDetailsDOM(modalConfig) {
            const { item, itemData, index, isEquipped, slotId } = modalConfig.payload;

            const effectsHtml = `
                <div class="item-details-effects">
                    <h4>效果</h4>
                    <div class="item-details-effects-list">
                        <p>${itemData.useDescription || '该物品没有特殊效果。'}</p>
                    </div>
                </div>
            `;

            const contentHtml = `
                <div class="item-details-content">
                    <div class="item-details-image" style="background-image: url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')"></div>
                    <div class="item-details-info">
                        <h4>${itemData.name}${item.quantity > 1 ? ` &times;${item.quantity}`: ''}</h4>
                        <p>${itemData.description}</p>
                    </div>
                    ${effectsHtml}
                </div>
            `;

            let actionsHtml = '';
            if (isEquipped) {
                // [修改] 为已装备物品显示“卸下”按钮
                actionsHtml = `<button data-action="unequipItem" data-slot="${slotId}">卸下</button>`;
            } else {
                if (itemData.type === 'consumable') actionsHtml += `<button data-action="useItem" data-index="${index}">使用</button>`;
                if (itemData.slot) actionsHtml += `<button data-action="equipItem" data-index="${index}">装备</button>`;
                actionsHtml += `<button class="danger-button" data-action="dropItem" data-index="${index}">丢弃</button>`;
            }
            // 添加一个通用的关闭按钮
            actionsHtml += `<button class="secondary-action custom-modal-close-btn">关闭</button>`;

            const overlay = this.createModalFrame('物品详情', contentHtml, actionsHtml);

            const effectsListEl = overlay.querySelector('.item-details-effects-list');
            if (effectsListEl) {
                this.makeListDraggable(effectsListEl);
            }

            // [修改] 让所有带动作的按钮都能关闭弹窗
            overlay.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.hideAll();
                });
            });
            
            // 为手动添加的关闭按钮也绑定事件
            const closeBtn = overlay.querySelector('.custom-modal-close-btn');
            if(closeBtn) {
                 closeBtn.onclick = () => this.pop();
            }

            return overlay;
        },


        createStandardDialogueDOM(dialogueData) {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            const box = document.createElement('div');
            box.className = 'modal-box';

            box.innerHTML = `
                <div class="modal-image-container ${dialogueData.imageUrl ? '' : ''}">
                    <div class="modal-image-title"></div>
                </div>
                <div class="modal-text-container">
                    <p class="modal-text"></p>
                    <div class="modal-continue-indicator hidden">▼</div>
                </div>
                <div class="modal-buttons-container">
                    <div class="modal-buttons"></div>
                </div>
            `;
            overlay.appendChild(box);

            const imageContainer = box.querySelector('.modal-image-container');
            const imageTitle = box.querySelector('.modal-image-title');
            const textContainer = box.querySelector('.modal-text-container');
            const textEl = box.querySelector('.modal-text');
            const continueIndicator = box.querySelector('.modal-continue-indicator');
            const buttonsDiv = box.querySelector('.modal-buttons');

            const updateModalContent = (currentDialogueData) => {
                buttonsDiv.innerHTML = '';

                const options = currentDialogueData.options || [];
                const isRichMode = !!currentDialogueData.imageUrl;

                const availableOptions = options
                    .filter(opt => game.ConditionChecker.evaluate(opt.conditions))
                    .map((opt, index) => ({ text: opt.text, value: index, originalOption: opt }));


                textContainer.classList.toggle('rich-dialogue', isRichMode);
                if (isRichMode) {
                    imageTitle.textContent = currentDialogueData.title || '';
                    imageContainer.style.backgroundImage = `url('${currentDialogueData.imageUrl}')`;
                    imageContainer.classList.remove('hidden');
                } else {
                    imageContainer.classList.add('hidden');
                }

                const handleChoice = async (chosenValue) => {
                    const chosenOptionWrapper = availableOptions.find(opt => opt.value === chosenValue);
                    if (!chosenOptionWrapper) return;
                    const originalOption = chosenOptionWrapper.originalOption;

                    if (originalOption.actionBlock) {
                        await game.Actions.executeActionBlock(originalOption.actionBlock);
                    }

                    if (originalOption.followUp) {
                        const followUpText = originalOption.followUp.dialogueText;
                        if (Array.isArray(followUpText)) {
                            originalOption.followUp.dialogueText = followUpText[Math.floor(Math.random() * followUpText.length)];
                        }
                        updateModalContent({ ...currentDialogueData, ...originalOption.followUp });
                    } else if (originalOption.subDialogue) {
                        const sub = originalOption.subDialogue;
                        if (sub.type === 'job_board') {
                            game.UI.showJobBoard(sub.payload);
                        } else {
                            game.UI.showConfirmation(sub);
                        }
                    } else {
                        this.resolveCurrent(chosenOptionWrapper);
                    }
                };

                let textSource = currentDialogueData.dialogueText || currentDialogueData.text || currentDialogueData.title || '';
                if (Array.isArray(textSource)) {
                    textSource = textSource[Math.floor(Math.random() * textSource.length)];
                }

                const fullText = textSource;
                const textSegments = fullText.split('<br>').join('\n').split('\n').filter(s => s.trim() !== '');
                let currentSegmentIndex = 0;

                const defaultAlignment = isRichMode ? 'left' : 'center';
                textEl.style.textAlign = currentDialogueData.textAlign || defaultAlignment;
                let shouldUseTypewriter = isRichMode;
                if (currentDialogueData.useTypewriter !== undefined) shouldUseTypewriter = currentDialogueData.useTypewriter;

                const showButtons = () => {
                    overlay.onclick = null;
                    continueIndicator.classList.add('hidden');

                    if (availableOptions.length > 0) {
                        buttonsDiv.innerHTML = availableOptions.map(opt => {
                            const customAlign = opt.originalOption.textAlign;
                            const defaultAlign = isRichMode ? 'left' : 'center';
                            const finalAlign = customAlign || defaultAlign;
                            return `<button data-value='${JSON.stringify(opt.value)}' class="${opt.originalOption.class || ''}" style="text-align: ${finalAlign};">${opt.text}</button>`;
                        }).join('');

                        buttonsDiv.querySelectorAll('button').forEach(btn => {
                            btn.onclick = async (e) => {
                                e.stopPropagation();
                                await handleChoice(JSON.parse(btn.dataset.value));
                            };
                        });
                    } else {
                        this.resolveCurrent({ value: true });
                    }
                };

                const onSegmentComplete = () => {
                    if (currentSegmentIndex < textSegments.length) {
                         continueIndicator.classList.remove('hidden');
                    } else {
                        showButtons();
                    }
                };

                const showNextSegment = () => {
                    if (game.UI.isTyping) {
                        clearTimeout(game.UI.typewriterTimeout);
                        game.UI.isTyping = false;
                        const segmentBeingTyped = textSegments[currentSegmentIndex - 1];
                        textEl.innerHTML = segmentBeingTyped;
                        onSegmentComplete();
                        return;
                    }

                    if (currentSegmentIndex >= textSegments.length) {
                        showButtons();
                        return;
                    }

                    continueIndicator.classList.add('hidden');
                    const segmentToShow = textSegments[currentSegmentIndex];
                    currentSegmentIndex++;

                    if (shouldUseTypewriter) {
                        game.UI.typewriter(textEl, segmentToShow, onSegmentComplete);
                    } else {
                        textEl.innerHTML = segmentToShow;
                        onSegmentComplete();
                    }
                };

                if (textSegments.length > 0) {
                    overlay.onclick = showNextSegment;
                    showNextSegment();
                } else {
                    showButtons();
                }
            };

            updateModalContent(dialogueData);
            return overlay;
        },

        createJobBoardDOM(modalConfig) {
            const { title, jobs } = modalConfig.payload;

            let jobListHtml = '<ul class="job-list">';
            if (jobs && jobs.length > 0) {
                jobs.forEach(job => {
                    const jobData = gameData.jobs[job.id];
                    const canAccept = (game.State.get().variables[jobData.questVariable] || 0) === 0;
                    if (jobData && canAccept) {
                         jobListHtml += `
                            <li class="job-item" data-job-id="${job.id}">
                                <h4>${jobData.title}</h4>
                                <p>报酬: <span class="job-reward">${jobData.reward}</span></p>
                            </li>
                        `;
                    }
                });
                 if (jobListHtml === '<ul class="job-list">') {
                    jobListHtml += '<li><p style="padding: 10px; color: var(--text-muted-color);">所有可接的任务都在进行中。</p></li>';
                }
            } else {
                jobListHtml += '<li><p>目前没有新的兼职信息。</p></li>';
            }
            jobListHtml += '</ul>';

            const contentHtml = `<div class="job-board-content">${jobListHtml}</div>`;
            const actionsHtml = `<button class="custom-modal-close-btn">关闭</button>`;
            const overlay = this.createModalFrame(title, contentHtml, actionsHtml);

            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            overlay.querySelectorAll('.job-item').forEach(item => {
                item.onclick = () => {
                    const jobId = item.dataset.jobId;
                    game.UI.showJobDetails(jobId);
                };
            });

            const jobListEl = overlay.querySelector('.job-list');
            if (jobListEl) {
                this.makeListDraggable(jobListEl);
            }

            return overlay;
        },

        createJobDetailsDOM(modalConfig) {
            const { jobId } = modalConfig.payload;
            const jobData = gameData.jobs[jobId];

            let contentHtml = `<p>错误：找不到兼职信息。</p>`;
            let requirementsMet = false;
            let requirementsText = '无';

            if (jobData) {
                requirementsMet = game.ConditionChecker.evaluate(jobData.requirements);
                if (jobData.requirements && jobData.requirements.length > 0) {
                    requirementsText = jobData.requirements.map(r => r.text).join('，');
                }

                contentHtml = `
                    <div class="job-details-content">
                        <h4>任务描述</h4>
                        <p>${jobData.description}</p>
                        <h4>任务要求</h4>
                        <p style="${!requirementsMet ? 'color: var(--error-color);' : ''}">${requirementsText}</p>
                        <h4>任务报酬</h4>
                        <p><strong>${jobData.reward}</strong></p>
                    </div>
                `;
            }

            const actionsHtml = `
                <button class="custom-modal-back-btn">返回列表</button>
                <button class="custom-modal-accept-btn" ${!jobData || !requirementsMet ? 'disabled' : ''}>接受任务</button>
            `;
            const title = jobData ? jobData.title : '兼职详情';
            const overlay = this.createModalFrame(title, contentHtml, actionsHtml);

            overlay.querySelector('.custom-modal-back-btn').onclick = () => this.pop();

            const acceptBtn = overlay.querySelector('.custom-modal-accept-btn');
            if (acceptBtn && jobData) {
                acceptBtn.onclick = async () => {
                    const oldState = game.State.get().variables[jobData.questVariable] || 0;
                    await game.Actions.acceptJob(jobId);
                    const newState = game.State.get().variables[jobData.questVariable] || 0;

                    if (oldState === 0 && newState === 1) {
                        if (this.stack.length > 1) {
                            const jobBoardModal = this.stack[this.stack.length - 2].domElement;
                            if (jobBoardModal) {
                                const jobItemToRemove = jobBoardModal.querySelector(`.job-item[data-job-id="${jobId}"]`);
                                if (jobItemToRemove) {
                                    jobItemToRemove.remove();
                                }
                            }
                        }
                        this.pop();
                    }
                };
            }

            return overlay;
        },

        createQuestDetailsDOM(modalConfig) {
            const { jobData, questInstance, status } = modalConfig.payload;

            let objectivesHtml = '';
            if (status === 'active' && questInstance && questInstance.objectives) {
                objectivesHtml = `
                    <h4>任务目标</h4>
                    <ul>
                        ${questInstance.objectives.map(obj => `<li>- ${obj.text} (${obj.current || 0}/${obj.target})</li>`).join('')}
                    </ul>
                `;
            } else if (status === 'completed') {
                 objectivesHtml = `<h4>任务目标</h4><p>已完成</p>`;
            }

            const contentHtml = `
                <div class="quest-details-content">
                    <h4>任务描述</h4>
                    <p>${jobData.description}</p>
                    ${objectivesHtml}
                    <h4>任务报酬</h4>
                    <p><strong>${jobData.reward}</strong></p>
                </div>
            `;
            const actionsHtml = `<button class="custom-modal-close-btn">关闭</button>`;
            const overlay = this.createModalFrame(jobData.title, contentHtml, actionsHtml);
            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            return overlay;
        },

        makeListDraggable(element) {
            if (!element || element.scrollHeight <= element.clientHeight) {
                element.classList.remove('is-scrollable');
                return;
            };

            element.classList.add('is-scrollable');
            let isDown = false, startY, scrollTop;
            const start = e => {
                isDown = true;
                element.style.cursor = 'grabbing';
                element.style.userSelect = 'none';
                startY = (e.pageY || e.touches[0].pageY) - element.offsetTop;
                scrollTop = element.scrollTop;
                e.preventDefault();
            };
            const end = () => {
                if (!isDown) return;
                isDown = false;
                element.style.cursor = 'grab';
                element.style.userSelect = '';
            };
            const move = e => {
                if (!isDown) return;
                e.preventDefault();
                const y = (e.pageY || e.touches[0].pageY) - element.offsetTop;
                const walk = y - startY;
                element.scrollTop = scrollTop - walk;
            };

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

})();