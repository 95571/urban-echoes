/**
 * @file js/actions/handlers.js
 * @description 动作模块 - ActionBlock执行器 (v55.2.2 - [修复] 修正多阶段时间推进的Buff Tick)
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions) game.Actions = {};

    const namedActions = {
        fullHeal() {
            const state = game.State.get();
            const maxHp = state.maxHp;
            const maxMp = state.maxMp;
            game.State.applyEffect({ hp: maxHp, mp: maxMp });
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('fullHeal'), color: 'var(--log-color-success)' });
        }
    };

    const actionHandlers = {
        log({ text, color }) { game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: text, color: color }); },
        show_toast(payload) { game.Events.publish(EVENTS.UI_SHOW_TOAST, payload); },
        
        start_dialogue(payload) { return game.UI.showNarrative(payload.dialogueId); },

        add_effect(payload) {
            if (payload && payload.effectId) {
                game.Effects.add(game.State.get(), payload.effectId);
            }
        },

        effect(payload) { game.State.applyEffect(payload); },
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
        destroy_scene_element() {
            if (game.currentHotspotContext) {
                const { locationId, hotspotIndex, hotspotType } = game.currentHotspotContext;
                const keyPrefix = hotspotType === 'discovery' ? 'discovery' : 'hotspot';
                const varId = VARS[`${keyPrefix}Destroyed`](locationId, hotspotIndex);
                this.modify_variable({ varId: varId, operation: 'set', value: 1 });
                if (game.State.get().gameState === 'EXPLORE') {
                    game.Events.publish(EVENTS.UI_RENDER);
                }
            } else {
                console.warn("destroy_scene_element called without a valid hotspot context.");
            }
        },
        enter_location(payload) {
            const gameState = game.State.get();
            gameState.currentLocationId = payload.locationId;
            gameState.hotspotPageIndex = 0;
            game.State.setUIMode('EXPLORE');
            const locationName = gameData.locations[payload.locationId]?.name || '未知地点';
            this.log({ text: game.Utils.formatMessage('enterLocation', { locationName: locationName }) });
        },
        add_item(payload) {
            game.Actions.addItemToInventory(payload.itemId, payload.quantity || 1);
        },
        showMap() {
             game.Actions.showMap();
        },
        map_transition(payload) {
            const gameState = game.State.get();
            gameState.currentMapId = payload.targetMapId;
            gameState.currentMapNodeId = payload.targetStartNode;
            game.State.setUIMode('MAP');
        },
        
        // [修复] 重写时间推进逻辑，确保每个阶段都发布一次事件
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
                // 推进1个时间段
                time.phase++;

                // 处理日期翻页
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
                
                // 为每个推进的阶段发布一次事件，让效果系统等模块进行响应
                game.Events.publish(EVENTS.TIME_ADVANCED);
            }
        },
        
        remove_item({ itemId, quantity = 1, log, logColor }) {
            const state = game.State.get();
            const itemData = gameData.items[itemId];
            if (!itemData) return;

            const playerHasEnough = () => {
                const count = state.inventory.filter(i => i.id === itemId).reduce((sum, i) => sum + i.quantity, 0);
                return count >= quantity;
            };

            if (!playerHasEnough()) {
                return;
            }

            let removedCount = 0;
            for (let i = state.inventory.length - 1; i >= 0; i--) {
                if (removedCount >= quantity) break;

                if (state.inventory[i].id === itemId) {
                    const toRemove = Math.min(quantity - removedCount, state.inventory[i].quantity);
                    state.inventory[i].quantity -= toRemove;
                    removedCount += toRemove;
                    if (state.inventory[i].quantity <= 0) {
                        state.inventory.splice(i, 1);
                    }
                }
            }

            if (log) {
                this.log({ text: log, color: logColor });
            }
            game.Events.publish(EVENTS.STATE_CHANGED);
        },
        modify_variable({ varId, operation, value, log, logColor }) {
            const state = game.State.get();
            if (!state.variables) state.variables = {};

            const oldValue = state.variables[varId] || 0;

            switch(operation) {
                case 'set': state.variables[varId] = value; break;
                case 'add': state.variables[varId] = oldValue + value; break;
                case 'subtract': state.variables[varId] = oldValue - value; break;
                default: console.error(`未知的变量操作: ${operation}`); return;
            }

            if (log) {
                this.log({ text: log, color: logColor });
            }
            if (state.gameState === 'EXPLORE') {
                game.Events.publish(EVENTS.UI_RENDER);
            }
        },
        async acceptJob({ jobId }) {
            return game.Actions.acceptJob(jobId);
        },
        async complete_quest({ questId }) {
            const gameState = game.State.get();
            const questInstance = gameState.quests[questId];
            if (!questInstance) return;

            const jobData = gameData.jobs[questInstance.sourceJobId];
            if (!jobData) return;

            const questVar = jobData.questVariable;

            if (gameState.variables[questVar] !== 1) {
                console.warn(`Attempted to complete non-active quest: ${questId}`);
                return;
            }

            if (jobData.completionActionBlock) {
                await game.Actions.executeActionBlock(jobData.completionActionBlock);
            }

            delete gameState.quests[questId];

            if (gameState.gameState === 'MENU' && gameState.menu.current === 'QUESTS') {
                game.Events.publish(EVENTS.UI_RENDER);
            }
        },
        change_avatar({ imageUrl }) {
            if (game.narrativeContext) {
                game.UI.NarrativeManager.updateAvatar(imageUrl);
            }
        },
        change_scene_bg({ imageUrl }) {
            game.UI.updateSceneBackground(imageUrl);
        }
    };

    async function executeActionBlock(actionBlock, context = null) {
        if (!actionBlock) return;
        const targetUnit = context || game.State.get();

        for (const block of actionBlock) {
            const action = block.action || block;
            const handler = actionHandlers[action.type];
            if (handler) {
                await handler.call(actionHandlers, action.payload, targetUnit);
            } else {
                const message = game.Utils.formatMessage('errorUnknownAction', { type: action.type });
                console.error(message);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message, color: 'var(--error-color)' });
            }
        }
    }

    game.Actions.executeActionBlock = executeActionBlock;

})();