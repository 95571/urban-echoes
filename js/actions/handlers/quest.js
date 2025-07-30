/**
 * @file js/actions/handlers/quest.js
 * @description 动作处理器 - 任务相关 (v65.0.0)
 * @author Gemini (CTO)
 * @version 65.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions.actionHandlers) game.Actions.actionHandlers = {};

    Object.assign(game.Actions.actionHandlers, {
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
        }
    });
})();