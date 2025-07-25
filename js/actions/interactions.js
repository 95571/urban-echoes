/**
 * @file js/actions/interactions.js
 * @description 动作模块 - 场景与对话交互 (v52.0.0 - 架构升级 "磐石计划")
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions) game.Actions = {};

    Object.assign(game.Actions, {
        startSequence(sequenceId) {
            const sequenceData = gameData.questionSequences[sequenceId];
            if (!sequenceData) {
                console.error(`Question sequence "${sequenceId}" not found.`);
                return;
            }
            game.State.get().activeSequence = {
                sequenceId: sequenceId,
                currentQuestionId: sequenceData.startQuestionId
            };
            game.State.setUIMode('SEQUENCE');
        },

        endSequence() {
            const gameState = game.State.get();
            const sequenceId = gameState.activeSequence.sequenceId;
            gameState.activeSequence = null;

            if (sequenceId === 'character_creation') {
                game.State.updateAllStats(true);
                game.State.setUIMode('EXPLORE');
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameWelcome', { playerName: gameState.name }), color: 'var(--primary-color)' });
            } else {
                game.State.setUIMode('EXPLORE');
            }
        },

        async handleSequenceAnswer(answerIndex) {
            const gameState = game.State.get();
            const sequenceId = gameState.activeSequence.sequenceId;
            const questionId = gameState.activeSequence.currentQuestionId;

            const questionData = gameData.questionSequences[sequenceId].questions[questionId];
            const answerData = questionData.answers[answerIndex];

            if (answerData.actionBlock) {
                await this.executeActionBlock(answerData.actionBlock);
            }

            let nextQuestionId;
            if (typeof answerData.transition === 'string') {
                nextQuestionId = answerData.transition;
            } else if (typeof answerData.transition === 'object' && answerData.transition.type === 'random') {
                const outcomes = answerData.transition.outcomes;
                const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
                let random = Math.random() * totalWeight;
                for (const outcome of outcomes) {
                    if (random < outcome.weight) {
                        nextQuestionId = outcome.id;
                        break;
                    }
                    random -= outcome.weight;
                }
            }

            if (nextQuestionId === 'END_SEQUENCE') {
                this.endSequence();
            } else {
                gameState.activeSequence.currentQuestionId = nextQuestionId;
                game.Events.publish(EVENTS.UI_RENDER);
            }
        },

        handleSequenceTextInput(value) {
            const gameState = game.State.get();
            const sequenceId = gameState.activeSequence.sequenceId;
            const questionId = gameState.activeSequence.currentQuestionId;
            const questionData = gameData.questionSequences[sequenceId].questions[questionId];
            const answerData = questionData.answers[0];

            this.setPlayerName(value);

            if (answerData.transition === 'END_SEQUENCE') {
                this.endSequence();
            } else {
                gameState.activeSequence.currentQuestionId = answerData.transition;
                game.Events.publish(EVENTS.UI_RENDER);
            }
        },

        async handleInteraction(spotData, index, type) {
            game.currentHotspotContext = {
                locationId: game.State.get().currentLocationId,
                hotspotIndex: index,
                hotspotType: type
            };
            if (!game.ConditionChecker.evaluate(spotData.conditions)) {
                game.currentHotspotContext = null;
                return;
            }
            const interaction = spotData.interaction;
            if (!interaction || !interaction.type) {
                console.error("处理交互失败：交互数据格式不正确。", spotData);
                game.currentHotspotContext = null;
                return;
            }
            
            // [重构] 交互处理器现在更通用
            const interactionHandlers = {
                async start_dialogue(payload) {
                    if (payload && payload.dialogueId) await game.UI.showNarrative(payload.dialogueId);
                },
                async combat(payload) {
                    if (payload) game.Combat.start(payload);
                },
                async action_block(payload) {
                    if (payload) await this.executeActionBlock(payload);
                }
            };

            const handler = interactionHandlers[interaction.type];
            if (handler) {
                await handler.call(this, interaction.payload);
            } else {
                const message = game.Utils.formatMessage('errorUnknownAction', { type: interaction.type });
                console.warn(message);
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message, color: 'var(--error-color)'});
            }
            game.currentHotspotContext = null;
        },

        async handleMapNodeClick(mapNodeId) {
            const gameState = game.State.get();
            const currentMapData = gameData.maps[gameState.currentMapId];
            const nodeData = currentMapData.nodes[mapNodeId];
            if (!nodeData || !nodeData.interaction) return;
            if (!game.ConditionChecker.evaluate(nodeData.conditions)) { return; }

            gameState.currentMapNodeId = mapNodeId;

            await this.handleInteraction(nodeData, -1, 'map_node');
        },
    });
})();