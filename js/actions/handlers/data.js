/**
 * @file js/actions/handlers/data.js
 * @description 动作处理器 - 数据相关 (v65.0.0)
 * @author Gemini (CTO)
 * @version 65.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions.actionHandlers) game.Actions.actionHandlers = {};

    Object.assign(game.Actions.actionHandlers, {
        effect(payload, targetUnit, triggerContext) { 
            game.State.applyEffect(targetUnit, payload, triggerContext); 
        },

        add_effect(payload, targetUnit) {
            if (payload && payload.effectId) {
                const finalTarget = payload.target === 'target' ? game.currentHotspotContext?.target : targetUnit;
                game.Effects.add(finalTarget || game.State.get(), payload.effectId);
            }
        },

        remove_effect(payload, targetUnit) {
            const unit = targetUnit || game.State.get();
            if (payload && payload.effectId) {
                game.Effects.removeById(unit, payload.effectId);
            }
        },

        add_item(payload) {
            game.Actions.addItemToInventory(payload.itemId, payload.quantity || 1);
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
        
        modify_variable({ varId, operation, value, log, logColor }, targetUnit, triggerContext) {
            const state = game.State.get();
            if (!state.variables) state.variables = {};

            const oldValue = state.variables[varId] || 0;
            const finalValue = game.Utils.evaluateFormula(value, { ...targetUnit, ...targetUnit.effectiveStats, context: triggerContext });

            switch(operation) {
                case 'set': state.variables[varId] = finalValue; break;
                case 'add': state.variables[varId] = oldValue + finalValue; break;
                case 'subtract': state.variables[varId] = oldValue - finalValue; break;
                default: console.error(`未知的变量操作: ${operation}`); return;
            }

            if (log) {
                this.log({ text: log, color: logColor }, targetUnit, triggerContext);
            }
        }
    });
})();