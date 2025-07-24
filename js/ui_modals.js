/**
 * @file js/ui_modals.js
 * @description UI模块 - 叙事UI与自定义弹窗管理器 (v51.2.0 - [修复] 隐藏场景箭头)
 * @author Gemini (CTO)
 * @version 51.2.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    // --- 新的叙事UI管理器 ---
    const NarrativeManager = {
        init() {
            const dom = game.dom;
            const ids = [ "narrative-ui", "narrative-avatar", "narrative-box", "narrative-name", "narrative-text", "narrative-continue-indicator", "narrative-options" ];
            dom['narrative-ui'].innerHTML = `<div id="narrative-options"></div><div class="narrative-wrapper"><div id="narrative-avatar"></div><div id="narrative-box"><div id="narrative-name"></div><div id="narrative-text"></div><div id="narrative-continue-indicator" class="hidden">▼</div></div></div>`;
            ids.forEach(id => dom[id] = document.getElementById(id));
        },

        show(dialogueData) {
            return new Promise(resolve => {
                game.narrativeContext = { dialogueData, currentSegmentIndex: 0, resolve, isWaitingForChoice: false };
                this.toggleUiElements(true);
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
            setTimeout(() => {
                ui.classList.add('hidden');
                this.toggleUiElements(false);
                game.narrativeContext = null;
                game.UI.render();
            }, 400);
        },

        toggleUiElements(isNarrativeActive) {
            const dom = game.dom;
            ['left-panel', 'right-panel', 'bottom-nav'].forEach(id => dom[id]?.classList.toggle('dimmed', isNarrativeActive));
            // [修复] 将箭头也加入隐藏列表
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
                const segment = ctx.dialogueData.dialogueText[ctx.currentSegmentIndex - 1];
                game.dom["narrative-text"].innerHTML = segment.text.replace(/\n/g, '<br>');
                this.onSegmentComplete();
                return;
            }
            if (ctx.isWaitingForChoice) return;
            const hasDialogue = Array.isArray(ctx.dialogueData.dialogueText) && ctx.dialogueData.dialogueText.length > 0;
            if (!hasDialogue || ctx.currentSegmentIndex >= ctx.dialogueData.dialogueText.length) {
                this.showOptions();
                if (!hasDialogue) {
                    this.updateAvatar(game.State.get().currentLocationId ? gameData.locations[game.State.get().currentLocationId].imageUrl || 'images/player_dialogue.png' : 'images/player_dialogue.png', '');
                    game.dom["narrative-text"].innerHTML = '';
                }
                return;
            }
            const segment = ctx.dialogueData.dialogueText[ctx.currentSegmentIndex];
            ctx.currentSegmentIndex++;
            this.updateAvatar(segment.avatar, segment.name);
            game.dom["narrative-continue-indicator"].classList.add('hidden');
            game.UI.typewriter(game.dom["narrative-text"], segment.text.replace(/\n/g, '<br>'), () => this.onSegmentComplete());
        },

        onSegmentComplete() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            const hasMoreSegments = ctx.dialogueData.dialogueText && ctx.currentSegmentIndex < ctx.dialogueData.dialogueText.length;
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
            const options = ctx.dialogueData.options || [];
            const availableOptions = options
                .filter(opt => game.ConditionChecker.evaluate(opt.conditions))
                .map((opt, index) => ({ ...opt, originalIndex: index }));
            if (availableOptions.length === 0) {
                ctx.resolve({ value: true });
                this.hide();
                return;
            }
            const optionsContainer = game.dom["narrative-options"];
            optionsContainer.innerHTML = availableOptions.map(opt => 
                `<button data-index="${opt.originalIndex}" class="${opt.class || ''}">${opt.text}</button>`
            ).join('');
            optionsContainer.querySelectorAll('button').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const chosenIndex = parseInt(btn.dataset.index, 10);
                    await this.handleChoice(chosenIndex);
                };
            });
        },

        async handleChoice(chosenIndex) {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            const chosenOption = ctx.dialogueData.options[chosenIndex];
            game.dom["narrative-options"].innerHTML = '';
            if (chosenOption.actionBlock) {
                await game.Actions.executeActionBlock(chosenOption.actionBlock);
            }
            if (chosenOption.followUp) {
                ctx.dialogueData = chosenOption.followUp;
                ctx.currentSegmentIndex = 0;
                ctx.isWaitingForChoice = false;
                game.dom["narrative-box"].style.cursor = 'pointer';
                this.showNextSegment();
            } else if (chosenOption.subDialogue) {
                this.hide();
                setTimeout(() => {
                    const sub = chosenOption.subDialogue;
                    if (sub.type === 'job_board') {
                        game.UI.showJobBoard(sub.payload);
                    } else {
                        game.UI.showCustomModal(sub.payload);
                    }
                }, 400);
            }
            else {
                ctx.resolve({ value: chosenOption.value, originalOption: chosenOption });
                this.hide();
            }
        }
    };
    
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
        createModalFrame(title, contentHtml, actionsHtml) {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) this.pop(); };
            const box = document.createElement('div');
            box.className = 'custom-modal-box';
            box.innerHTML = `
                <h3 class="custom-modal-title">${title}</h3>
                <div class="custom-modal-content">${contentHtml}</div>
                ${actionsHtml ? `<div class="custom-modal-actions">${actionsHtml}</div>` : ''}
            `;
            overlay.appendChild(box);
            return overlay;
        },
        createConfirmationDOM(modalConfig) {
            const { title, html, options } = modalConfig.payload;
            let actionsHtml = (options || []).map(opt =>
                `<button data-value='${JSON.stringify(opt.value)}' class="${opt.class || ''}">${opt.text}</button>`
            ).join('');
            const overlay = this.createModalFrame(title, html, actionsHtml);
            overlay.querySelectorAll('[data-value]').forEach(btn => {
                btn.onclick = () => {
                    const value = JSON.parse(btn.dataset.value);
                    const option = options.find(o => o.value === value);
                    this.resolveCurrent({ value: value, originalOption: option });
                };
            });
            return overlay;
        },
        createCustomModalDOM(modalConfig) {
            const { title, html } = modalConfig.payload;
            const actionsHtml = `<button class="secondary-action custom-modal-close-btn">关闭</button>`;
            const overlay = this.createModalFrame(title, html, actionsHtml);
            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            return overlay;
        },
        createItemDetailsDOM(modalConfig) {
            const { item, itemData, index, isEquipped, slotId } = modalConfig.payload;
            const contentHtml = `
                <div class="item-details-content">
                    <div class="item-details-image" style="background-image: url('${itemData.imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')"></div>
                    <div class="item-details-info">
                        <h4>${itemData.name}${item.quantity > 1 ? ` &times;${item.quantity}`: ''}</h4>
                        <p>${itemData.description}</p>
                    </div>
                    <div class="item-details-effects">
                        <h4>效果</h4>
                        <div class="item-details-effects-list">
                            <p>${itemData.useDescription || '该物品没有特殊效果。'}</p>
                        </div>
                    </div>
                </div>`;
            let actionsHtml = '';
            if (isEquipped) {
                actionsHtml = `<button data-action="unequipItem" data-slot="${slotId}">卸下</button>`;
            } else {
                if (itemData.type === 'consumable') actionsHtml += `<button data-action="useItem" data-index="${index}">使用</button>`;
                if (itemData.slot) actionsHtml += `<button data-action="equipItem" data-index="${index}">装备</button>`;
                actionsHtml += `<button class="danger-button" data-action="dropItem" data-index="${index}">丢弃</button>`;
            }
            actionsHtml += `<button class="secondary-action custom-modal-close-btn">关闭</button>`;
            const overlay = this.createModalFrame('物品详情', contentHtml, actionsHtml);
            this.makeListDraggable(overlay.querySelector('.item-details-effects-list'));
            overlay.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => this.hideAll()));
            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            return overlay;
        },
        createJobBoardDOM(modalConfig) {
            const { title, jobs } = modalConfig.payload;
            let jobListHtml = '<ul class="job-list">';
            if (jobs && jobs.length > 0) {
                const availableJobs = jobs.filter(job => {
                    const jobData = gameData.jobs[job.id];
                    return jobData && (game.State.get().variables[jobData.questVariable] || 0) === 0;
                });
                if (availableJobs.length > 0) {
                    availableJobs.forEach(job => {
                        const jobData = gameData.jobs[job.id];
                        jobListHtml += `
                            <li class="job-item" data-job-id="${job.id}">
                                <h4>${jobData.title}</h4>
                                <p>报酬: <span class="job-reward">${jobData.reward}</span></p>
                            </li>`;
                    });
                } else {
                    jobListHtml += '<li><p style="padding: 10px; color: var(--text-muted-color);">所有可接的任务都在进行中。</p></li>';
                }
            } else {
                jobListHtml += '<li><p>目前没有新的兼职信息。</p></li>';
            }
            jobListHtml += '</ul>';
            const overlay = this.createModalFrame(title, `<div class="job-board-content">${jobListHtml}</div>`, `<button class="secondary-action custom-modal-close-btn">关闭</button>`);
            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            overlay.querySelectorAll('.job-item').forEach(item => {
                item.onclick = () => game.UI.showJobDetails(item.dataset.jobId);
            });
            this.makeListDraggable(overlay.querySelector('.job-list'));
            return overlay;
        },
        createJobDetailsDOM(modalConfig) {
            const { jobId } = modalConfig.payload;
            const jobData = gameData.jobs[jobId];
            let contentHtml = `<p>错误：找不到兼职信息。</p>`, requirementsMet = false, requirementsText = '无';
            if (jobData) {
                requirementsMet = game.ConditionChecker.evaluate(jobData.requirements);
                if (jobData.requirements && jobData.requirements.length > 0) {
                    requirementsText = jobData.requirements.map(r => r.text).join('，');
                }
                contentHtml = `
                    <div class="job-details-content">
                        <h4>任务描述</h4><p>${jobData.description}</p>
                        <h4>任务要求</h4><p style="${!requirementsMet ? 'color: var(--error-color);' : ''}">${requirementsText}</p>
                        <h4>任务报酬</h4><p><strong>${jobData.reward}</strong></p>
                    </div>`;
            }
            const actionsHtml = `<button class="secondary-action custom-modal-back-btn">返回</button><button class="custom-modal-accept-btn" ${!jobData || !requirementsMet ? 'disabled' : ''}>接受任务</button>`;
            const overlay = this.createModalFrame(jobData ? jobData.title : '兼职详情', contentHtml, actionsHtml);
            overlay.querySelector('.custom-modal-back-btn').onclick = () => this.pop();
            const acceptBtn = overlay.querySelector('.custom-modal-accept-btn');
            if (acceptBtn && jobData) {
                acceptBtn.onclick = async () => {
                    await game.Actions.acceptJob(jobId);
                    this.hideAll();
                };
            }
            return overlay;
        },
        createQuestDetailsDOM(modalConfig) {
            const { jobData, questInstance, status } = modalConfig.payload;
            let objectivesHtml = '';
            if (status === 'active' && questInstance && questInstance.objectives) {
                objectivesHtml = `<h4>任务目标</h4><ul>${questInstance.objectives.map(obj => `<li>- ${obj.text} (${obj.current || 0}/${obj.target})</li>`).join('')}</ul>`;
            } else if (status === 'completed') {
                 objectivesHtml = `<h4>任务目标</h4><p>已完成</p>`;
            }
            const contentHtml = `<div class="quest-details-content"><h4>任务描述</h4><p>${jobData.description}</p>${objectivesHtml}<h4>任务报酬</h4><p><strong>${jobData.reward}</strong></p></div>`;
            const overlay = this.createModalFrame(jobData.title, contentHtml, `<button class="secondary-action custom-modal-close-btn">关闭</button>`);
            overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();
            return overlay;
        },
        createQuantityPromptDOM(modalConfig) {
            const { title, max, onConfirm } = modalConfig.payload;
            const contentHtml = `<div class="quantity-prompt-content"><div class="quantity-prompt-header">${title}</div><div class="quantity-controls"><input type="number" class="quantity-input" value="1" min="1" max="${max}"><input type="range" class="quantity-slider" value="1" min="1" max="${max}"></div></div>`;
            const actionsHtml = `<button class="quantity-cancel-btn secondary-action">取消</button><button class="quantity-confirm-btn">确认</button>`;
            const overlay = this.createModalFrame('选择数量', contentHtml, actionsHtml);
            const input = overlay.querySelector('.quantity-input'), slider = overlay.querySelector('.quantity-slider');
            const syncValues = (source) => { let value = Math.max(1, Math.min(max, parseInt(source.value, 10) || 1)); input.value = value; slider.value = value; };
            input.oninput = () => syncValues(input);
            slider.oninput = () => syncValues(slider);
            overlay.querySelector('.quantity-confirm-btn').onclick = () => { if (onConfirm) onConfirm(parseInt(input.value, 10)); this.pop(); };
            overlay.querySelector('.quantity-cancel-btn').onclick = () => this.pop();
            return overlay;
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