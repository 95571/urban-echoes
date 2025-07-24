/**
 * @file js/ui.js
 * @description UI核心模块 (v50.0.0 - [重构] 移除flag系统，传递交互点类型)
 * @author Gemini (CTO)
 * @version 50.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const UI = {
        typewriterTimeout: null,
        isTyping: false,
        isLeftPanelInitialized: false,
        isBottomNavInitialized: false,
        isCombatScreenInitialized: false,

        init() {
            const dom = game.dom;
            const ids = [
                "left-panel", "main-content", "right-panel", "message-log", "screen", "bottom-nav",
                "toast-container"
            ];
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

                        // [移除] 旧的装备行点击逻辑
                        const inventoryItemEntry = target.closest('.inventory-item-entry');
                        if (inventoryItemEntry && inventoryItemEntry.dataset.index) {
                            // 阻止在按钮上触发
                            if (!target.closest('button')) {
                                this.showItemDetails(inventoryItemEntry.dataset.index);
                            }
                        }
                    }
                } else if (gameState.gameState === 'MAP') {
                    const mapNode = target.closest('.map-node');
                    if (mapNode) game.Actions.handleMapNodeClick(mapNode.dataset.id);
                } else if (gameState.gameState === 'EXPLORE') {
                    const hotspotCard = target.closest('.hotspot-card, .sparkle-hotspot'); // 同时监听两种类型
                    if (hotspotCard && hotspotCard.dataset.interaction) {
                        const index = parseInt(hotspotCard.dataset.index, 10);
                        const type = hotspotCard.dataset.type; // [新增] 获取交互点类型
                        const interactionData = JSON.parse(hotspotCard.dataset.interaction);
                        // [修改] 传递类型
                        game.Actions.handleInteraction(interactionData, index, type);
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
                dom['left-panel'].classList.toggle('hidden', isTitle);
                dom['right-panel'].classList.toggle('hidden', isTitle);
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

        log(message, color = "var(--text-color)") {
            const dom = game.dom;
            if (!dom['message-log']) return;
            const p = document.createElement("p");
            p.innerHTML = `<span style="color:${color};">${message}</span>`;
            dom['message-log'].appendChild(p);
            dom['message-log'].scrollTop = dom['message-log'].scrollHeight;
            if (dom['message-log'].children.length > 100) dom['message-log'].removeChild(dom['message-log'].firstChild);
        },

        showToast({ title, text, icon }) {
            const container = game.dom['toast-container'];
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `
                <div class="toast-icon">${icon || '⭐'}</div>
                <div class="toast-content">
                    <strong class="toast-title">${title || ''}</strong>
                    <span class="toast-text">${text || ''}</span>
                </div>
            `;
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('fade-out');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
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
                        <div class="resource-bar top-hp-bar" id="left-panel-hp-bar">
                            <div class="resource-bar-fill hp-fill" id="left-panel-hp-fill"></div>
                            <span class="resource-bar-text">健康</span>
                        </div>
                        <div class="resource-bar top-mp-bar" id="left-panel-mp-bar">
                            <div class="resource-bar-fill mp-fill" id="left-panel-mp-fill"></div>
                            <span class="resource-bar-text">精力</span>
                        </div>
                    </div>
                    <div class="primary-stats-bar" id="left-panel-stats"></div>
                `;
                const idsToCache = ['left-panel-avatar', 'left-panel-player-name', 'left-panel-gold', 'left-panel-time-container', 'left-panel-time', 'left-panel-date', 'left-panel-hp-bar', 'left-panel-mp-bar', 'left-panel-hp-fill', 'left-panel-mp-fill', 'left-panel-stats'];
                idsToCache.forEach(id => dom[id] = document.getElementById(id));
                this.isLeftPanelInitialized = true;
            }
            const { name, hp, maxHp, mp, maxMp, time, gold } = gameState;
            const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;
            const mpPercentage = maxMp > 0 ? (mp / maxMp) * 100 : 0;
            const timeString = `${gameData.settings.weekDays[new Date(time.year, time.month - 1, time.day).getDay()]} ${gameData.settings.timePhases[time.phase]}`;
            const fullDateString = `${time.year}年${time.month}月${time.day}日`;
            const primaryStatsHtml = Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).map(([key, statName]) => `<div class="primary-stat" title="${statName}">${gameData.icons[key]} ${effectiveStats[key]}</div>`).join('');

            dom['left-panel-avatar'].innerHTML = this.getAvatarHtml(gameState);
            dom['left-panel-player-name'].textContent = name;
            dom['left-panel-gold'].textContent = gold;
            dom['left-panel-time'].textContent = timeString;
            dom['left-panel-date'].textContent = fullDateString;
            dom['left-panel-hp-bar'].title = `健康: ${Math.ceil(hp)} / ${maxHp}`;
            dom['left-panel-hp-fill'].style.width = hpPercentage + '%';
            dom['left-panel-mp-bar'].title = `精力: ${Math.ceil(mp)} / ${maxMp}`;
            dom['left-panel-mp-fill'].style.width = mpPercentage + '%';
            dom['left-panel-stats'].innerHTML = primaryStatsHtml;
        },

        renderBottomNav() {
            const dom = game.dom;
            const gameState = game.State.get();
            const buttonsData = [
                { id: "MAP", label: "地图", icon: "🗺️" },
                { id: "STATUS", label: "状态", icon: "👤" },
                { id: "INVENTORY", label: "物品", icon: "🎒" },
                { id: "QUESTS", label: "任务", icon: "📜" },
                { id: "PARTY", label: "人际", icon: "👨‍👩‍👧" },
                { id: "SYSTEM", label: "系统", icon: "⚙️" }
            ];
            if (!this.isBottomNavInitialized) {
                dom['bottom-nav'].innerHTML = '';
                dom.navButtons = [];
                buttonsData.forEach(btnData => {
                    const buttonEl = document.createElement('button');
                    buttonEl.innerHTML = `<div>${btnData.icon}</div><div>${btnData.label}</div>`;
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
                    isActive = ['MAP', 'EXPLORE'].includes(gameState.gameState);
                    if (isMenu) {
                        actionFn = () => game.Actions.exitMenu();
                    } else if (!isActive) {
                        actionFn = () => game.Actions.showMap();
                    }
                } else {
                    isActive = isMenu && currentMenu === btnData.id;
                    actionFn = () => game.Actions.setUIMode('MENU', { screen: btnData.id });
                }

                buttonEl.className = `nav-button ${isActive ? 'active' : ''}`;
                buttonEl.onclick = actionFn;
                buttonEl.disabled = isGloballyDisabled || isActive;
            });
        },

        updateCombatantUI(unit) {
            const el = document.getElementById(unit.combatId);
            if (!el) return;

            if (unit.hp <= 0) {
                el.classList.add('dead');
            } else {
                el.classList.remove('dead');
            }
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

        typewriter(element, text, callback) {
            clearTimeout(this.typewriterTimeout);
            let i = 0;
            element.innerHTML = '';
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
            this.isTyping = true;
            type();
        },

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
        showItemDetails(inventoryIndex) {
            const gameState = game.State.get();
            const item = gameState.inventory[inventoryIndex];
            if (!item) return;
            const itemData = gameData.items[item.id];
            return this.ModalManager.push({ type: 'item_details', payload: { item, itemData, index: inventoryIndex }});
        },
        showEquippedItemDetails(itemId, slotId) {
            const itemData = gameData.items[itemId];
            if (!itemData) return;
            const item = { id: itemId, quantity: 1 };
            // [修改] 传入 slotId，用于弹窗内的卸下操作
            return this.ModalManager.push({ type: 'item_details', payload: { item, itemData, isEquipped: true, slotId: slotId }});
        },
        showDropQuantityPrompt(index) {
            const itemStack = game.State.get().inventory[index];
            const itemData = gameData.items[itemStack.id];
            if (!itemData) return;

            const onConfirm = (quantity) => {
                const state = game.State.get();
                const currentItemStack = state.inventory[index];
                if (!currentItemStack || currentItemStack.id !== itemStack.id) {
                    return;
                }
                const clampedQuantity = Math.max(0, Math.min(quantity, currentItemStack.quantity));
                if (clampedQuantity <= 0) return;
                currentItemStack.quantity -= clampedQuantity;
                if (currentItemStack.quantity <= 0) {
                    state.inventory.splice(index, 1);
                }
                this.log(game.Utils.formatMessage('itemDropped', { itemName: itemData.name, quantity: clampedQuantity }));
                this.render();
            };

            this.ModalManager.push({
                type: 'quantity_prompt',
                payload: {
                    title: `丢弃多少${itemData.name}？`,
                    max: itemStack.quantity,
                    onConfirm: onConfirm
                }
            });
        }
    };

    if (!window.game.UI) window.game.UI = {};
    Object.assign(window.game.UI, UI);

})();