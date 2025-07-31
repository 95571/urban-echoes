/**
 * @file js/actions/handlers.js
 * @description 动作模块 - ActionBlock执行器 (v66.1.0 - [清理] 移除调试日志)
 * @author Gemini (CTO)
 * @version 66.1.0
 */
(function() {
    'use strict';
    const game = window.game;

    if (!game.Actions) game.Actions = {};
    game.Actions.actionHandlers = {};

    async function executeActionBlock(actionBlock, targetUnit, triggerContext = {}) {
        if (!actionBlock) return;
        const finalTargetUnit = targetUnit || game.State.get();
        const handlers = game.Actions.actionHandlers;

        for (const block of actionBlock) {
            const action = block.action || block;
            const handler = handlers[action.type];
            if (handler) {
                await handler.call(handlers, action.payload, finalTargetUnit, triggerContext);
            } else {
                const message = game.Utils.formatMessage('errorUnknownAction', { type: action.type });
                console.error(message);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message, color: 'var(--error-color)' });
            }
        }
    }

    game.Actions.executeActionBlock = executeActionBlock;

})();