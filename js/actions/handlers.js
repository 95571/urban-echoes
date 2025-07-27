/**
 * @file js/actions/handlers.js
 * @description 动作模块 - ActionBlock执行器 (v55.2.1 - [修复] 修正效果施加的目标)
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

        // [修复] add_effect 动作现在会正确地将玩家作为目标单位
        add_effect(payload) {
            if (payload && payload.effectId) {
                // 第一个参数传递 game.State.get()，即当前玩家的状态对象
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
        advanceTime(payload) {
            return new Promise(resolve => {
                const time = game.State.get().time;
                const phasesInDay = gameData.settings.timePhases.length;
                let phasesToAdvance = 0;
                if (payload.until === 'next_morning') {
                    phasesToAdvance = (phasesInDay - time.phase);
                    if (phasesToAdvance <= 0) phasesToAdvance += phasesInDay;
                } else { phasesToAdvance = payload.phases || 1; }
                time.phase += phasesToAdvance;
                while(time.phase >= phasesInDay) {
                    time.phase -= phasesInDay;
                    time.day++;
                    this.log({ text: game.Utils.formatMessage('newDay'), color: "var(--log-color-primary)" });
                    const daysInMonth = new Date(time.year, time.month, 0).getDate();
                    if(time.day > daysInMonth) {
                        time.day = 1; time.month++;
                        if(time.month > 12) { time.month = 1; time.year++; }
                    }
                }
                game.Events.publish(EVENTS.TIME_ADVANCED);
                resolve();
            });
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

    // [修改] 升级 executeActionBlock 以便在未来可以传递上下文
    async function executeActionBlock(actionBlock, context = null) {
        if (!actionBlock) return;
        const targetUnit = context || game.State.get(); // 默认目标是玩家

        for (const block of actionBlock) {
            const action = block.action || block;
            const handler = actionHandlers[action.type];
            if (handler) {
                // 将上下文传递给处理器（虽然目前只有add_effect用到了）
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