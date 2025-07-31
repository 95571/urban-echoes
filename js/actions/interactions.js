/**
 * @file js/actions/interactions.js
 * @description 动作模块 - 场景与对话交互 (v72.0.0 - [地图重构] 恢复节点点击交互)
 * @author Gemini (CTO)
 * @version 72.0.0
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
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('gameWelcome', { playerName: gameState.name }), color: 'var(--log-color-primary)' });
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
                await game.Actions.executeActionBlock(answerData.actionBlock);
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
            
            const interactionHandlers = {
                async start_dialogue(payload) {
                    if (payload && payload.dialogueId) await game.UI.showNarrative(payload.dialogueId);
                },
                async combat(payload) {
                    if (payload) game.Combat.start(payload);
                },
                async action_block(payload) {
                    if (payload) await game.Actions.executeActionBlock(payload);
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

        // [核心修改] 重构节点点击逻辑
        async handleMapNodeClick(mapNodeElement) {
            const gameState = game.State.get();
            const mapData = gameData.maps.world;
            const nodeId = mapNodeElement.dataset.id;
            const nodeData = mapData.nodes[nodeId];

            if (!nodeData || !game.ConditionChecker.evaluate(nodeData.conditions)) {
                return;
            }
            
            // 未来在这里加入“旅行”动画和“路线事件”
            
            // 立即更新玩家当前节点位置
            gameState.currentMapNodeId = nodeId;

            // 触发节点的交互
            if (nodeData.interaction) {
                await this.handleInteraction(nodeData, -1, 'map_node');
            }
            
            // 重新渲染UI以反映位置变化
            game.Events.publish(EVENTS.UI_RENDER);
        },
    });
})();