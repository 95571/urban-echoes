/**
 * @file js/actions/player.js
 * @description 动作模块 - 玩家动作 (v42.1.0 - [修复] 将acceptJob移至此模块)
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

            const currentItemStack = gameState.inventory.find(i => i.id === itemStack.id);
            if (currentItemStack) {
                currentItemStack.quantity--; 
                if (currentItemStack.quantity <= 0) {
                    const itemIndex = gameState.inventory.findIndex(i => i.id === itemStack.id);
                    if (itemIndex > -1) {
                        gameState.inventory.splice(itemIndex, 1);
                    }
                }
            }
            
            game.UI.render(); 
        },

        equipItem(index) {
            const gameState = game.State.get();
            const itemStack = gameState.inventory[index];
            if (!itemStack) return;
            const itemData = gameData.items[itemStack.id];
            if (!itemData || !itemData.slot) return;

            const slotId = itemData.slot;
            const targetSlot = gameState.equipped[slotId];

            if (!targetSlot) {
                console.error(`无法找到ID为 "${slotId}" 的装备槽。`);
                return;
            }

            if (targetSlot.itemId) {
                this.unequipItem(slotId, true);
            }

            targetSlot.itemId = itemStack.id;
            itemStack.quantity--;
            if (itemStack.quantity <= 0) {
                gameState.inventory.splice(index, 1);
            }
            
            game.UI.log(game.Utils.formatMessage('equipItem', { itemName: itemData.name }));
            game.State.updateAllStats(false);
            game.UI.render();
        },

        unequipItem(slotId, internal = false) {
            const gameState = game.State.get();
            const targetSlot = gameState.equipped[slotId];
            
            if (!targetSlot || !targetSlot.itemId) return;

            const itemToUnequipId = targetSlot.itemId;
            this.addItemToInventory(itemToUnequipId, 1);
            targetSlot.itemId = null;

            if (!internal) {
                game.UI.log(game.Utils.formatMessage('unequipItem', { itemName: gameData.items[itemToUnequipId].name }));
                game.State.updateAllStats(false);
                game.UI.render();
            }
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
                game.UI.showDropQuantityPrompt(index);
            } else {
                const choice = await game.UI.showConfirmation({
                    title: `确定要丢弃 ${itemData.name} 吗？`,
                    options: [{text: '丢弃', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]
                });
                if (choice && choice.originalOption && choice.originalOption.value) {
                    gameState.inventory.splice(index, 1); 
                    game.UI.log(game.Utils.formatMessage('itemDropped', { itemName: itemData.name, quantity: 1 }));
                    game.UI.render(); 
                } 
            }
        },
        addItemToInventory(id, q = 1) { 
            const gameState = game.State.get();
            const itemData = gameData.items[id];
            if (!itemData) return;

            game.UI.log(game.Utils.formatMessage('getItemLoot', { itemName: itemData.name, quantity: q}), 'var(--success-color)');

            const existingStack = gameState.inventory.find(i => i.id === id); 
            if (existingStack) {
                existingStack.quantity += q; 
            } else {
                gameState.inventory.push({ id: id, quantity: q });
            }
        },
        setPlayerName(name) { game.State.get().name = name || '无名者'; },
        setFocusTarget(combatId) { const gameState = game.State.get(); if (!gameState.isCombat) return; gameState.combatState.focusedTargetId = combatId; game.UI.render(); },
        viewSkillDetail(skillId) { game.State.get().menu.skillDetailView = skillId; game.UI.render(); },
        viewRelationshipDetail(personId) { 
            game.State.get().menu.statusViewTargetId = personId;
            game.State.setUIMode('MENU', { screen: 'STATUS' });
        },
        backToPartyScreen() {
            game.State.get().menu.statusViewTargetId = null;
            game.State.setUIMode('MENU', { screen: 'PARTY' });
        },
        // [新增] 接受兼职的高级动作
        async acceptJob(jobId) {
            const jobData = gameData.jobs[jobId];
            if (!jobData) {
                game.UI.log(`错误：找不到ID为 ${jobId} 的兼职。`, 'var(--error-color)');
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

            game.UI.log(game.Utils.formatMessage('jobAccepted', { jobName: jobData.title }), 'var(--primary-color)');
        },
        playerCombatAttack() { game.Combat.playerAttack(); },
        playerCombatDefend() { game.Combat.playerDefend(); },
        playerCombatSkill() { game.UI.log("技能系统将在未来版本实装。"); },
        playerCombatItem() { game.UI.log("道具系统将在未来版本实装。"); },
        playerCombatFlee() { game.Combat.playerFlee(); },
    });
})();