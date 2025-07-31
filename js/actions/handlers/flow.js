/**
 * @file js/actions/handlers/flow.js
 * @description 动作处理器 - 流程控制相关 (v80.0.0 - [动画] 集成地图移动动画)
 * @author Gemini (CTO)
 * @version 80.0.0
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

        // [核心改造] enter_location 现在会触发移动动画
        async enter_location(payload) {
            const gameState = game.State.get();
            const startNodeId = gameState.currentMapNodeId;
            const endNodeId = payload.nodeId;
            
            const doEnterLocation = () => {
                gameState.currentLocationId = payload.locationId;
                if (payload.nodeId) {
                    gameState.currentMapNodeId = payload.nodeId;
                }
                gameState.hotspotPageIndex = 0;
                game.State.setUIMode('EXPLORE');
                const locationName = gameData.locations[payload.locationId]?.name || '未知地点';
                this.log({ text: game.Utils.formatMessage('enterLocation', { locationName: locationName }) });
            };

            // 如果是在地图上移动 (有起点和终点), 则播放动画
            if (gameState.gameState === 'MAP' && endNodeId && startNodeId !== endNodeId) {
                await game.UI.movePlayerOnMap(startNodeId, endNodeId, doEnterLocation);
            } else {
                // 否则 (例如从场景到场景), 立即进入
                doEnterLocation();
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