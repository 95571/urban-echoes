/**
 * @file js/ui.js
 * @description UI渲染模块 (v26.6.0 - [修复] 修复接受任务时弹窗闪烁的问题)
 * @author Gemini (CTO)
 * @version 26.6.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    
    const UI = {
        typewriterTimeout: null,
        isTyping: false,
        isTopBarInitialized: false,
        isBottomNavInitialized: false,
        isCombatScreenInitialized: false, 

        ModalManager: {
            stack: [],
            baseZIndex: 1000,

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

            // [重构] 简化pop逻辑，移除导致闪烁的重渲染代码
            pop() {
                if (this.stack.length === 0) return;
            
                const modalToPop = this.stack.pop();
                clearTimeout(UI.typewriterTimeout);
                UI.isTyping = false;
            
                if (modalToPop.domElement) {
                    modalToPop.domElement.classList.remove('visible');
                    setTimeout(() => {
                        modalToPop.domElement.remove();
                    }, 100); 
                }
            
                game.UI.render();
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
                    default:
                        overlay = this.createStandardDialogueDOM(modalConfig);
                        break;
                }
                overlay.style.zIndex = zIndex;
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
                    <div class="custom-modal-actions">${actionsHtml}</div>
                `;

                overlay.appendChild(box);
                
                overlay.onclick = (e) => { if (e.target === overlay) this.pop(); };

                return overlay;
            },
            
            createCustomModalDOM(modalConfig) {
                const title = modalConfig.title || '';
                const contentHtml = modalConfig.html || '';
                const actionsHtml = `<button class="custom-modal-close-btn">关闭</button>`;
                
                const overlay = this.createModalFrame(title, contentHtml, actionsHtml);
                
                overlay.querySelector('.custom-modal-close-btn').onclick = () => this.pop();

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
                    
                    const handleChoice = (chosenValue) => {
                        const chosenOptionWrapper = availableOptions.find(opt => opt.value === chosenValue);
                        if (!chosenOptionWrapper) return;
                        const originalOption = chosenOptionWrapper.originalOption;

                        if (originalOption.actionBlock) {
                            game.Actions.executeActionBlock(originalOption.actionBlock);
                        }
                        
                        if (originalOption.followUp) {
                            updateModalContent({ ...currentDialogueData, ...originalOption.followUp });
                        } else if (originalOption.subDialogue) {
                            const sub = originalOption.subDialogue;
                            if (sub.type === 'job_board') {
                                UI.showJobBoard(sub.payload);
                            } else {
                                UI.showConfirmation(sub);
                            }
                        } else {
                            this.resolveCurrent(chosenOptionWrapper);
                        }
                    };
                    
                    const fullText = currentDialogueData.dialogueText || currentDialogueData.text || currentDialogueData.title || '';
                    const textSegments = fullText.split('<br>').join('\n').split('\n').filter(s => s.trim() !== '');
                    let currentSegmentIndex = 0;
                    
                    const defaultAlignment = isRichMode ? 'left' : 'center';
                    textEl.style.textAlign = currentDialogueData.textAlign || defaultAlignment;
                    let shouldUseTypewriter = isRichMode;
                    if (currentDialogueData.useTypewriter !== undefined) shouldUseTypewriter = currentDialogueData.useTypewriter;

                    const showNextSegment = () => {
                        if (UI.isTyping) {
                            clearTimeout(UI.typewriterTimeout);
                            UI.isTyping = false;
                            textEl.innerHTML = textSegments[currentSegmentIndex - 1]; 
                            if (currentSegmentIndex < textSegments.length) {
                                continueIndicator.classList.remove('hidden');
                            } else {
                                showNextSegment();
                            }
                            return;
                        }

                        if (currentSegmentIndex >= textSegments.length) {
                            textContainer.onclick = null;
                            overlay.onclick = null;
                            continueIndicator.classList.add('hidden');
                            if (availableOptions.length > 0) {
                                buttonsDiv.innerHTML = availableOptions.map(opt => `<button data-value='${JSON.stringify(opt.value)}' class="${opt.originalOption.class || ''}" style="text-align: ${opt.originalOption.textAlign || 'left'}">${opt.text}</button>`).join('');
                                buttonsDiv.querySelectorAll('button').forEach(btn => {
                                    btn.onclick = (e) => {
                                        e.stopPropagation();
                                        handleChoice(JSON.parse(btn.dataset.value));
                                    };
                                });
                            } else {
                                this.resolveCurrent({ value: true });
                            }
                            return;
                        }

                        continueIndicator.classList.add('hidden');
                        const segment = textSegments[currentSegmentIndex];
                        currentSegmentIndex++;

                        const onSegmentComplete = () => {
                             if (currentSegmentIndex < textSegments.length || (availableOptions.length === 0 && textSegments.length > 0)) {
                                continueIndicator.classList.remove('hidden');
                            } else {
                                showNextSegment();
                            }
                        };
                        
                        if (shouldUseTypewriter) UI.typewriter(textEl, segment, onSegmentComplete);
                        else {
                            textEl.innerHTML = textSegments.join('<br>');
                            currentSegmentIndex = textSegments.length;
                            onSegmentComplete();
                        }
                    };

                    if (textSegments.length > 0) {
                        textContainer.onclick = showNextSegment;
                        overlay.onclick = (e) => { if (e.target === overlay) showNextSegment(); };
                        showNextSegment();
                    } else {
                        showNextSegment();
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
                        UI.showJobDetails(jobId);
                    };
                });

                const jobListEl = overlay.querySelector('.job-list');
                if (jobListEl) {
                    this.makeListDraggable(jobListEl);
                }

                return overlay;
            },

            // [重构] 采用“手术刀”式DOM操作，避免闪烁
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
                        await game.Actions.actionHandlers.acceptJob({ jobId: jobId });
                        const newState = game.State.get().variables[jobData.questVariable] || 0;

                        // 仅在任务状态成功从0变为1时，才执行UI操作
                        if (oldState === 0 && newState === 1) {
                            // "手术刀"操作：找到并移除公告板上的对应条目
                            if (this.stack.length > 1) {
                                const jobBoardModal = this.stack[this.stack.length - 2].domElement;
                                if (jobBoardModal) {
                                    const jobItemToRemove = jobBoardModal.querySelector(`.job-item[data-job-id="${jobId}"]`);
                                    if (jobItemToRemove) {
                                        jobItemToRemove.remove();
                                    }
                                }
                            }
                            this.pop(); // 关闭当前详情弹窗
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
                if (!element || element.scrollHeight <= element.clientHeight) return;
                
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
        },

        init() {
            const dom = game.dom;
            const ids = [ "top-bar", "main-content", "message-log", "screen", "bottom-nav", ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) dom[id] = el;
            });
            
            document.body.addEventListener('click', (event) => {
                const target = event.target;
                const actionTarget = target.closest('[data-action]');
                if (actionTarget) {
                    const action = actionTarget.dataset.action;
                    if (game.Actions[action]) {
                        const param = actionTarget.dataset.slot || actionTarget.dataset.index || actionTarget.dataset.id;
                        event.stopPropagation();
                        game.Actions[action](param);
                        return;
                    }
                }
                const gameState = game.State.get();
                if (gameState.isCombat) {
                    const targetCard = target.closest('.combatant-card.enemy');
                    if (targetCard) game.Actions.setFocusTarget(targetCard.id);
                } else if (gameState.gameState === 'MENU') {
                    if (gameState.menu.current === 'PARTY') {
                         const targetMember = target.closest('.relationship-entry');
                         if (targetMember) game.Actions.viewRelationshipDetail(targetMember.dataset.id);
                    } else if (gameState.menu.current === 'STATUS') {
                        const targetSkill = target.closest('.skill-list-entry');
                        if (targetSkill) game.Actions.viewSkillDetail(targetSkill.dataset.id);
                    }
                } else if (gameState.gameState === 'MAP') {
                    const mapNode = target.closest('.map-node');
                    if (mapNode) game.Actions.handleMapNodeClick(mapNode.dataset.id);
                } else if (gameState.gameState === 'EXPLORE') {
                    const hotspot = target.closest('.hotspot');
                    if (hotspot && hotspot.dataset.interaction) { 
                        const index = parseInt(hotspot.dataset.index, 10);
                        const interactionData = JSON.parse(hotspot.dataset.interaction);
                        game.Actions.handleInteraction(interactionData, index);
                    }
                }
            });
            return ids.every(id => dom[id] !== undefined );
        },

        render() {
            const dom = game.dom;
            const gameState = game.State.get();
            try {
                const isTitle = gameState.gameState === 'TITLE';
                dom['top-bar'].classList.toggle('hidden', isTitle);
                
                dom['bottom-nav'].classList.toggle('hidden', isTitle);
                if (!isTitle) {
                    this.renderBottomNav();
                }
                
                const shouldShowLog = ['EXPLORE', 'MAP', 'COMBAT'].includes(gameState.gameState);
                dom['message-log'].classList.toggle('hidden', !shouldShowLog);
                
                if (!isTitle) this.renderTopBar();

                const renderer = this.screenRenderers[gameState.gameState];
                if (renderer) renderer.call(this);
                else this.log(game.Utils.formatMessage('errorStateRenderer', { gameState: gameState.gameState }), 'var(--error-color)');
            } catch (error) {
                console.error("渲染错误:", error);
                this.log(game.Utils.formatMessage('errorRender'), 'var(--error-color)');
            }
        },
        
        log(message, color = "var(--text-color)") {
            const dom = game.dom;
            if (!dom['message-log']) return;
            const p = document.createElement("p");
            p.innerHTML = `<span style="color:${color};">${message}</span>`;
            dom['message-log'].appendChild(p);
            dom['message-log'].scrollTop = dom['message-log'].scrollHeight;
            if (dom['message-log'].children.length > 100) dom['message-log'].removeChild(dom['message-log'].firstChild);
        },

        renderTopBar() {
            const dom = game.dom;
            const gameState = game.State.get();
            const effectiveStats = gameState.effectiveStats || gameState.stats;
            if (!this.isTopBarInitialized) {
                dom['top-bar'].innerHTML = `
                    <div class="player-avatar" id="top-bar-avatar"></div>
                    <div class="player-info-main">
                        <div class="player-name" id="top-bar-player-name"></div>
                        <div class="player-gold" title="金钱">${gameData.icons.gold} <span id="top-bar-gold"></span></div>
                        <div class="game-time" id="top-bar-time-container" title=""><span id="top-bar-time"></span></div>
                    </div>
                    <div class="resource-bars-container">
                        <div class="resource-bar top-hp-bar" id="top-bar-hp-bar">
                            <div class="resource-bar-fill hp-fill" id="top-bar-hp-fill"></div>
                            <span class="resource-bar-text">健康</span>
                        </div>
                        <div class="resource-bar top-mp-bar" id="top-bar-mp-bar">
                            <div class="resource-bar-fill mp-fill" id="top-bar-mp-fill"></div>
                            <span class="resource-bar-text">精力</span>
                        </div>
                    </div>
                    <div class="primary-stats-bar" id="top-bar-stats"></div>
                `;
                const idsToCache = ['top-bar-avatar', 'top-bar-player-name', 'top-bar-gold', 'top-bar-time-container', 'top-bar-time', 'top-bar-hp-bar', 'top-bar-mp-bar', 'top-bar-hp-fill', 'top-bar-mp-fill', 'top-bar-stats'];
                idsToCache.forEach(id => dom[id] = document.getElementById(id));
                this.isTopBarInitialized = true;
            }
            const { name, hp, maxHp, mp, maxMp, time, gold } = gameState;
            const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;
            const mpPercentage = maxMp > 0 ? (mp / maxMp) * 100 : 0;
            const timeString = `${gameData.settings.weekDays[new Date(time.year, time.month - 1, time.day).getDay()]} ${gameData.settings.timePhases[time.phase]}`;
            const fullDateString = `${time.year}年${time.month}月${time.day}日`;
            const primaryStatsHtml = Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).map(([key, statName]) => `<div class="primary-stat" title="${statName}">${gameData.icons[key]} ${effectiveStats[key]}</div>`).join('');
            dom['top-bar-avatar'].innerHTML = this.getAvatarHtml(gameState);
            dom['top-bar-player-name'].textContent = name;
            dom['top-bar-gold'].textContent = gold;
            dom['top-bar-time'].textContent = timeString;
            dom['top-bar-time-container'].title = fullDateString;
            dom['top-bar-hp-bar'].title = `健康: ${Math.ceil(hp)} / ${maxHp}`;
            dom['top-bar-hp-fill'].style.width = hpPercentage + '%';
            dom['top-bar-mp-bar'].title = `精力: ${Math.ceil(mp)} / ${maxMp}`;
            dom['top-bar-mp-fill'].style.width = mpPercentage + '%';
            dom['top-bar-stats'].innerHTML = primaryStatsHtml;
        },

        renderBottomNav() {
            const dom = game.dom;
            const gameState = game.State.get();
            const buttonsData = [ { id: "MAP", label: "地图", icon: "🗺️" }, { id: "STATUS", label: "状态", icon: "👤" }, { id: "INVENTORY", label: "物品", icon: "🎒" }, { id: "QUESTS", label: "任务", icon: "📜" }, { id: "PARTY", label: "人际", icon: "👨‍👩‍👧" }, { id: "SYSTEM", label: "系统", icon: "⚙️" } ];
            if (!this.isBottomNavInitialized) {
                dom['bottom-nav'].innerHTML = '';
                dom.navButtons = [];
                buttonsData.forEach(btnData => {
                    const buttonEl = document.createElement('button');
                    buttonEl.innerHTML = `${btnData.icon}<br>${btnData.label}`;
                    dom['bottom-nav'].appendChild(buttonEl);
                    dom.navButtons.push(buttonEl);
                });
                this.isBottomNavInitialized = true;
            }
            const isMenu = gameState.gameState === "MENU";
            const currentMenu = gameState.menu?.current;
            const isGloballyDisabled = gameState.isCombat || gameState.gameState === 'SEQUENCE' || this.ModalManager.stack.length > 0;
            dom.navButtons.forEach((buttonEl, index) => {
                const btnData = buttonsData[index];
                let isActive = false;
                let actionFn = null;
                if (btnData.id === 'MAP') {
                    isActive = !isMenu;
                    if (isMenu) actionFn = () => game.Actions.exitMenu();
                } else {
                    isActive = isMenu && currentMenu === btnData.id;
                    actionFn = () => game.Actions.setUIMode('MENU', { screen: btnData.id });
                }
                buttonEl.className = `nav-button ${isActive ? 'active' : ''}`;
                buttonEl.onclick = actionFn;
                buttonEl.disabled = isGloballyDisabled || isActive;
            });
        },

        getAvatarHtml(unit) { const id = unit ? (unit.id || 'unknown') : 'unknown'; const name = unit ? (unit.name || '未知单位') : '未知单位'; const imagePath = `images/${id}.png`; return `<img src="${imagePath}" alt="${name}" class="avatar-image" onerror="this.onerror=null; this.src='${game.DEFAULT_AVATAR_FALLBACK_IMAGE}';">`; },
        
        createFromTemplate(templateId, data) {
            const template = document.getElementById(templateId);
            if (!template) {
                console.error(`Template with id ${templateId} not found.`);
                return null;
            }
            const clone = template.content.cloneNode(true);
            for (const key in data) {
                const el = clone.querySelector(`.${key}`);
                if (el) {
                    el.innerHTML = data[key];
                }
            }
            return clone;
        },

        typewriter(element, text, callback) { clearTimeout(this.typewriterTimeout); let i = 0; element.innerHTML = ''; const type = () => { if (i < text.length) { element.innerHTML += text.charAt(i); i++; this.typewriterTimeout = setTimeout(type, game.TYPEWRITER_SPEED); } else { this.isTyping = false; if (callback) callback(); } }; this.isTyping = true; type(); },
        showConfirmation(dialogueData) { return this.ModalManager.push(dialogueData); },
        showMessage(text, buttonLabel = '确定') { const dialogueData = { text: text, textAlign: 'center', useTypewriter: false, options: [{ text: buttonLabel, value: true }] }; return this.showConfirmation(dialogueData); },
        showCustomModal(title, htmlContent) { return this.ModalManager.push({ type: 'custom', title, html: htmlContent }); },
        showJobBoard(payload) { return this.ModalManager.push({ type: 'job_board', payload }); },
        showJobDetails(jobId) { return this.ModalManager.push({ type: 'job_details', payload: { jobId } }); },
        showQuestDetails(jobId) {
            const jobData = gameData.jobs[jobId];
            if (!jobData) return;
            const gameState = game.State.get();
            const questState = gameState.variables[jobData.questVariable] || 0;
            const questInstance = gameState.quests[jobData.questId];
            const status = questState === 1 ? 'active' : 'completed';

            return this.ModalManager.push({ type: 'quest_details', payload: { jobData, questInstance, status } });
        },

        screenRenderers: {
            TITLE() { const dom = game.dom; dom.screen.className = 'title-screen'; dom.screen.innerHTML = ` <div class="title-content"> <h1 class="game-title">都市回响</h1> <p class="game-subtitle">Urban Echoes</p> <div class="title-buttons"> <button data-action="newGame">新的人生</button> <button data-action="showLoadScreen">杭城旧梦</button> <button data-action="showAchievements">成就殿堂</button> <button data-action="showAbout">关于游戏</button> </div> </div> `; },
            SEQUENCE() { const dom = game.dom; const gameState = game.State.get(); const sequenceState = gameState.activeSequence; if (!sequenceState) { console.error("SEQUENCE renderer called with no active sequence."); return; } const sequenceData = gameData.questionSequences[sequenceState.sequenceId]; const questionData = sequenceData.questions[sequenceState.currentQuestionId]; if (!questionData) { console.error(`Question "${sequenceState.currentQuestionId}" not found in sequence "${sequenceState.sequenceId}".`); return; } dom.screen.className = 'sequence-screen'; dom.screen.style.backgroundImage = ''; let answersHtml = ''; if (questionData.type === 'multiple_choice') { answersHtml = questionData.answers.map((answer, index) => `<button onclick="game.Actions.handleSequenceAnswer(${index})">${answer.text}</button>`).join(''); } else if (questionData.type === 'text_input') { answersHtml = `<input type="text" id="sequence-text-input" placeholder="请输入你的名字..." /><button onclick="game.Actions.handleSequenceTextInput(document.getElementById('sequence-text-input').value)">${questionData.answers[0].text}</button>`; } dom.screen.innerHTML = `<div class="sequence-image-container">${questionData.imageUrl ? `<img src="${questionData.imageUrl}" alt="情景图片">` : ''}</div><div class="sequence-qa-container"><div class="sequence-question">${questionData.text}</div><div class="sequence-answers">${answersHtml}</div></div>`; },
            EXPLORE() { const dom = game.dom; const gameState = game.State.get(); dom.screen.className = 'explore-screen'; dom.screen.style.backgroundImage = ''; const location = gameData.locations[gameState.currentLocationId]; if (!location) { UI.log(game.Utils.formatMessage('errorNotFound', { target: gameState.currentLocationId }), "var(--error-color)"); return; } const hotspotsHtml = location.hotspots.map((spot, index) => ({ spot, index })).filter(({ spot, index }) => { const isDestroyed = gameState.flags[`hotspot_destroyed_${gameState.currentLocationId}_${index}`]; return !isDestroyed && game.ConditionChecker.evaluate(spot.conditions); }).map(({ spot, index }) => { const spotEl = document.createElement('div'); spotEl.className = 'hotspot'; spotEl.style.left = `${spot.x}%`; spotEl.style.top = `${spot.y}%`; spotEl.textContent = spot.label; spotEl.dataset.interaction = JSON.stringify(spot); spotEl.dataset.index = index; return spotEl.outerHTML; }).join(''); dom.screen.innerHTML = `<div class="location-header"><h2>${location.name}</h2><p>${location.description}</p></div><div class="map-area" style="background-image: ${location.imageUrl ? `url('${location.imageUrl}')` : 'none'}">${hotspotsHtml}</div>`; },
            MAP() { const dom = game.dom; const gameState = game.State.get(); dom.screen.style.backgroundImage = ''; const mapData = gameData.maps[gameState.currentMapId]; if (!mapData) { UI.log(game.Utils.formatMessage('errorNotFound', { target: gameState.currentMapId }), 'var(--error-color)'); return; } dom.screen.className = 'map-screen'; dom.screen.innerHTML = `<div class="location-header"><h2>${mapData.name}</h2></div>`; const { nodes, connections } = mapData; const fragment = document.createDocumentFragment(); const mapContainer = document.createElement('div'); mapContainer.style.position = 'relative'; mapContainer.style.width = '100%'; mapContainer.style.height = '100%'; connections.forEach(conn => { const node1 = nodes[conn[0]]; const node2 = nodes[conn[1]]; if (!node1 || !node2) return; const line = document.createElement('div'); line.className = 'map-line'; const x1 = node1.x, y1 = node1.y, x2 = node2.x, y2 = node2.y; const deltaX = (x2 - x1) * (dom.screen.clientWidth / 100); const deltaY = (y2 - y1) * ((dom.screen.clientHeight - 48) / 100); const distance = Math.hypot(deltaX, deltaY); const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); line.style.left = `${x1}%`; line.style.top = `${y1}%`; line.style.width = `${distance}px`; line.style.transform = `rotate(${angle}deg)`; mapContainer.appendChild(line); }); for (const nodeId in nodes) { const nodeData = nodes[nodeId]; const nodeEl = document.createElement('div'); nodeEl.className = 'map-node'; nodeEl.dataset.id = nodeId; nodeEl.style.left = `${nodeData.x}%`; nodeEl.style.top = `${nodeData.y}%`; if (nodeId === gameState.currentMapNodeId) nodeEl.classList.add('current'); const isInteractable = game.ConditionChecker.evaluate(nodeData.conditions); if (!isInteractable) nodeEl.classList.add('inactive'); nodeEl.innerHTML = `<span>${nodeData.icon}</span><div class="node-label">${nodeData.name}</div>`; mapContainer.appendChild(nodeEl); } fragment.appendChild(mapContainer); dom.screen.appendChild(fragment); },
            MENU() {
                const dom = game.dom;
                const gameState = game.State.get();
                dom.screen.style.backgroundImage = ''; 
                const screen = gameState.menu.current;
                const title = gameData.screenTitles[screen] || screen;
                
                dom.screen.className = 'menu-screen';
                dom.screen.style.padding = '15px';

                dom.screen.innerHTML = `<h2>${title}</h2><div id="menu-content"></div>`;
                const contentEl = document.getElementById('menu-content');

                if (screen === 'QUESTS') {
                    dom.screen.style.padding = '15px 15px 10px 15px';
                    contentEl.style.height = `calc(100% - ${contentEl.previousElementSibling.offsetHeight}px)`;
                }

                const menuRenderer = UI.menuRenderers[screen];
                if (menuRenderer) menuRenderer.call(this, contentEl);
                else contentEl.innerHTML = `<p>【${title}】功能正在开发中...</p>`;
            },
            COMBAT() { const dom = game.dom; const gameState = game.State.get(); dom.screen.style.backgroundImage = ''; if (!gameState.combatState) return; if (!this.isCombatScreenInitialized) { dom.screen.className = 'combat-screen'; dom.screen.innerHTML = ''; const enemyContainer = document.createElement('div'); enemyContainer.className = 'combat-container enemy-container'; const enemyPositionMap = ["e-front-c", "e-front-l", "e-front-r", "e-back-c", "e-back-l", "e-back-r"]; dom.enemyCards = {}; gameState.combatState.enemies.forEach((unit, index) => { const card = document.createElement('div'); card.id = unit.combatId; card.style.gridArea = enemyPositionMap[index]; card.innerHTML = `<img src="images/${unit.id}.png" alt="${unit.name}" class="enemy-sprite" onerror="this.onerror=null; this.src='${game.DEFAULT_AVATAR_FALLBACK_IMAGE}';"><div class="name">${unit.name}</div>`; enemyContainer.appendChild(card); dom.enemyCards[unit.combatId] = card; }); const divider = document.createElement('div'); divider.className = 'combat-divider'; divider.innerHTML = '⚔️'; const actionsPanel = document.createElement('div'); actionsPanel.id = 'combat-actions-panel'; dom.combatActionButtons = {}; const actions = [{ id: 'Attack', label: '攻击' }, { id: 'Skill', label: '技能' }, { id: 'Defend', label: '防御' }, { id: 'Item', label: '道具' }, { id: 'Flee', label: '逃跑' }]; actions.forEach(action => { const button = document.createElement('button'); button.dataset.action = `playerCombat${action.id}`; button.textContent = action.label; actionsPanel.appendChild(button); dom.combatActionButtons[action.id] = button; }); dom.screen.append(enemyContainer, divider, actionsPanel); this.isCombatScreenInitialized = true; } const { enemies, activeUnit, focusedTargetId, isWaitingForPlayerInput } = gameState.combatState; enemies.forEach(unit => { const card = dom.enemyCards[unit.combatId]; if (!card) return; let classes = 'combatant-card enemy'; if (unit.combatId === focusedTargetId) classes += ' focused'; if (activeUnit && unit.combatId === activeUnit.combatId) classes += ' active-turn'; if (unit.hp <= 0) classes += ' dead'; card.className = classes; }); const buttonsDisabled = !isWaitingForPlayerInput; const availability = game.Combat.getCombatActionAvailability(); dom.combatActionButtons.Attack.disabled = buttonsDisabled || !availability.attack; dom.combatActionButtons.Skill.disabled = buttonsDisabled || !availability.skill; dom.combatActionButtons.Defend.disabled = buttonsDisabled || !availability.defend; dom.combatActionButtons.Item.disabled = buttonsDisabled || !availability.item; dom.combatActionButtons.Flee.disabled = buttonsDisabled || !availability.flee; }
        },
        menuRenderers: {
            STATUS(container) {
                const gameState = game.State.get();
                if (gameState.menu.skillDetailView) { UI.menuRenderers.renderSkillDetail.call(this, container, gameState.menu.skillDetailView); return; }
                const targetId = gameState.menu.statusViewTargetId;
                const isPlayer = !targetId;
                const unit = isPlayer ? gameState : gameState.party.find(p => p.id === targetId);
                if (!unit) { container.innerHTML = `<p>错误：找不到要查看的角色。</p><button class="back-button" data-action="backToPartyScreen">返回</button>`; return; }
                
                const effectiveStats = isPlayer ? unit.effectiveStats : game.Utils.calculateEffectiveStatsForUnit(unit);
                
                container.innerHTML = `${!isPlayer ? `<button class="back-button" data-action="backToPartyScreen">返回人际关系</button>`: ''}<div class="status-avatar-area" id="status-avatar"></div><div class="status-header"><h3 id="status-name"></h3><p id="status-desc" style="padding: 0 10px; line-height:1.6;"></p></div><div id="player-only-sections"></div>`;
                document.getElementById('status-avatar').innerHTML = this.getAvatarHtml(unit);
                document.getElementById('status-name').textContent = unit.name;
                
                if (isPlayer) {
                    document.getElementById('status-desc').textContent = '一个刚踏入社会的毕业生，未来充满无限可能。';
                    const playerSectionsContainer = document.getElementById('player-only-sections');
                    playerSectionsContainer.innerHTML = `<div class="status-section"><h4>核心属性</h4><ul class="stat-list core-stats" id="core-stats-list"></ul></div><div class="status-section"><h4>派生属性</h4><ul class="stat-list" id="combat-stats-list"></ul></div><div class="status-section" id="perks-section"></div><div class="status-section" id="skill-proficiency-section"></div>`;
                    
                    const coreStatsList = document.getElementById('core-stats-list');
                    coreStatsList.innerHTML = '';
                    Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).forEach(([key, name]) => {
                        coreStatsList.appendChild(this.createFromTemplate('template-core-stat-item', { 'stat-name': `${gameData.icons[key]} ${name}`, 'stat-value': effectiveStats[key] }));
                    });
                    
                    const combatStatsList = document.getElementById('combat-stats-list');
                    combatStatsList.innerHTML = '';
                    [ { name: `${gameData.icons.health} 健康上限`, value: effectiveStats.maxHp }, { name: `${gameData.icons.energy} 精力上限`, value: effectiveStats.maxMp }, { name: `${gameData.icons.attack} 攻击`, value: effectiveStats.attack }, { name: `${gameData.icons.defense} 防御`, value: effectiveStats.defense }, { name: `${gameData.icons.spd} 行动力`, value: effectiveStats.spd } ].forEach(stat => {
                        combatStatsList.appendChild(this.createFromTemplate('template-derived-stat-item', { 'stat-name': stat.name, 'stat-value': stat.value }));
                    });
                    
                    this.menuRenderers.renderPerksList.call(this, unit, document.getElementById('perks-section'));
                    this.menuRenderers.renderSkillList.call(this, unit, document.getElementById('skill-proficiency-section'));
                } else {
                    document.getElementById('status-desc').textContent = unit.description || "暂无更多信息。";
                }
            },
            renderPerksList(unit, container){ container.innerHTML = `<h4>已掌握专长</h4><ul class="stat-list perks-list"></ul>`; const list = container.querySelector('ul'); let hasPerks = false; if(unit.skillState) { for(const skillId in unit.skillState){ const skillState = unit.skillState[skillId]; if (skillState.unlockedPerks.length > 0) hasPerks = true; skillState.unlockedPerks.forEach(perkId => { const perkData = gameData.perkLibrary[perkId]; if(!perkData) return; const clone = this.createFromTemplate('template-perk-item', { 'perk-name': perkData.name }); clone.querySelector('li').title = perkData.description; list.appendChild(clone); }); } } if (!hasPerks) list.innerHTML = '<li>尚未掌握任何专长。</li>'; },
            renderSkillList(unit, container) { container.innerHTML = `<h4>技能熟练度</h4><div class="skill-grid-container"></div>`; const grid = container.querySelector('.skill-grid-container'); const skillState = unit.skillState; if (!skillState || Object.keys(skillState).length === 0) { grid.innerHTML = '<p>尚未学习任何技能。</p>'; return; } for (const skillId in skillState) { const state = skillState[skillId]; const data = gameData.skillLibrary[skillId]; if (!data) continue; const requiredProf = game.Proficiency.getRequiredForLevel(skillId, state.level + 1); const progressPercent = requiredProf > 0 && requiredProf !== Infinity ? Math.min(100, (state.proficiency / requiredProf) * 100) : (state.level >= 100 ? 100 : 0); const clone = this.createFromTemplate('template-skill-proficiency-item', { 'skill-name': data.name, 'skill-level': `Lv. ${state.level}` }); const entry = clone.querySelector('.skill-list-entry'); entry.dataset.id = skillId; clone.querySelector('.proficiency-bar').title = `熟练度: ${state.level >= 100 ? 'MAX' : `${state.proficiency} / ${requiredProf}`}`; clone.querySelector('.proficiency-bar-fill').style.width = `${progressPercent}%`; grid.appendChild(clone); } },
            renderSkillDetail(container, skillId) { const gameState = game.State.get(); const skillData = gameData.skillLibrary[skillId]; const skillState = gameState.skillState[skillId]; if (!skillData || !skillState) { container.innerHTML = `<p>无法找到技能详情。</p>`; return; } let perksByTier = {}; if (skillData.perkTree) { for (const level in skillData.perkTree) { skillData.perkTree[level].forEach(perkId => { if (!perksByTier[level]) perksByTier[level] = []; perksByTier[level].push(perkId); }); } } let perkTreeHtml = '<div class="perk-tree-container">'; for (const level of Object.keys(perksByTier).sort((a,b) => a-b)) { perkTreeHtml += `<div class="perk-tier"><h4 class="perk-tier-header">等级 ${level} 自动解锁</h4><div class="perk-nodes-list">`; perksByTier[level].forEach(perkId => { const perkData = gameData.perkLibrary[perkId]; const isLearned = skillState.unlockedPerks.includes(perkId); perkTreeHtml += `<div class="perk-node"><div class="perk-node-icon">✨</div><div class="perk-node-info"><strong>${perkData.name}</strong><small>${perkData.description}</small></div>${isLearned ? '<span style="color:var(--success-color); grid-column: 1 / -1; font-weight:bold; font-size: 0.9em; margin-top: 5px;">✓ 已掌握</span>' : ''}</div>`; }); perkTreeHtml += `</div></div>`; } perkTreeHtml += '</div>'; container.innerHTML = `<button class="back-button" data-action="viewSkillDetail" data-id="">返回状态页</button><div style="text-align: center; margin: 1rem 0;"><h3>${skillData.name} - 专长树</h3><p>${skillData.description}</p></div>${perkTreeHtml}`; },
            INVENTORY(container) { const gameState = game.State.get(); container.innerHTML = `<h4>装备中</h4><ul id="equipped-list"></ul><h4>背包</h4><ul id="inventory-list"></ul>`; const equippedList = container.querySelector('#equipped-list'); const inventoryList = container.querySelector('#inventory-list'); Object.entries({mainHand: "工具", body: "服装", accessory1: "饰品1", accessory2: "饰品2"}).forEach(([slot, name]) => { const itemId = gameState.equipped[slot]; const item = itemId ? gameData.items[itemId] : null; const clone = this.createFromTemplate('template-equipped-item', { 'item-slot-name': name, 'item-name': item ? item.name : '[空]' }); const unequipButton = clone.querySelector('.unequip-button'); if (item) { unequipButton.dataset.action = 'unequipItem'; unequipButton.dataset.slot = slot; } else { unequipButton.remove(); } equippedList.appendChild(clone); }); if (gameState.inventory.length === 0) { inventoryList.innerHTML = '<li>背包是空的。</li>'; return; } gameState.inventory.forEach((item, index) => { const itemData = gameData.items[item.id]; const clone = this.createFromTemplate('template-inventory-item', { 'item-name-quantity': `${itemData.name} x${item.quantity}` }); const actionsContainer = clone.querySelector('.item-actions'); if (itemData.type === 'consumable') { const useButton = document.createElement('button'); useButton.textContent = '使用'; useButton.dataset.action = 'useItem'; useButton.dataset.index = index; actionsContainer.appendChild(useButton); } else if (itemData.slot) { const equipButton = document.createElement('button'); equipButton.textContent = '装备'; equipButton.dataset.action = 'equipItem'; equipButton.dataset.index = index; actionsContainer.appendChild(equipButton); } const dropButton = document.createElement('button'); dropButton.textContent = '丢弃'; dropButton.className = 'danger-button'; dropButton.dataset.action = 'dropItem'; dropButton.dataset.index = index; actionsContainer.appendChild(dropButton); inventoryList.appendChild(clone); }); },
            QUESTS(container) {
                const gameState = game.State.get();
                container.innerHTML = `
                    <div class="quest-container">
                        <div class="quest-section">
                            <h4 class="quest-section-header">进行中</h4>
                            <ul class="quest-list" id="active-quests-list"></ul>
                        </div>
                        <div class="quest-section">
                            <h4 class="quest-section-header">已完成</h4>
                            <ul class="quest-list" id="completed-quests-list"></ul>
                        </div>
                    </div>
                `;

                const activeQuestsList = [];
                const completedQuestsList = [];
                const allJobData = { ...gameData.jobs }; 

                for (const varId in gameState.variables) {
                    if (varId.startsWith('q_')) {
                        const questState = gameState.variables[varId];
                        const jobData = Object.values(allJobData).find(j => j.questVariable === varId);
                        if (!jobData) continue;

                        if (questState === 1) { 
                            activeQuestsList.push(jobData);
                        } else if (questState === 2) {
                            completedQuestsList.push(jobData);
                        }
                    }
                }

                const activeListEl = container.querySelector('#active-quests-list');
                const completedListEl = container.querySelector('#completed-quests-list');

                activeListEl.innerHTML = '';
                if (activeQuestsList.length === 0) {
                    activeListEl.innerHTML = '<li><p style="padding: 10px; color: var(--text-muted-color);">当前没有进行中的任务。</p></li>';
                } else {
                    activeQuestsList.forEach(jobData => {
                        activeListEl.innerHTML += `<li class="quest-title-entry" data-job-id="${jobData.id}">${jobData.title}</li>`;
                    });
                }

                completedListEl.innerHTML = '';
                if (completedQuestsList.length === 0) {
                    completedListEl.innerHTML = '<li><p style="padding: 10px; color: var(--text-muted-color);">尚未完成任何值得记录的任务。</p></li>';
                } else {
                    completedQuestsList.forEach(jobData => {
                        completedListEl.innerHTML += `<li class="quest-title-entry completed" data-job-id="${jobData.id}">${jobData.title}</li>`;
                    });
                }
                
                container.querySelectorAll('.quest-title-entry').forEach(el => {
                    el.onclick = () => {
                        const jobId = el.dataset.jobId;
                        if (jobId) {
                            this.showQuestDetails(jobId);
                        }
                    };
                });

                this.ModalManager.makeListDraggable(activeListEl);
                this.ModalManager.makeListDraggable(completedListEl);
            },
            PARTY(container) { const gameState = game.State.get(); container.innerHTML = `<ul class="party-member-list"></ul>`; const list = container.querySelector('ul'); if (!gameState.party || gameState.party.length === 0) { list.innerHTML = '<li>你还没有建立任何稳定的人际关系。</li>'; return; } gameState.party.forEach(person => { const clone = this.createFromTemplate('template-party-member-item', { 'member-name': person.name, 'member-desc': person.description }); const entry = clone.querySelector('.relationship-entry'); entry.dataset.id = person.id; clone.querySelector('.party-member-avatar').innerHTML = this.getAvatarHtml(person); list.appendChild(clone); }); },
            SYSTEM(container) { const otherActionsHtml = `<div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 10px;"><button data-action="exitToTitle" style="width: 100%;">回到开始界面</button><button class="danger-button" data-action="resetGame" style="width: 100%;">删除所有数据并重置游戏</button></div>`; container.innerHTML = `<h4>存档管理</h4><div id="system-save-slots"></div>${otherActionsHtml}`; const listContainer = container.querySelector('#system-save-slots'); const meta = game.SaveLoad.getMeta(); let slotsHtml = '<ul class="save-slot-list">'; Array.from({ length: game.NUM_SAVE_SLOTS }, (_, i) => i + 1).forEach(slot => { const slotData = meta[slot]; const info = slotData ? `${slotData.name} - ${slotData.time}` : '[空]'; let buttonsHtml = `<button data-action="saveGame" data-slot="${slot}" title="保存">${gameData.icons.save}</button>`; if (slotData) { buttonsHtml += `<button data-action="loadGame" data-slot="${slot}" title="读取">${gameData.icons.load}</button>`; buttonsHtml += `<button data-action="exportSave" data-slot="${slot}" title="导出">${gameData.icons.export}</button>`; } buttonsHtml += `<button data-action="importSave" data-slot="${slot}" title="导入">${gameData.icons.import}</button>`; slotsHtml += `<li><div><strong class="save-slot-name">存档 ${slot}</strong><small class="save-slot-info">${info}</small></div><div class="item-actions">${buttonsHtml}</div></li>`; }); slotsHtml += '</ul>'; listContainer.innerHTML = slotsHtml; }
        }
    };
    
    game.UI = UI;

})();
