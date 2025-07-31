/**
 * @file js/ui.js
 * @description UI核心模块 (v80.0.0 - [动画] 新增地图移动动画控制器)
 * @author Gemini (CTO)
 * @version 80.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const UI = {
        init() {
            const dom = game.dom;
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

            return ids.every(id => dom[id] !== undefined) && this.menuRenderers;
        },

        registerEventHandlers() {
            game.Events.subscribe(EVENTS.UI_RENDER, () => this.render());
            game.Events.subscribe(EVENTS.UI_RENDER_BOTTOM_NAV, () => this.renderBottomNav());
            game.Events.subscribe(EVENTS.UI_LOG_MESSAGE, (data) => this.log(data.message, data.color));
            game.Events.subscribe(EVENTS.UI_SHOW_TOAST, (data) => this.showToast(data));

            game.Events.subscribe(EVENTS.STATE_CHANGED, () => {
                this.renderLeftPanel();
                const gameState = game.State.get();
                if (gameState.gameState === 'MENU') {
                    const renderer = this.menuRenderers[gameState.menu.current];
                    if (renderer) {
                        renderer(document.getElementById('menu-content'));
                    }
                }
            });

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
                const gameState = game.State.get();
                
                // [动画] 动画播放期间锁定所有交互
                if (this.isAnimating) return;

                if (game.narrativeContext && !game.narrativeContext.isWaitingForChoice) {
                    const narrativeUi = event.target.closest('#narrative-ui');
                    const isOptionButton = event.target.closest('#narrative-options button');
                    if (narrativeUi && !isOptionButton) {
                        this.NarrativeManager.showNextSegment();
                        return;
                    }
                }

                const actionTarget = event.target.closest('[data-action]');
                if (actionTarget && game.Actions[actionTarget.dataset.action]) {
                    const action = actionTarget.dataset.action;
                    const param = actionTarget.dataset.direction || actionTarget.dataset.slotId || actionTarget.dataset.slot || actionTarget.dataset.index || actionTarget.dataset.id || actionTarget.dataset.filter;
                    event.stopPropagation();
                    game.Actions[action](param);
                    return;
                }

                if (gameState.isCombat) {
                    const targetCard = event.target.closest('.combatant-card.enemy');
                    if (targetCard) game.Actions.setFocusTarget(targetCard.id);

                } else if (gameState.gameState === 'MENU') {
                    if (gameState.menu.current === 'PARTY') {
                         const targetMember = event.target.closest('.relationship-entry');
                         if (targetMember) game.Actions.viewRelationshipDetail(targetMember.dataset.id);
                    } else if (gameState.menu.current === 'INVENTORY') {
                        const filterTab = event.target.closest('.inventory-filter-tab');
                        if (filterTab && filterTab.dataset.filter) {
                            game.state.menu.inventoryFilter = filterTab.dataset.filter;
                            this.render();
                        }
                        const inventoryItemEntry = event.target.closest('.inventory-item-entry');
                        if (inventoryItemEntry && inventoryItemEntry.dataset.index) {
                            if (!event.target.closest('button')) {
                                this.showItemDetails(inventoryItemEntry.dataset.index);
                            }
                        }
                    }
                } else if (gameState.gameState === 'MAP') {
                    const mapNode = event.target.closest('.map-node');
                    if (mapNode) {
                        game.Actions.handleMapNodeClick(mapNode);
                    }
                } else if (gameState.gameState === 'EXPLORE') {
                    const hotspotCard = event.target.closest('.hotspot-card, .sparkle-hotspot');
                    if (hotspotCard && hotspotCard.dataset.interaction) {
                        const index = parseInt(hotspotCard.dataset.index, 10);
                        const type = hotspotCard.dataset.type;
                        game.Actions.handleInteraction(JSON.parse(hotspotCard.dataset.interaction), index, type);
                    }
                }
            });
        },

        render() {
            const dom = game.dom;
            const gameState = game.State.get();
            try {
                const isTitle = gameState.gameState === 'TITLE';
                dom['left-panel'].classList.toggle('hidden', isTitle);
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

        log(message, color = "var(--text-on-primary-color)") {
            const container = game.dom['scrolling-log-container'];
            if (!container) return;
            const MAX_LOGS = 10;
            if (container.children.length >= MAX_LOGS) {
                container.removeChild(container.firstChild);
            }
            const p = document.createElement("p");
            p.className = 'log-message';
            p.style.color = color;
            p.innerHTML = message;
            container.appendChild(p);
            setTimeout(() => {
                p.classList.add('fade-out');
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
            const isCombat = gameState.isCombat && gameState.combatState && gameState.combatState.playerParty[0];
            const unit = isCombat ? gameState.combatState.playerParty[0] : gameState;
            const effectiveStats = isCombat ? unit.effectiveStats : gameState.effectiveStats;

            if (!this.isLeftPanelInitialized) {
                dom['left-panel'].innerHTML = `
                    <div class="player-avatar" id="left-panel-avatar"></div>
                    <div class="panel-info-group">
                        <div class="player-name" id="left-panel-player-name"></div>
                        <div class="player-gold" id="left-panel-gold"></div>
                    </div>
                    <div class="panel-info-group">
                         <div class="game-date" id="left-panel-date"></div>
                         <div class="game-time" id="left-panel-time"></div>
                    </div>
                    <div class="resource-bars-container">
                        <div class="resource-bar hp-bar" id="left-panel-hp-bar">
                            <div class="resource-bar-fill" id="left-panel-hp-fill"></div>
                            <div class="resource-bar-text" id="left-panel-hp-text"></div>
                        </div>
                        <div class="resource-bar mp-bar" id="left-panel-mp-bar">
                            <div class="resource-bar-fill" id="left-panel-mp-fill"></div>
                            <div class="resource-bar-text" id="left-panel-mp-text"></div>
                        </div>
                    </div>
                    <div class="primary-stats-container" id="left-panel-stats"></div>
                    <div class="effects-container" id="left-panel-effects"></div> `;
                const idsToCache = [
                    'left-panel-avatar', 'left-panel-player-name', 'left-panel-gold',
                    'left-panel-date', 'left-panel-time',
                    'left-panel-hp-bar', 'left-panel-hp-fill', 'left-panel-hp-text',
                    'left-panel-mp-bar', 'left-panel-mp-fill', 'left-panel-mp-text',
                    'left-panel-stats', 'left-panel-effects'
                ];
                idsToCache.forEach(id => dom[id] = document.getElementById(id));
                this.isLeftPanelInitialized = true;
            }

            const { name, gold, time } = gameState;
            const { hp, maxHp, mp, maxMp, activeEffects } = unit;
            dom['left-panel-avatar'].innerHTML = this.getAvatarHtml(gameState);
            dom['left-panel-player-name'].textContent = name;
            dom['left-panel-gold'].innerHTML = `${gameData.icons.gold} ${gold}`;
            dom['left-panel-date'].textContent = `${time.year}年${time.month}月${time.day}日`;
            dom['left-panel-time'].textContent = `${gameData.settings.weekDays[new Date(time.year, time.month - 1, time.day).getDay()]} ${gameData.settings.timePhases[time.phase]}`;
            dom['left-panel-hp-bar'].title = `健康: ${Math.ceil(hp)} / ${maxHp}`;
            dom['left-panel-hp-fill'].style.width = (maxHp > 0 ? (hp / maxHp) * 100 : 0) + '%';
            dom['left-panel-hp-text'].innerHTML = `<span>${gameData.icons.health}</span> ${Math.ceil(hp)} / ${maxHp}`;
            dom['left-panel-mp-bar'].title = `精力: ${Math.ceil(mp)} / ${maxMp}`;
            dom['left-panel-mp-fill'].style.width = (maxMp > 0 ? (mp / maxMp) * 100 : 0) + '%';
            dom['left-panel-mp-text'].innerHTML = `<span>${gameData.icons.energy}</span> ${Math.ceil(mp)} / ${maxMp}`;
            const statsContainer = dom['left-panel-stats'];
            statsContainer.innerHTML = '';
            for (const key in gameData.statNames) {
                const statName = gameData.statNames[key];
                const statEl = document.createElement('div');
                statEl.className = 'primary-stat';
                statEl.innerHTML = `<span class="stat-icon">${gameData.icons[key]}</span><span class="stat-name">${statName}</span><span class="stat-value">${effectiveStats[key]}</span>`;
                statsContainer.appendChild(statEl);
            }
            const effectsContainer = dom['left-panel-effects'];
            effectsContainer.innerHTML = '';
            const visibleEffects = (activeEffects || []).filter(effect => !effect.isHidden);
            if (visibleEffects.length > 0) {
                 const effectsGrid = document.createElement('div');
                 effectsGrid.className = 'effects-grid';
                 visibleEffects.forEach(effect => {
                    const durationText = effect.duration === -1 ? '∞' : effect.duration;
                    const effectEl = document.createElement('div');
                    effectEl.className = `effect-entry ${effect.type || 'buff'}`;
                    const tooltip = `${effect.name}\n${effect.description}\n(${effect.duration === -1 ? '永久' : `剩余 ${effect.duration} 时段`})`;
                    effectEl.title = tooltip;
                    const showDuration = effect.duration > 0 || effect.duration === -1;
                    const durationDisplay = showDuration ? `<span class="effect-duration">${durationText}</span>` : '';
                    effectEl.innerHTML = `<div class="effect-icon-container"><span class="effect-icon">${effect.icon}</span>${durationDisplay}</div><span class="effect-name">${effect.name}</span>`;
                    effectsGrid.appendChild(effectEl);
                 });
                 effectsContainer.appendChild(effectsGrid);
                 game.UI.makeListDraggable(effectsGrid);
            }
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
            const isExploring = gameState.gameState === 'EXPLORE';
            const isMapping = gameState.gameState === 'MAP';
            const isGloballyDisabled = this.isAnimating || gameState.isCombat || gameState.gameState === 'SEQUENCE' || !!game.narrativeContext || this.ModalManager.stack.length > 0;

            dom.navButtons.forEach((buttonEl, index) => {
                const btnData = buttonsData[index];
                let isActive = false;
                let actionFn = null;

                if (btnData.id === 'MAP') {
                    isActive = isExploring || isMapping;
                    if (isMenu) {
                        actionFn = () => game.Actions.exitMenu();
                    } else if (isExploring) {
                        actionFn = () => game.Actions.showMap();
                    } else if (isMapping) {
                        actionFn = () => game.Actions.returnToScene();
                    }
                } else {
                    isActive = isMenu && currentMenu === btnData.id;
                    actionFn = () => game.Actions.setUIMode('MENU', { screen: btnData.id });
                }

                buttonEl.className = `nav-button ${isActive ? 'active' : ''}`;
                buttonEl.onclick = actionFn;

                let isDisabled = isGloballyDisabled || !actionFn;
                if (isActive) {
                    if (isMenu && currentMenu === btnData.id) {
                        isDisabled = true;
                    }
                    if (!isMenu && (isExploring || isMapping) && btnData.id === 'MAP') {
                        isDisabled = true;
                    }
                }
                buttonEl.disabled = isDisabled;
            });
        },

        // [核心新增] 地图移动动画控制器
        async movePlayerOnMap(startNodeId, endNodeId, onComplete) {
            const gameState = game.State.get();
            const mapData = gameData.maps[gameState.currentMapId];
            const mover = document.getElementById('player-map-mover');
            if (!mover || !mapData) {
                if (onComplete) onComplete();
                return;
            }

            const path = game.Utils.findShortestPath(gameState.currentMapId, startNodeId, endNodeId);
            if (!path || path.length < 2) {
                if (onComplete) onComplete();
                return;
            }

            this.isAnimating = true;
            this.renderBottomNav(); // 禁用底部按钮

            mover.classList.remove('hidden');

            for (let i = 0; i < path.length - 1; i++) {
                const fromNodeId = path[i];
                const toNodeId = path[i + 1];
                const fromNode = mapData.nodes[fromNodeId];
                const toNode = mapData.nodes[toNodeId];

                // 设置起点
                mover.style.transition = 'none';
                mover.style.left = `${fromNode.x}%`;
                mover.style.top = `${fromNode.y}%`;

                // 强制浏览器重绘以应用起点
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

                // 计算动画时长 (可基于距离)
                const distance = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
                const duration = Math.max(0.2, distance / 20) + 's';

                // 开始动画
                mover.style.transition = `left ${duration} linear, top ${duration} linear`;
                mover.style.left = `${toNode.x}%`;
                mover.style.top = `${toNode.y}%`;

                // 等待动画结束
                await new Promise(resolve => setTimeout(resolve, parseFloat(duration) * 1000));
            }

            mover.classList.add('hidden');
            this.isAnimating = false;
            this.renderBottomNav(); // 恢复按钮

            if (onComplete) onComplete();
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
        showItemDetails(inventoryIndex, payloadOverrides = {}) {
            const item = game.State.get().inventory[inventoryIndex];
            if (!item) return;
            const basePayload = { item: item, itemData: gameData.items[item.id], index: inventoryIndex };
            const finalPayload = { ...basePayload, ...payloadOverrides };
            return this.ModalManager.push({ type: 'item_details', payload: finalPayload });
        },
        showEquipmentSelection(slotId) {
            return this.ModalManager.push({ type: 'equipment_selection', payload: { slotId } });
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