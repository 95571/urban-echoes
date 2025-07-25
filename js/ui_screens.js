/**
 * @file js/ui_screens.js
 * @description UI模块 - 主屏幕渲染器 (v55.0.0 - [重构] 主屏幕渲染完全迁移至createElement)
 * @author Gemini (CTO)
 * @version 55.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const screenRenderers = {
        TITLE() {
            const dom = game.dom;
            dom.screen.className = 'title-screen';
            dom.screen.innerHTML = ''; // 清空

            const titleContent = createElement('div', { className: 'title-content' }, [
                createElement('h1', { className: 'game-title', textContent: '都市回响' }),
                createElement('p', { className: 'game-subtitle', textContent: 'Urban Echoes' }),
                createElement('div', { className: 'title-buttons' }, [
                    createElement('button', { textContent: '新的人生', dataset: { action: 'newGame' } }),
                    createElement('button', { textContent: '杭城旧梦', dataset: { action: 'showLoadScreen' } }),
                    createElement('button', { textContent: '成就殿堂', dataset: { action: 'showAchievements' } }),
                    createElement('button', { textContent: '关于游戏', dataset: { action: 'showAbout' } })
                ])
            ]);

            dom.screen.appendChild(titleContent);
        },

        SEQUENCE() {
            const dom = game.dom;
            dom.screen.innerHTML = ''; // 清空
            dom.screen.className = 'sequence-screen';
            dom.screen.style.backgroundImage = '';

            const gameState = game.State.get();
            const sequenceState = gameState.activeSequence;
            if (!sequenceState) return;

            const sequenceData = gameData.questionSequences[sequenceState.sequenceId];
            const questionData = sequenceData.questions[sequenceState.currentQuestionId];
            if (!questionData) return;
            
            let answersContainer;
            if (questionData.type === 'multiple_choice') {
                answersContainer = createElement('div', { className: 'sequence-answers' }, 
                    questionData.answers.map((answer, index) => 
                        createElement('button', { 
                            textContent: answer.text, 
                            eventListeners: { click: () => game.Actions.handleSequenceAnswer(index) }
                        })
                    )
                );
            } else if (questionData.type === 'text_input') {
                const textInput = createElement('input', { id: 'sequence-text-input', attributes: { type: 'text', placeholder: '请输入你的名字...' } });
                answersContainer = createElement('div', { className: 'sequence-answers' }, [
                    textInput,
                    createElement('button', { 
                        textContent: questionData.answers[0].text,
                        eventListeners: { click: () => game.Actions.handleSequenceTextInput(textInput.value) }
                    })
                ]);
            }
            
            const imageContainer = createElement('div', { className: 'sequence-image-container' }, 
                questionData.imageUrl ? [createElement('img', { attributes: { src: questionData.imageUrl, alt: '情景图片' } })] : []
            );
            
            const qaContainer = createElement('div', { className: 'sequence-qa-container' }, [
                createElement('div', { className: 'sequence-question', textContent: questionData.text }),
                answersContainer
            ]);

            dom.screen.appendChild(imageContainer);
            dom.screen.appendChild(qaContainer);
        },

        EXPLORE() {
            const dom = game.dom;
            const gameState = game.State.get();
            dom.screen.innerHTML = ''; // 清空
            dom.screen.className = 'explore-screen';
            
            const location = gameData.locations[gameState.currentLocationId];
            if (!location) {
                game.UI.log(game.Utils.formatMessage('errorNotFound', { target: gameState.currentLocationId }), "var(--error-color)");
                return;
            }

            const header = createElement('div', { className: 'location-header' }, [
                createElement('h2', { textContent: location.name }),
                createElement('p', { textContent: location.description })
            ]);

            // 创建可交互闪光点
            const sparkles = (location.discoveries || []).map((spot, index) => {
                const isActivated = game.ConditionChecker.evaluate(spot.activationConditions);
                const isDestroyed = (gameState.variables[`discovery_destroyed_${gameState.currentLocationId}_${index}`] || 0) === 1;
                const isDeactivated = spot.deactivationConditions && game.ConditionChecker.evaluate(spot.deactivationConditions);
                if (!isActivated || isDeactivated || isDestroyed) return null;

                const anim = spot.animation || {};
                const style = { 
                    left: `${spot.x}%`, top: `${spot.y}%`, 
                    '--anim-fade-in-duration': anim.fadeInDuration || '1s',
                    '--anim-period': anim.period || '2.5s',
                    '--anim-scale-min': anim.scaleMin || 0.8,
                    '--anim-scale-max': anim.scaleMax || 1.2
                };
                if (anim.color) style['--sparkle-color-instance'] = anim.color;

                return createElement('div', {
                    className: 'sparkle-hotspot',
                    style: style,
                    dataset: { 
                        interaction: JSON.stringify(spot).replace(/'/g, "&apos;"),
                        index: index, 
                        type: 'discovery',
                        fadeInDuration: anim.fadeInDuration || '1s'
                    }
                }, [createElement('div', { className: 'sparkle-core' })]);
            }).filter(Boolean);

            // 创建场景交互卡片
            const availableHotspots = (location.hotspots || [])
                .map((spot, index) => ({ spot, index }))
                .filter(({ spot, index }) => {
                    const isDestroyed = (gameState.variables[`hotspot_destroyed_${gameState.currentLocationId}_${index}`] || 0) === 1;
                    return !isDestroyed && game.ConditionChecker.evaluate(spot.conditions);
                });

            const ITEMS_PER_PAGE = 4;
            const pageIndex = gameState.hotspotPageIndex || 0;
            const startIndex = pageIndex * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const visibleHotspots = availableHotspots.slice(startIndex, endIndex);

            const hotspotCards = visibleHotspots.map(({ spot, index }) => {
                const iconContent = spot.interaction?.payload?.imageUrl 
                    ? createElement('img', { attributes: { src: spot.interaction.payload.imageUrl, alt: spot.label } })
                    : (spot.icon || '📍');
                
                return createElement('div', {
                    className: 'hotspot-card',
                    dataset: { 
                        interaction: JSON.stringify(spot).replace(/'/g, "&apos;"), 
                        index: index, 
                        type: 'hotspot' 
                    }
                }, [
                    createElement('div', { className: 'hotspot-icon' }, [iconContent]),
                    createElement('div', { className: 'hotspot-label', textContent: spot.label })
                ]);
            });

            // 组装主场景区域
            const mapArea = createElement('div', {
                className: 'map-area',
                style: { backgroundImage: location.imageUrl ? `url('${location.imageUrl}')` : 'none' }
            }, [
                ...sparkles,
                createElement('div', { className: 'hotspot-container' }, [
                    pageIndex > 0 
                        ? createElement('button', { className: 'hotspot-arrow left', dataset: { action: 'paginateHotspots', direction: '-1' }, innerHTML: '◄' })
                        : createElement('div', { style: { width: '40px', flexShrink: 0 } }),
                    createElement('div', { className: 'hotspot-cards-wrapper' }, hotspotCards),
                    endIndex < availableHotspots.length 
                        ? createElement('button', { className: 'hotspot-arrow right', dataset: { action: 'paginateHotspots', direction: '1' }, innerHTML: '►' })
                        : createElement('div', { style: { width: '40px', flexShrink: 0 } })
                ])
            ]);

            dom.screen.appendChild(header);
            dom.screen.appendChild(mapArea);
            
            // 启动闪光点动画
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
            dom.screen.innerHTML = ''; // 清空
            dom.screen.className = 'map-screen';
            dom.screen.style.backgroundImage = '';
            
            const gameState = game.State.get();
            const mapData = gameData.maps[gameState.currentMapId];
            if (!mapData) return;

            dom.screen.appendChild(createElement('div', { className: 'location-header' }, [
                createElement('h2', { textContent: mapData.name })
            ]));

            const mapContainer = createElement('div', { style: { position: 'relative', width: '100%', height: '100%' } });

            // 绘制连接线
            mapData.connections.forEach(conn => {
                const node1 = mapData.nodes[conn[0]];
                const node2 = mapData.nodes[conn[1]];
                if (!node1 || !node2) return;
                const x1 = node1.x, y1 = node1.y, x2 = node2.x, y2 = node2.y;
                const deltaX = (x2 - x1) * (dom.screen.clientWidth / 100);
                const deltaY = (y2 - y1) * ((dom.screen.clientHeight - 48) / 100); // 减去header高度
                const distance = Math.hypot(deltaX, deltaY);
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                
                mapContainer.appendChild(createElement('div', {
                    className: 'map-line',
                    style: { left: `${x1}%`, top: `${y1}%`, width: `${distance}px`, transform: `rotate(${angle}deg)` }
                }));
            });

            // 绘制节点
            for (const nodeId in mapData.nodes) {
                const nodeData = mapData.nodes[nodeId];
                let nodeClasses = 'map-node';
                if (nodeId === gameState.currentMapNodeId) nodeClasses += ' current';
                if (!game.ConditionChecker.evaluate(nodeData.conditions)) nodeClasses += ' inactive';

                mapContainer.appendChild(createElement('div', {
                    className: nodeClasses,
                    dataset: { id: nodeId },
                    style: { left: `${nodeData.x}%`, top: `${nodeData.y}%` }
                }, [
                    createElement('span', { textContent: nodeData.icon }),
                    createElement('div', { className: 'node-label', textContent: nodeData.name })
                ]));
            }

            dom.screen.appendChild(mapContainer);
        },

        MENU() {
            const dom = game.dom;
            const gameState = game.State.get();
            const screen = gameState.menu.current;
            const title = gameData.screenTitles[screen] || screen;

            dom.screen.innerHTML = ''; // 清空
            dom.screen.className = 'menu-screen';
            dom.screen.style.padding = '15px';

            const contentEl = createElement('div', { id: 'menu-content' });
            dom.screen.appendChild(createElement('h2', { textContent: title }));
            dom.screen.appendChild(contentEl);
            
            if (screen === 'QUESTS') {
                dom.screen.style.padding = '15px 15px 10px 15px';
                contentEl.style.height = `calc(100% - ${contentEl.previousElementSibling.offsetHeight}px)`;
            }

            const menuRenderer = game.UI.menuRenderers[screen];
            if (menuRenderer) {
                menuRenderer.call(game.UI.menuRenderers, contentEl);
            } else {
                contentEl.appendChild(createElement('p', { textContent: `【${title}】功能正在开发中...` }));
            }
        },

        COMBAT() {
            const dom = game.dom;
            const gameState = game.State.get();
            if (!gameState.combatState) return;

            // 初始化战斗UI
            if (!game.UI.isCombatScreenInitialized) {
                dom.screen.innerHTML = ''; // 清空
                dom.screen.className = 'combat-screen';
                
                const enemyContainer = createElement('div', { className: 'combat-container enemy-container' });
                const enemyPositionMap = ["e-front-c", "e-front-l", "e-front-r", "e-back-c", "e-back-l", "e-back-r"];
                dom.enemyCards = {};

                gameState.combatState.enemies.forEach((unit, index) => {
                    const card = createElement('div', {
                        id: unit.combatId,
                        style: { gridArea: enemyPositionMap[index] }
                    }, [
                        createElement('img', { className: 'enemy-sprite', attributes: { src: `images/${unit.id}.png`, alt: unit.name, onerror: `this.onerror=null; this.src='${game.DEFAULT_AVATAR_FALLBACK_IMAGE}';` } }),
                        createElement('div', { className: 'name', textContent: unit.name })
                    ]);
                    enemyContainer.appendChild(card);
                    dom.enemyCards[unit.combatId] = card;
                });
                
                const actionsPanel = createElement('div', { id: 'combat-actions-panel' });
                dom.combatActionButtons = {};
                const actions = [{ id: 'Attack', label: '攻击' }, { id: 'Skill', label: '技能' }, { id: 'Defend', label: '防御' }, { id: 'Item', label: '道具' }, { id: 'Flee', label: '逃跑' }];
                actions.forEach(action => {
                    const button = createElement('button', { textContent: action.label, dataset: { action: `playerCombat${action.id}` } });
                    actionsPanel.appendChild(button);
                    dom.combatActionButtons[action.id] = button;
                });

                dom.screen.append(enemyContainer, createElement('div', { className: 'combat-divider', innerHTML: '⚔️' }), actionsPanel);
                game.UI.isCombatScreenInitialized = true;
            }

            // 更新战斗UI状态
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