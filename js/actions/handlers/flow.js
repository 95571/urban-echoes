/**
 * @file js/actions/handlers/flow.js
 * @description 动作处理器 - 流程控制相关 (v84.3.0 - [优化] 统一入口确认对话框)
 * @author Gemini (CTO)
 * @version 84.3.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions.actionHandlers) game.Actions.actionHandlers = {};

    const namedActions = {
        fullHeal() {
            const state = game.State.get();
            const maxHp = state.maxHp;
            const maxMp = state.maxMp;
            game.State.applyEffect(state, { hp: maxHp, mp: maxMp });
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('fullHeal'), color: 'var(--log-color-success)' });
        }
    };

    Object.assign(game.Actions.actionHandlers, {
        start_dialogue(payload) {
            return game.UI.showNarrative(payload.dialogueId);
        },

        async confirm_travel(payload) {
            const { destinationName, enterAction } = payload;
            const choice = await game.UI.showConfirmation({
                title: '旅行提示',
                html: `<p>你确定要前往【${destinationName}】吗？</p>`,
                options: [ { text: '前往', value: true }, { text: '取消', value: false, class: 'secondary-action' } ]
            });
            if (choice && choice.originalOption.value) {
                await game.Actions.executeActionBlock([{ action: enterAction }]);
            } else {
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
            }
        },
        
        async enter_location(payload) {
            const gameState = game.State.get();
            
            const doEnterLocation = (isAnimated = false) => {
                gameState.currentLocationId = payload.locationId;
                if (payload.nodeId) gameState.currentMapNodeId = payload.nodeId;
                gameState.hotspotPageIndex = 0;
                game.State.setUIMode('EXPLORE');
                if (!isAnimated) { 
                    const locationName = gameData.locations[payload.locationId]?.name || '未知地点';
                    this.log({ text: game.Utils.formatMessage('enterLocation', { locationName: locationName }) });
                }
            };

            if (gameState.gameState === 'MAP' && payload.nodeId) {
                const startNodeId = gameState.currentMapNodeId;
                const endNodeId = payload.nodeId;
                const destinationName = gameData.maps[gameState.currentMapId].nodes[endNodeId].name;

                if (startNodeId === endNodeId) {
                    doEnterLocation(false);
                    return;
                }

                const path = game.Utils.findShortestPath(gameState.currentMapId, startNodeId, endNodeId);
                if (!path || path.length < 2) {
                    console.error(`无法找到从 ${startNodeId} 到 ${endNodeId} 的路径。`);
                    return;
                }

                const moveCost = gameData.settings.STANDARD_MOVE_COST;
                const steps = path.length - 1;
                const totalCost = {
                    time: (moveCost.time || 0) * steps,
                    energy: (moveCost.energy || 0) * steps
                };

                if (gameState.mp < totalCost.energy) {
                    await game.UI.showMessage("你的精力不足，无法进行移动。");
                    return;
                }
                
                let costHtml = "";
                const costDetails = [];
                if (totalCost.time > 0) costDetails.push(`${totalCost.time} 个时间段`);
                if (totalCost.energy > 0) costDetails.push(`${totalCost.energy} 点精力`);
                
                if(costDetails.length > 0) {
                   costHtml = `<p style="font-size:0.9em; color:var(--text-muted-color);">此次移动将消耗：<br>- ${costDetails.join('<br>- ')}</p>`;
                }

                // [核心修改] 优先使用payload中传入的自定义确认文本
                const confirmationHtml = payload.confirmationText 
                    ? `<p>${payload.confirmationText}</p>`
                    : `<p>你确定要前往【${destinationName}】吗？</p>`;

                const choice = await game.UI.showConfirmation({
                    title: payload.confirmationTitle || '确认移动',
                    html: `${confirmationHtml}${costHtml}`,
                    options: [ { text: '确定', value: true }, { text: '取消', value: false, class: 'secondary-action' } ]
                });

                if (choice && choice.originalOption.value) {
                    if (totalCost.time > 0) await this.advanceTime({ phases: totalCost.time });
                    if (totalCost.energy > 0) game.State.applyEffect(gameState, { mp: -totalCost.energy });

                    await game.UI.movePlayerOnMap(startNodeId, endNodeId, () => doEnterLocation(true));
                }

            } else {
                doEnterLocation(false);
            }
        },

        change_map(payload) {
            const state = game.State.get();
            if (payload.mapId) {
                state.currentMapId = payload.mapId;
            }
            if (payload.nodeId) {
                state.currentMapNodeId = payload.nodeId;
            }
            game.State.setUIMode('MAP');
        },

        enter_pocket_dimension({ locationId }) {
            const state = game.State.get();
            if (!locationId) return;
            let returnState = null;
            let currentState = state.gameState;

            if (currentState === 'MENU') {
                currentState = state.previousGameState;
            }
            if (currentState === 'EXPLORE') {
                returnState = { fromState: 'EXPLORE', locationId: state.currentLocationId };
            } else if (currentState === 'MAP') {
                returnState = { fromState: 'MAP', mapId: state.currentMapId, nodeId: state.currentMapNodeId };
            }
            state.pocketDimensionReturnState = returnState;
            state.currentLocationId = locationId;
            state.hotspotPageIndex = 0;
            game.State.setUIMode('EXPLORE');
            const locationName = gameData.locations[locationId]?.name || '未知地点';
            this.log({ text: `你进入了一个特殊的空间：${locationName}`, color: 'var(--log-color-primary)' });
        },

        exit_pocket_dimension() {
            const state = game.State.get();
            const returnState = state.pocketDimensionReturnState;
            if (!returnState) {
                console.warn("[Action Handler] exit_pocket_dimension called but no return state was saved.");
                return;
            }

            if (returnState.fromState === 'EXPLORE') {
                state.currentLocationId = returnState.locationId;
                game.State.setUIMode('EXPLORE');
            } else if (returnState.fromState === 'MAP') {
                state.currentMapId = returnState.mapId;
                state.currentMapNodeId = returnState.nodeId;
                game.State.setUIMode('MAP');
            }

            this.log({ text: "你回到了原来的地方。", color: 'var(--log-color-primary)' });
            state.pocketDimensionReturnState = null;
        },

        showMap() {
             game.Actions.showMap();
        },

        async advanceTime(payload) {
            const state = game.State.get();
            const time = state.time;
            const phasesInDay = gameData.settings.timePhases.length;
            let phasesToAdvance = 0;

            if (payload.until === 'next_morning') {
                phasesToAdvance = (phasesInDay - time.phase);
                if (phasesToAdvance <= 0) phasesToAdvance += phasesInDay;
            } else {
                phasesToAdvance = payload.phases || 1;
            }

            for (let i = 0; i < phasesToAdvance; i++) {
                time.phase++;
                if (time.phase >= phasesInDay) {
                    time.phase = 0;
                    time.day++;
                    this.log({ text: game.Utils.formatMessage('newDay'), color: "var(--log-color-primary)" });
                    const daysInMonth = new Date(time.year, time.month, 0).getDate();
                    if (time.day > daysInMonth) {
                        time.day = 1;
                        time.month++;
                        if (time.month > 12) {
                            time.month = 1;
                            time.year++;
                        }
                    }
                }
                game.Events.publish(EVENTS.TIME_ADVANCED);
            }
        },

        action(payload) {
            if (payload && payload.id && namedActions[payload.id]) {
                namedActions[payload.id]();
            } else {
                const id = payload ? payload.id : 'undefined';
                const message = `[Action Block Handler] Named action "${id}" not found.`;
                console.error(message);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `错误：未知的动作块动作ID "${id}"`, color: 'var(--error-color)' });
            }
        },
    });
})();