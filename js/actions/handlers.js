/**
 * @file js/actions/handlers.js
 * @description 动作模块 - ActionBlock执行器 (v65.0.0 - [重构] 拆分为独立模块)
 * @author Gemini (CTO)
 * @version 65.0.0
 */
(function() {
    'use strict';
    const game = window.game;

    // 初始化所有动作处理器的“挂载点”
    if (!game.Actions) game.Actions = {};
    game.Actions.actionHandlers = {};

    // ActionBlock 执行器
    async function executeActionBlock(actionBlock, targetUnit, triggerContext = {}) {
        if (!actionBlock) return;
        const finalTargetUnit = targetUnit || game.State.get();
        const handlers = game.Actions.actionHandlers;

        for (const block of actionBlock) {
            const action = block.action || block;
            const handler = handlers[action.type];
            if (handler) {
                // 使用 .call 来确保处理器内部的 this 指向 handlers 对象本身
                // 这允许一个处理器调用另一个处理器 (例如 destroy_scene_element 调用 modify_variable)
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