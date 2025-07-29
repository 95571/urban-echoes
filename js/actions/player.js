/**
 * @file js/actions/player.js
 * @description 动作模块 - 玩家动作 (v60.0.0 - [重构] 交互式装备选择)
 * @author Gemini (CTO)
 * @version 60.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    if (!game.Actions) game.Actions = {};

    Object.assign(game.Actions, {
        async useItem(index) {
            const gameState = game.State.get();
            const itemStack = gameState.inventory[index];
            if (!itemStack) return;
            const itemData = gameData.items[itemStack.id];

            if (itemData.onUseActionBlock) {
                await this.executeActionBlock(itemData.onUseActionBlock);
            }

            const itemIndex = gameState.inventory.findIndex(i => i.id === itemStack.id && i === itemStack);
            if (itemIndex > -1) {
                gameState.inventory[itemIndex].quantity--;
                if (gameState.inventory[itemIndex].quantity <= 0) {
                    gameState.inventory.splice(itemIndex, 1);
                }
            }

            game.Events.publish(EVENTS.STATE_CHANGED);
            game.Events.publish(EVENTS.UI_RENDER);
        },

        async equipItem(index) {
            const gameState = game.State.get();
            const itemStack = gameState.inventory[index];
            if (!itemStack) return;
            
            const itemData = gameData.items[itemStack.id];
            if (!itemData || !itemData.slot) return;

            // [修改] 装备后关闭所有弹窗
            game.UI.ModalManager.hideAll();
            
            const slotId = itemData.slot;
            const targetSlot = gameState.equipped[slotId];
            if (!targetSlot) {
                console.error(`无法找到ID为 "${slotId}" 的装备槽。`);
                return;
            }
            if (targetSlot.itemId) {
                await this.unequipItem(slotId, true);
            }
            targetSlot.itemId = itemStack.id;

            if (itemData.onEquipActionBlock) {
                await this.executeActionBlock(itemData.onEquipActionBlock);
            }
            
            // 从库存中找到准确的物品实例并减少数量
            const itemIndexInInventory = gameState.inventory.findIndex(i => i === itemStack);
            if (itemIndexInInventory > -1) {
                gameState.inventory[itemIndexInInventory].quantity--;
                if (gameState.inventory[itemIndexInInventory].quantity <= 0) {
                    gameState.inventory.splice(itemIndexInInventory, 1);
                }
            }

            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('equipItem', { itemName: itemData.name }) });
            game.State.updateAllStats(false);
            game.Events.publish(EVENTS.STATE_CHANGED);
            game.Events.publish(EVENTS.UI_RENDER);
        },

        async unequipItem(slotId, internal = false) {
            const gameState = game.State.get();
            const targetSlot = gameState.equipped[slotId];
            if (!targetSlot || !targetSlot.itemId) {
                if (!internal) game.UI.ModalManager.hideAll();
                return;
            }
            const itemToUnequipId = targetSlot.itemId;
            const itemData = gameData.items[itemToUnequipId];

            if (itemData && itemData.onUnequipActionBlock) {
                await this.executeActionBlock(itemData.onUnequipActionBlock);
            }

            this.addItemToInventory(itemToUnequipId, 1, true);
            targetSlot.itemId = null;
            if (!internal) {
                game.UI.ModalManager.hideAll();
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('unequipItem', { itemName: gameData.items[itemToUnequipId].name }) });
                game.State.updateAllStats(false);
                game.Events.publish(EVENTS.STATE_CHANGED);
                game.Events.publish(EVENTS.UI_RENDER);
            }
        },
        
        removeItemByIndex(index, quantity) {
            const state = game.State.get();
            const itemStack = state.inventory[index];
            if (!itemStack) return;
            const itemData = gameData.items[itemStack.id];
            const clampedQuantity = Math.max(0, Math.min(quantity, itemStack.quantity));
            if (clampedQuantity <= 0) return;

            itemStack.quantity -= clampedQuantity;
            if (itemStack.quantity <= 0) {
                state.inventory.splice(index, 1);
            }
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('itemDropped', { itemName: itemData.name, quantity: clampedQuantity }) });
        },

        async dropItem(index) { 
            const gameState = game.State.get();
            const item = gameState.inventory[index];
            if (!item) return;
            const itemData = gameData.items[item.id];
            if (itemData.droppable === false) {
                await game.UI.showMessage('这个物品很重要，不能丢弃。');
                return;
            }

            if (item.quantity > 1) {
                const quantityToDrop = await game.UI.showDropQuantityPrompt(index);
                if (quantityToDrop) {
                    this.removeItemByIndex(index, quantityToDrop);
                    game.Events.publish(EVENTS.STATE_CHANGED);
                    game.Events.publish(EVENTS.UI_RENDER);
                } else {
                    game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
                }
            } else {
                const choice = await game.UI.showConfirmation({
                    ...gameData.systemMessages.dropItemConfirm,
                    options: [{text: '丢弃', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]
                });
                if (choice && choice.originalOption && choice.originalOption.value) {
                    this.removeItemByIndex(index, 1);
                    game.Events.publish(EVENTS.STATE_CHANGED);
                    game.Events.publish(EVENTS.UI_RENDER);
                } else {
                    game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
                }
            }
        },
        
        addItemToInventory(id, q = 1, internal = false) { 
            const gameState = game.State.get();
            const itemData = gameData.items[id];
            if (!itemData) return;
            
            if (!internal) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('getItemLoot', { itemName: itemData.name, quantity: q}), color: 'var(--log-color-success)' });
            }

            const existingStack = gameState.inventory.find(i => i.id === id); 
            if (existingStack) {
                existingStack.quantity += q; 
            } else {
                gameState.inventory.push({ id: id, quantity: q });
            }

            if (!internal) {
                game.Events.publish(EVENTS.STATE_CHANGED);
            }
        },

        // --- [新增] 状态页面相关动作 ---
        showEquipmentSelection(slotId) {
            return game.UI.showEquipmentSelection(slotId);
        },

        setPlayerName(name) { game.State.get().name = name || '无名者'; game.Events.publish(EVENTS.STATE_CHANGED); },
        setFocusTarget(combatId) { const gameState = game.State.get(); if (!gameState.isCombat) return; gameState.combatState.focusedTargetId = combatId; game.Events.publish(EVENTS.UI_RENDER); },
        viewSkillDetail(skillId) { game.State.get().menu.skillDetailView = skillId; game.Events.publish(EVENTS.UI_RENDER); },
        viewRelationshipDetail(personId) { 
            game.State.get().menu.statusViewTargetId = personId;
            game.State.setUIMode('MENU', { screen: 'STATUS' });
        },
        backToPartyScreen() {
            game.State.get().menu.statusViewTargetId = null;
            game.State.setUIMode('MENU', { screen: 'PARTY' });
        },
        async acceptJob(jobId) {
            const jobData = gameData.jobs[jobId];
            if (!jobData) {
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `错误：找不到ID为 ${jobId} 的兼职。`, color: 'var(--error-color)' });
                return;
            }
            const gameState = game.State.get();
            const questVar = jobData.questVariable;
            if ((gameState.variables[questVar] || 0) === 1) {
                await game.UI.showMessage(game.Utils.formatMessage('jobAlreadyActive', { jobName: jobData.title }));
                return;
            }
            const requirementsMet = game.ConditionChecker.evaluate(jobData.requirements);
            if (!requirementsMet) {
                const requirementsText = jobData.requirements.map(r => r.text).join('，');
                await game.UI.showMessage(game.Utils.formatMessage('jobRequirementsNotMet', {
                    jobName: jobData.title,
                    requirementsText: requirementsText
                }));
                return;
            }
            gameState.variables[questVar] = 1;
            gameState.quests[jobData.questId] = {
                id: jobData.questId,
                sourceJobId: jobId,
                objectives: JSON.parse(JSON.stringify(jobData.objectives || []))
            };
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: game.Utils.formatMessage('jobAccepted', { jobName: jobData.title }), color: 'var(--log-color-primary)' });
        },
        playerCombatAttack() { game.Combat.playerAttack(); },
        playerCombatDefend() { game.Combat.playerDefend(); },
        playerCombatSkill() { game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: "技能系统将在未来版本实装。" }); },
        playerCombatItem() { game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: "道具系统将在未来版本实装。" }); },
        playerCombatFlee() { game.Combat.playerFlee(); },
    });
})();