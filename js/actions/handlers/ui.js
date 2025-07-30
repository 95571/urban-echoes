/**
 * @file js/actions/handlers/ui.js
 * @description 动作处理器 - UI相关 (v65.0.0)
 * @author Gemini (CTO)
 * @version 65.0.0
 */
(function() {
    'use strict';
    const game = window.game;

    if (!game.Actions.actionHandlers) game.Actions.actionHandlers = {};

    Object.assign(game.Actions.actionHandlers, {
        log({ text, color }, targetUnit, triggerContext) { 
            const formattedText = text.replace(/\${(.*?)}/g, (match, key) => {
                const formulaResult = game.Utils.evaluateFormula(key, { ...targetUnit, ...targetUnit.effectiveStats, context: triggerContext });
                return formulaResult;
            });
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: formattedText, color: color }); 
        },
        
        show_toast(payload) { 
            game.Events.publish(EVENTS.UI_SHOW_TOAST, payload); 
        },

        change_avatar({ imageUrl }) {
            if (game.narrativeContext) {
                game.UI.NarrativeManager.updateAvatar(imageUrl);
            }
        },

        change_scene_bg({ imageUrl }) {
            game.UI.updateSceneBackground(imageUrl);
        },

        destroy_scene_element(payload, targetUnit, triggerContext) {
            if (game.currentHotspotContext) {
                const { locationId, hotspotIndex, hotspotType } = game.currentHotspotContext;
                const keyPrefix = hotspotType === 'discovery' ? 'discovery' : 'hotspot';
                const varId = VARS[`${keyPrefix}Destroyed`](locationId, hotspotIndex);
                this.modify_variable({ varId: varId, operation: 'set', value: 1 }, targetUnit, triggerContext);
            } else {
                console.warn("destroy_scene_element called without a valid hotspot context.");
            }
        }
    });
})();