/**
 * @file js/ui.js
 * @description UI核心模块 (v53.0.0 - [重构] 移除右侧日志，改为滚动信息系统)
 * @author Gemini (CTO)
 * @version 53.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const UI = {
        init() {
            const dom = game.dom;
            // [修改] 更新需要缓存的DOM元素ID列表
            const ids = [
                "left-panel", "main-content", "screen", "bottom-nav",
                "toast-container", "narrative-ui", "scrolling-log-container"
            ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) dom[id] = el;
            });

            this.NarrativeManager.init();
            this.registerEventHandlers();
            this.registerDOMListeners();

            return ids.every(id => dom[id] !== undefined );
        },

        registerEventHandlers() {
            game.Events.subscribe(EVENTS.UI_RENDER, () => this.render());
            game.Events.subscribe(EVENTS.UI_RENDER_BOTTOM_NAV, () => this.renderBottomNav());
            game.Events.subscribe(EVENTS.UI_LOG_MESSAGE, (data) => this.log(data.message, data.color));
            game.Events.subscribe(EVENTS.UI_SHOW_TOAST, (data) => this.showToast(data));
            game.Events.subscribe(EVENTS.STATE_CHANGED, () => this.renderLeftPanel());
            game.Events.subscribe(EVENTS.TIME_ADVANCED, () => this.renderLeftPanel());
            game.Events.subscribe(EVENTS.GAME_LOADED, () => this.render());
            game.Events.subscribe(EVENTS.GAME_SAVED, () => {
                if (game.State.get().gameState === 'MENU' && game.State.get().menu.current === 'SYSTEM') {
                    this.render();
                }
            });
        },

        registerDOMListeners() {
            document.body.addEventListener('click', (event) => {
                if (game.narrativeContext && !game.narrativeContext.isWaitingForChoice) {
                    const narrativeUi = event.target.closest('#narrative-ui');
                    const isOptionButton = event.target.closest('#narrative-options button');
                    if (narrativeUi && !isOptionButton) {
                        this.NarrativeManager.showNextSegment();
                        return;
                    }
                }
                const target = event.target;
                const actionTarget = target.closest('[data-action]');
                if (actionTarget) {
                    const action = actionTarget.dataset.action;
                    if (game.Actions[action]) {
                        const param = actionTarget.dataset.direction || actionTarget.dataset.slot || actionTarget.dataset.index || actionTarget.dataset.id || actionTarget.dataset.filter;
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
                    } else if (gameState.menu.current === 'INVENTORY') {
                        const filterTab = target.closest('.inventory-filter-tab');
                        if (filterTab && filterTab.dataset.filter) {
                            game.state.menu.inventoryFilter = filterTab.dataset.filter;
                            this.render();
                        }
                        const inventoryItemEntry = target.closest('.inventory-item-entry');
                        if (inventoryItemEntry && inventoryItemEntry.dataset.index) {
                            if (!target.closest('button')) {
                                this.showItemDetails(inventoryItemEntry.dataset.index);
                            }
                        }
                    }
                } else if (gameState.gameState === 'MAP') {
                    const mapNode = target.closest('.map-node');
                    if (mapNode) game.Actions.handleMapNodeClick(mapNode.dataset.id);
                } else if (gameState.gameState === 'EXPLORE') {
                    const hotspotCard = target.closest('.hotspot-card, .sparkle-hotspot');
                    if (hotspotCard && hotspotCard.dataset.interaction) {
                        const index = parseInt(hotspotCard.dataset.index, 10);
                        const type = hotspotCard.dataset.type;
                        game.Actions.handleInteraction(JSON.parse(hotspotCard.dataset.interaction), index, type);
                    }
                }
            });
        },

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

        render() {
            const dom = game.dom;
            const gameState = game.State.get();
            try {
                const isTitle = gameState.gameState === 'TITLE';
                dom['left-panel'].classList.toggle('hidden', isTitle);
                // [修改] 不再需要控制 right-panel
                dom['bottom-nav'].classList.toggle('hidden', isTitle);

                if (!isTitle) {
                    this.renderLeftPanel();
                    this.renderBottomNav();
                }

                const renderer = this.screenRenderers[gameState.gameState];
                if (renderer) renderer.call(this);
                else this.log(game.Utils.formatMessage('errorStateRenderer', { gameState: gameState.gameState }), 'var(--error-color)');
            } catch (error) {
                console.error("渲染错误:", error);
                this.log(game.Utils.formatMessage('errorRender'), 'var(--error-color)');
            }
        },

        /**
         * [重构] 将日志信息显示为屏幕上的滚动消息。
         * @param {string} message - 要显示的消息文本 (支持HTML)。
         * @param {string} [color="var(--text-on-primary-color)"] - 文本颜色。
         */
        log(message, color = "var(--text-on-primary-color)") {
            const container = game.dom['scrolling-log-container'];
            if (!container) return;

            // 限制最大消息数量，防止刷屏
            const MAX_LOGS = 10;
            if (container.children.length >= MAX_LOGS) {
                container.removeChild(container.firstChild);
            }

            const p = document.createElement("p");
            p.className = 'log-message';
            p.style.color = color;
            p.innerHTML = message;

            container.appendChild(p);

            // 4秒后开始淡出
            setTimeout(() => {
                p.classList.add('fade-out');
                // 动画结束后移除元素
                p.addEventListener('animationend', () => p.remove());
            }, 4000);
        },

        showToast({ title, text, icon }) {
            const container = game.dom['toast-container'];
            if (!container) return;
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `<div class="toast-icon">${icon || '⭐'}</div><div class="toast-content"><strong class="toast-title">${title || ''}</strong><span class="toast-text">${text || ''}</span></div>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('fade-out');
                toast.addEventListener('animationend', () => toast.remove());
            }, 3000);
        },

        renderLeftPanel() {
            const dom = game.dom;
            const gameState = game.State.get();
            const effectiveStats = gameState.effectiveStats || gameState.stats;
            if (!this.isLeftPanelInitialized) {
                dom['left-panel'].innerHTML = `
                    <div class="player-avatar" id="left-panel-avatar"></div>
                    <div class="player-info-main">
                        <div class="player-name" id="left-panel-player-name"></div>
                        <div class="player-gold" title="金钱">${gameData.icons.gold} <span id="left-panel-gold"></span></div>
                    </div>
                    <div class="game-time-container" id="left-panel-time-container">
                        <div class="game-time" id="left-panel-time"></div>
                        <div class="game-date" id="left-panel-date"></div>
                    </div>
                    <div class="resource-bars-container">
                        <div class="resource-bar top-hp-bar" id="left-panel-hp-bar"><div class="resource-bar-fill hp-fill" id="left-panel-hp-fill"></div><span class="resource-bar-text">健康</span></div>
                        <div class="resource-bar top-mp-bar" id="left-panel-mp-bar"><div class="resource-bar-fill mp-fill" id="left-panel-mp-fill"></div><span class="resource-bar-text">精力</span></div>
                    </div>
                    <div class="primary-stats-bar" id="left-panel-stats"></div>`;
                const idsToCache = ['left-panel-avatar', 'left-panel-player-name', 'left-panel-gold', 'left-panel-time-container', 'left-panel-time', 'left-panel-date', 'left-panel-hp-bar', 'left-panel-mp-bar', 'left-panel-hp-fill', 'left-panel-mp-fill', 'left-panel-stats'];
                idsToCache.forEach(id => dom[id] = document.getElementById(id));
                this.isLeftPanelInitialized = true;
            }
            const { name, hp, maxHp, mp, maxMp, time, gold } = gameState;
            const timeString = `${gameData.settings.weekDays[new Date(time.year, time.month - 1, time.day).getDay()]} ${gameData.settings.timePhases[time.phase]}`;
            dom['left-panel-avatar'].innerHTML = this.getAvatarHtml(gameState);
            dom['left-panel-player-name'].textContent = name;
            dom['left-panel-gold'].textContent = gold;
            dom['left-panel-time'].textContent = timeString;
            dom['left-panel-date'].textContent = `${time.year}年${time.month}月${time.day}日`;
            dom['left-panel-hp-bar'].title = `健康: ${Math.ceil(hp)} / ${maxHp}`;
            dom['left-panel-hp-fill'].style.width = (maxHp > 0 ? (hp / maxHp) * 100 : 0) + '%';
            dom['left-panel-mp-bar'].title = `精力: ${Math.ceil(mp)} / ${maxMp}`;
            dom['left-panel-mp-fill'].style.width = (maxMp > 0 ? (mp / maxMp) * 100 : 0) + '%';
            dom['left-panel-stats'].innerHTML = Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).map(([key, statName]) => `<div class="primary-stat" title="${statName}">${gameData.icons[key]} ${effectiveStats[key]}</div>`).join('');
        },

        renderBottomNav() {
            const dom = game.dom;
            const gameState = game.State.get();
            const buttonsData = [
                { id: "MAP", label: "地图", icon: "🗺️" }, { id: "STATUS", label: "状态", icon: "👤" },
                { id: "INVENTORY", label: "物品", icon: "🎒" }, { id: "QUESTS", label: "任务", icon: "📜" },
                { id: "PARTY", label: "人际", icon: "👨‍👩‍👧" }, { id: "SYSTEM", label: "系统", icon: "⚙️" }
            ];
            if (!this.isBottomNavInitialized) {
                dom['bottom-nav'].innerHTML = '';
                dom.navButtons = buttonsData.map(btnData => {
                    const buttonEl = document.createElement('button');
                    buttonEl.innerHTML = `<div>${btnData.icon}</div><div>${btnData.label}</div>`;
                    dom['bottom-nav'].appendChild(buttonEl);
                    return buttonEl;
                });
                this.isBottomNavInitialized = true;
            }
            const isMenu = gameState.gameState === "MENU";
            const currentMenu = gameState.menu?.current;
            const isGloballyDisabled = gameState.isCombat || gameState.gameState === 'SEQUENCE' || !!game.narrativeContext || this.ModalManager.stack.length > 0;

            dom.navButtons.forEach((buttonEl, index) => {
                const btnData = buttonsData[index];
                let isActive = false, actionFn = null;
                if (btnData.id === 'MAP') {
                    isActive = ['MAP', 'EXPLORE'].includes(gameState.gameState);
                    actionFn = isMenu ? () => game.Actions.exitMenu() : (isActive ? null : () => game.Actions.showMap());
                } else {
                    isActive = isMenu && currentMenu === btnData.id;
                    actionFn = () => game.Actions.setUIMode('MENU', { screen: btnData.id });
                }
                buttonEl.className = `nav-button ${isActive ? 'active' : ''}`;
                buttonEl.onclick = actionFn;
                buttonEl.disabled = isGloballyDisabled || (actionFn === null) || isActive;
            });
        },

        getAvatarHtml(unit) { const id = unit ? (unit.id || 'unknown') : 'unknown'; const name = unit ? (unit.name || '未知单位') : '未知单位'; const imagePath = `images/${id}.png`; return `<img src="${imagePath}" alt="${name}" class="avatar-image" onerror="this.onerror=null; this.src='${game.DEFAULT_AVATAR_FALLBACK_IMAGE}';">`; },

        typewriter(element, text, callback) {
            clearTimeout(this.typewriterTimeout);
            let i = 0;
            element.innerHTML = '';
            this.isTyping = true;
            const type = () => {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    this.typewriterTimeout = setTimeout(type, game.TYPEWRITER_SPEED);
                } else {
                    this.isTyping = false;
                    if (callback) callback();
                }
            };
            type();
        },

        updateSceneBackground(imageUrl) {
            const mapArea = game.dom.screen.querySelector('.map-area');
            if(mapArea) {
                mapArea.style.backgroundImage = `url('${imageUrl}')`;
            }
        },

        showNarrative(dialogueId) { return this.NarrativeManager.show(dialogueId); },
        showConfirmation(payload) {
             const options = payload.options || [ { text: '取消', value: false, class: 'secondary-action'}, { text: '确认', value: true } ];
             const title = payload.title || gameData.systemMessages.systemConfirm.title;
             const html = payload.html || `<p>${payload.text || ''}</p>`;
             return this.ModalManager.push({ type: 'confirmation', payload: { title, html, options } });
        },
        showCustomModal(payload) { return this.ModalManager.push({ type: 'custom', payload }); },
        showMessage(text) { return this.ModalManager.push({ type: 'custom', payload: { title: gameData.systemMessages.systemConfirm.title, html: `<p>${text}</p>` } }); },
        showJobBoard(payload) { return this.ModalManager.push({ type: 'job_board', payload }); },
        showJobDetails(jobId) { return this.ModalManager.push({ type: 'job_details', payload: { jobId } }); },
        showItemDetails(inventoryIndex) {
            const item = game.State.get().inventory[inventoryIndex];
            if (!item) return;
            return this.ModalManager.push({ type: 'item_details', payload: { item, itemData: gameData.items[item.id], index: inventoryIndex }});
        },
        showEquippedItemDetails(itemId, slotId) {
            const itemData = gameData.items[itemId];
            if (!itemData) return;
            return this.ModalManager.push({ type: 'item_details', payload: { item: { id: itemId, quantity: 1 }, itemData, isEquipped: true, slotId: slotId }});
        },
        showQuestDetails(jobId) {
            const jobData = gameData.jobs[jobId];
            if (!jobData) return;
            const gameState = game.State.get();
            const questState = gameState.variables[jobData.questVariable] || 0;
            return this.ModalManager.push({ type: 'quest_details', payload: { jobData, questInstance: gameState.quests[jobData.questId], status: questState === 1 ? 'active' : 'completed' } });
        },
        showDropQuantityPrompt(index) {
            const itemStack = game.State.get().inventory[index];
            const itemData = gameData.items[itemStack.id];
            if (!itemData) return Promise.resolve(null);

            return this.ModalManager.push({
                type: 'quantity_prompt',
                payload: {
                    title: `丢弃多少${itemData.name}？`,
                    max: itemStack.quantity
                }
            });
        }
    };

    if (!window.game.UI) window.game.UI = {};
    Object.assign(window.game.UI, UI);

})();