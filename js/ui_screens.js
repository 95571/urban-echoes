/**
 * @file js/ui_screens.js
 * @description UI模块 - 主屏幕渲染器 (v50.0.0 - [重构] 移除flag系统，传递交互点类型)
 * @author Gemini (CTO)
 * @version 50.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const screenRenderers = {
        TITLE() {
            const dom = game.dom;
            dom.screen.className = 'title-screen';
            dom.screen.innerHTML = `
                <div class="title-content">
                    <h1 class="game-title">都市回响</h1>
                    <p class="game-subtitle">Urban Echoes</p>
                    <div class="title-buttons">
                        <button data-action="newGame">新的人生</button>
                        <button data-action="showLoadScreen">杭城旧梦</button>
                        <button data-action="showAchievements">成就殿堂</button>
                        <button data-action="showAbout">关于游戏</button>
                    </div>
                </div>`;
        },

        SEQUENCE() {
            const dom = game.dom;
            const gameState = game.State.get();
            const sequenceState = gameState.activeSequence;
            if (!sequenceState) {
                console.error("SEQUENCE renderer called with no active sequence.");
                return;
            }
            const sequenceData = gameData.questionSequences[sequenceState.sequenceId];
            const questionData = sequenceData.questions[sequenceState.currentQuestionId];
            if (!questionData) {
                console.error(`Question "${sequenceState.currentQuestionId}" not found in sequence "${sequenceState.sequenceId}".`);
                return;
            }
            dom.screen.className = 'sequence-screen';
            dom.screen.style.backgroundImage = '';
            let answersHtml = '';
            if (questionData.type === 'multiple_choice') {
                answersHtml = questionData.answers.map((answer, index) => `<button onclick="game.Actions.handleSequenceAnswer(${index})">${answer.text}</button>`).join('');
            } else if (questionData.type === 'text_input') {
                answersHtml = `<input type="text" id="sequence-text-input" placeholder="请输入你的名字..." /><button onclick="game.Actions.handleSequenceTextInput(document.getElementById('sequence-text-input').value)">${questionData.answers[0].text}</button>`;
            }
            dom.screen.innerHTML = `
                <div class="sequence-image-container">${questionData.imageUrl ? `<img src="${questionData.imageUrl}" alt="情景图片">` : ''}</div>
                <div class="sequence-qa-container">
                    <div class="sequence-question">${questionData.text}</div>
                    <div class="sequence-answers">${answersHtml}</div>
                </div>`;
        },

        EXPLORE() {
            const dom = game.dom;
            const gameState = game.State.get();
            dom.screen.className = 'explore-screen';
            const location = gameData.locations[gameState.currentLocationId];
            if (!location) {
                game.UI.log(game.Utils.formatMessage('errorNotFound', { target: gameState.currentLocationId }), "var(--error-color)");
                return;
            }
            
            const safeInteractionJson = (spot) => {
                return JSON.stringify(spot).replace(/'/g, "&apos;");
            };

            const availableHotspots = (location.hotspots || [])
                .map((spot, index) => ({ spot, index }))
                .filter(({ spot, index }) => {
                    const varKey = `hotspot_destroyed_${gameState.currentLocationId}_${index}`;
                    const isDestroyed = (gameState.variables[varKey] || 0) === 1;
                    return !isDestroyed && game.ConditionChecker.evaluate(spot.conditions);
                });

            const ITEMS_PER_PAGE = 4;
            const pageIndex = gameState.hotspotPageIndex || 0;
            const startIndex = pageIndex * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const visibleHotspots = availableHotspots.slice(startIndex, endIndex);

            const hotspotsHtml = visibleHotspots.map(({ spot, index }) => {
                const interaction = spot.interaction || {};
                const payload = interaction.payload || {};
                const iconContent = payload.imageUrl ? `<img src="${payload.imageUrl}" alt="${spot.label}">` : (spot.icon || '📍');
                return `
                    <div class="hotspot-card" data-interaction='${safeInteractionJson(spot)}' data-index="${index}" data-type="hotspot">
                        <div class="hotspot-icon">${iconContent}</div>
                        <div class="hotspot-label">${spot.label}</div>
                    </div>`;
            }).join('');

            const leftArrowHtml = pageIndex > 0 ? `<button class="hotspot-arrow left" data-action="paginateHotspots" data-direction="-1">◄</button>` : `<div style="width: 40px; flex-shrink: 0;"></div>`;
            const rightArrowHtml = endIndex < availableHotspots.length ? `<button class="hotspot-arrow right" data-action="paginateHotspots" data-direction="1">►</button>` : `<div style="width: 40px; flex-shrink: 0;"></div>`;

            const sparklesHtml = (location.discoveries || [])
                .map((spot, index) => {
                    const isActivated = game.ConditionChecker.evaluate(spot.activationConditions);
                    const varKey = `discovery_destroyed_${gameState.currentLocationId}_${index}`;
                    const isDestroyed = (gameState.variables[varKey] || 0) === 1;
                    const isDeactivated = spot.deactivationConditions && game.ConditionChecker.evaluate(spot.deactivationConditions);
                    
                    if (!isActivated || isDeactivated || isDestroyed) {
                        return '';
                    }

                    const anim = spot.animation || {};
                    const fadeInDuration = anim.fadeInDuration || '1s';
                    const period = anim.period || '2.5s';
                    const scaleMin = anim.scaleMin || 0.8;
                    const scaleMax = anim.scaleMax || 1.2;
                    const color = anim.color;
                    
                    let style = `--anim-fade-in-duration: ${fadeInDuration}; --anim-period: ${period}; --anim-scale-min: ${scaleMin}; --anim-scale-max: ${scaleMax}; left: ${spot.x}%; top: ${spot.y}%;`;
                    if (color) {
                        style += ` --sparkle-color-instance: ${color};`;
                    }

                    return `
                        <div class="sparkle-hotspot" style="${style}" data-interaction='${safeInteractionJson(spot)}' data-index="${index}" data-type="discovery" data-fade-in-duration="${fadeInDuration}">
                            <div class="sparkle-core"></div>
                        </div>`;
                }).join('');


            dom.screen.innerHTML = `
                <div class="location-header"><h2>${location.name}</h2><p>${location.description}</p></div>
                <div class="map-area" style="background-image: ${location.imageUrl ? `url('${location.imageUrl}')` : 'none'}">
                    ${sparklesHtml}
                    <div class="hotspot-container">
                        ${leftArrowHtml}
                        <div class="hotspot-cards-wrapper">
                            ${hotspotsHtml}
                        </div>
                        ${rightArrowHtml}
                    </div>
                </div>`;
            
            dom.screen.querySelectorAll('.sparkle-hotspot').forEach(sparkle => {
                const core = sparkle.querySelector('.sparkle-core');
                const fadeInMs = parseFloat(sparkle.dataset.fadeInDuration) * 1000;
                
                core.classList.add('activating');
                
                setTimeout(() => {
                    core.classList.remove('activating');
                    core.classList.add('breathing');
                }, fadeInMs);
            });
        },


        MAP() {
            const dom = game.dom;
            const gameState = game.State.get();
            dom.screen.style.backgroundImage = '';
            const mapData = gameData.maps[gameState.currentMapId];
            if (!mapData) {
                game.UI.log(game.Utils.formatMessage('errorNotFound', { target: gameState.currentMapId }), 'var(--error-color)');
                return;
            }
            dom.screen.className = 'map-screen';
            dom.screen.innerHTML = `<div class="location-header"><h2>${mapData.name}</h2></div>`;
            const { nodes, connections } = mapData;
            const fragment = document.createDocumentFragment();
            const mapContainer = document.createElement('div');
            mapContainer.style.position = 'relative';
            mapContainer.style.width = '100%';
            mapContainer.style.height = '100%';
            connections.forEach(conn => {
                const node1 = nodes[conn[0]];
                const node2 = nodes[conn[1]];
                if (!node1 || !node2) return;
                const line = document.createElement('div');
                line.className = 'map-line';
                const x1 = node1.x, y1 = node1.y, x2 = node2.x, y2 = node2.y;
                const deltaX = (x2 - x1) * (dom.screen.clientWidth / 100);
                const deltaY = (y2 - y1) * ((dom.screen.clientHeight - 48) / 100);
                const distance = Math.hypot(deltaX, deltaY);
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                line.style.left = `${x1}%`;
                line.style.top = `${y1}%`;
                line.style.width = `${distance}px`;
                line.style.transform = `rotate(${angle}deg)`;
                mapContainer.appendChild(line);
            });
            for (const nodeId in nodes) {
                const nodeData = nodes[nodeId];
                const nodeEl = document.createElement('div');
                nodeEl.className = 'map-node';
                nodeEl.dataset.id = nodeId;
                nodeEl.style.left = `${nodeData.x}%`;
                nodeEl.style.top = `${nodeData.y}%`;
                if (nodeId === gameState.currentMapNodeId) nodeEl.classList.add('current');
                const isInteractable = game.ConditionChecker.evaluate(nodeData.conditions);
                if (!isInteractable) nodeEl.classList.add('inactive');
                nodeEl.innerHTML = `<span>${nodeData.icon}</span><div class="node-label">${nodeData.name}</div>`;
                mapContainer.appendChild(nodeEl);
            }
            fragment.appendChild(mapContainer);
            dom.screen.appendChild(fragment);
        },

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

            const menuRenderer = game.UI.menuRenderers[screen];
            if (menuRenderer) menuRenderer.call(game.UI.menuRenderers, contentEl);
            else contentEl.innerHTML = `<p>【${title}】功能正在开发中...</p>`;
        },

        COMBAT() {
            const dom = game.dom;
            const gameState = game.State.get();
            dom.screen.style.backgroundImage = '';
            if (!gameState.combatState) return;
            if (!game.UI.isCombatScreenInitialized) {
                dom.screen.className = 'combat-screen';
                dom.screen.innerHTML = '';
                const enemyContainer = document.createElement('div');
                enemyContainer.className = 'combat-container enemy-container';
                const enemyPositionMap = ["e-front-c", "e-front-l", "e-front-r", "e-back-c", "e-back-l", "e-back-r"];
                dom.enemyCards = {};
                gameState.combatState.enemies.forEach((unit, index) => {
                    const card = document.createElement('div');
                    card.id = unit.combatId;
                    card.style.gridArea = enemyPositionMap[index];
                    card.innerHTML = `<img src="images/${unit.id}.png" alt="${unit.name}" class="enemy-sprite" onerror="this.onerror=null; this.src='${game.DEFAULT_AVATAR_FALLBACK_IMAGE}';"><div class="name">${unit.name}</div>`;
                    enemyContainer.appendChild(card);
                    dom.enemyCards[unit.combatId] = card;
                });
                const divider = document.createElement('div');
                divider.className = 'combat-divider';
                divider.innerHTML = '⚔️';
                const actionsPanel = document.createElement('div');
                actionsPanel.id = 'combat-actions-panel';
                dom.combatActionButtons = {};
                const actions = [{ id: 'Attack', label: '攻击' }, { id: 'Skill', label: '技能' }, { id: 'Defend', label: '防御' }, { id: 'Item', label: '道具' }, { id: 'Flee', label: '逃跑' }];
                actions.forEach(action => {
                    const button = document.createElement('button');
                    button.dataset.action = `playerCombat${action.id}`;
                    button.textContent = action.label;
                    actionsPanel.appendChild(button);
                    dom.combatActionButtons[action.id] = button;
                });
                dom.screen.append(enemyContainer, divider, actionsPanel);
                game.UI.isCombatScreenInitialized = true;
            }
            const { enemies, activeUnit, focusedTargetId, isWaitingForPlayerInput } = gameState.combatState;
            enemies.forEach(unit => {
                const card = dom.enemyCards[unit.combatId];
                if (!card) return;
                let classes = 'combatant-card enemy';
                if (unit.combatId === focusedTargetId) classes += ' focused';
                if (activeUnit && unit.combatId === activeUnit.combatId) classes += ' active-turn';
                if (unit.hp <= 0) classes += ' dead';
                card.className = classes;
            });
            const buttonsDisabled = !isWaitingForPlayerInput;
            const availability = game.Combat.getCombatActionAvailability();
            dom.combatActionButtons.Attack.disabled = buttonsDisabled || !availability.attack;
            dom.combatActionButtons.Skill.disabled = buttonsDisabled || !availability.skill;
            dom.combatActionButtons.Defend.disabled = buttonsDisabled || !availability.defend;
            dom.combatActionButtons.Item.disabled = buttonsDisabled || !availability.item;
            dom.combatActionButtons.Flee.disabled = buttonsDisabled || !availability.flee;
        }
    };

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.screenRenderers = screenRenderers;

})();