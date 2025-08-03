/**
 * @file js/actions/interactions.js
 * @description 动作模块 - 场景与对话交互 (v83.0.0 - [玩法] 适配成本系统)
 * @author Gemini (CTO)
 * @version 83.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions) game.Actions = {};

    // [核心新增] 检查并处理成本的通用辅助函数
    async function checkAndProcessCost(cost) {
        if (!cost) return true; // 没有成本，直接通过

        const gameState = game.State.get();
        let costMessages = [];
        let canAfford = true;

        if (cost.time > 0) {
            costMessages.push(`${cost.time}个时间段`);
        }
        if (cost.energy > 0) {
            costMessages.push(`${cost.energy}点精力`);
            if (gameState.mp < cost.energy) canAfford = false;
        }
        if (cost.gold > 0) {
            costMessages.push(`${cost.gold}金`);
            if (gameState.gold < cost.gold) canAfford = false;
        }
        
        if (!canAfford) {
            await game.UI.showMessage(`你的资源不足，无法执行此操作。`);
            return false;
        }

        // 确认框 (如果成本存在)
        if (costMessages.length > 0) {
            const choice = await game.UI.showConfirmation({
                title: '确认操作',
                html: `<p>此操作将消耗：<br>- ${costMessages.join('<br>- ')}</p><p>要继续吗？</p>`,
                options: [ { text: '继续', value: true }, { text: '取消', value: false, class: 'secondary-action' } ]
            });
            if (!choice || !choice.originalOption.value) return false;
        }

        // 扣除成本
        if (cost.time > 0) await game.Actions.actionHandlers.advanceTime({ phases: cost.time });
        if (cost.energy > 0) game.State.applyEffect(gameState, { mp: -cost.energy });
        if (cost.gold > 0) game.State.applyEffect(gameState, { gold: -cost.gold });
        
        return true;
    }


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
            
            const interactions = spotData.interactions || [
                { conditions: spotData.conditions, action: spotData.interaction, cost: spotData.cost }
            ];

            for (const interactionDef of interactions) {
                if (game.ConditionChecker.evaluate(interactionDef.conditions)) {
                    
                    // [核心修改] 在执行动作前，先检查成本 - 注意：地图节点的移动成本由 enter_location 内部处理，这里不重复检查
                    if (type !== 'map_node') {
                        const canProceed = await checkAndProcessCost(interactionDef.cost);
                        if (!canProceed) {
                            game.currentHotspotContext = null;
                            return; // 成本不足或取消，则终止交互
                        }
                    }

                    const action = interactionDef.action;
                    if (!action || !action.type) {
                        console.error("处理交互失败：动作数据格式不正确。", interactionDef);
                        continue;
                    }

                    const handler = game.Actions.actionHandlers[action.type];
                    if (handler) {
                        await handler.call(game.Actions.actionHandlers, action.payload);
                    } else {
                        const legacyHandler = {
                            async combat(payload) { if (payload) game.Combat.start(payload); },
                            async action_block(payload) { if (payload) await game.Actions.executeActionBlock(payload); }
                        }[action.type];

                        if (legacyHandler) {
                            await legacyHandler.call(this, action.payload);
                        } else {
                            const message = game.Utils.formatMessage('errorUnknownAction', { type: action.type });
                            console.warn(message, spotData);
                            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message, color: 'var(--error-color)'});
                        }
                    }
                    
                    game.currentHotspotContext = null;
                    return; 
                }
            }
            
            game.currentHotspotContext = null;
        },

        async handleMapNodeClick(mapNodeElement) {
            const gameState = game.State.get();
            const mapData = gameData.maps[gameState.currentMapId];
            const nodeId = mapNodeElement.dataset.id;
            const nodeData = mapData.nodes[nodeId];

            if (!nodeData) return;
            
            await this.handleInteraction(nodeData, -1, 'map_node');
        },
    });
})();