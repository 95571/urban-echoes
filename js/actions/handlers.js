/**
 * @file js/actions/handlers.js
 * @description 动作模块 - ActionBlock执行器 (v51.0.0 - [新增] 叙事UI控制动作)
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
            game.UI.log(game.Utils.formatMessage('fullHeal'), 'var(--success-color)');
        }
    };

    const actionHandlers = {
        log({ text, color }) { game.UI.log(text, color); },
        show_dialogue(payload) { return game.UI.showNarrative(payload); }, // [修改] 改为调用新叙事UI
        effect(payload) { game.State.applyEffect(payload); },
        show_toast(payload) { game.UI.showToast(payload); },
        action(payload) {
            if (payload && payload.id && namedActions[payload.id]) {
                namedActions[payload.id]();
            } else {
                const id = payload ? payload.id : 'undefined';
                console.error(`[Action Block Handler] Named action "${id}" not found.`);
                game.UI.log(`错误：未知的动作块动作ID "${id}"`, 'var(--error-color)');
            }
        },
        destroy_scene_element() {
            if (game.currentHotspotContext) {
                const { locationId, hotspotIndex, hotspotType } = game.currentHotspotContext;
                const keyPrefix = hotspotType === 'discovery' ? 'discovery' : 'hotspot';
                const varId = `${keyPrefix}_destroyed_${locationId}_${hotspotIndex}`;
                this.modify_variable({ varId: varId, operation: 'set', value: 1 });
                if (game.State.get().gameState === 'EXPLORE') {
                    game.UI.render();
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
            game.UI.log(game.Utils.formatMessage('enterLocation', { locationName: locationName }));
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
                    game.UI.log(game.Utils.formatMessage('newDay'), "var(--secondary-color)");
                    const daysInMonth = new Date(time.year, time.month, 0).getDate();
                    if(time.day > daysInMonth) {
                        time.day = 1; time.month++;
                        if(time.month > 12) { time.month = 1; time.year++; }
                    }
                }
                if (game.state.gameState !== 'TITLE') {
                    game.UI.renderLeftPanel();
                }
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
                game.UI.log(log, logColor);
            }
            if (state.gameState === 'MENU' && state.menu.current === 'INVENTORY') {
                game.UI.render();
            }
        },
        modify_variable({ varId, operation, value, log, logColor }) {
            const state = game.State.get();
            if (!state.variables) state.variables = {};

            const oldValue = state.variables[varId] || 0;

            switch(operation) {
                case 'set':
                    state.variables[varId] = value;
                    break;
                case 'add':
                    state.variables[varId] = oldValue + value;
                    break;
                case 'subtract':
                    state.variables[varId] = oldValue - value;
                    break;
                default:
                    console.error(`未知的变量操作: ${operation}`);
                    return;
            }

            if (log) {
                game.UI.log(log, logColor);
            }
            if (state.gameState === 'EXPLORE') {
                game.UI.render();
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
                game.UI.render();
            }
        },
        // [新增] 叙事UI原子动作
        change_avatar({ imageUrl }) {
            if (game.narrativeContext) {
                game.UI.NarrativeManager.updateAvatar(imageUrl);
            }
        },
        change_scene_bg({ imageUrl }) {
            game.UI.updateSceneBackground(imageUrl);
        }
    };

    async function executeActionBlock(actionBlock) {
        if (!actionBlock) return;
        for (const block of actionBlock) {
            const action = block.action || block;
            const handler = actionHandlers[action.type];
            if (handler) {
                await handler.call(actionHandlers, action.payload); // 确保 this 指向 actionHandlers
            } else {
                console.error(game.Utils.formatMessage('errorUnknownAction', { type: action.type }));
            }
        }
    }

    game.Actions.executeActionBlock = executeActionBlock;

})();