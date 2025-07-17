/**
 * @file js/actions.js
 * @description 玩家动作与交互处理模块 (v27.0.0 - [新增] 高光时刻通知模块)
 * @author Gemini (CTO)
 * @version 27.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const Actions = {
        namedActions: {
            fullHeal() {
                const state = game.State.get();
                const maxHp = state.maxHp;
                const maxMp = state.maxMp;
                game.State.applyEffect({ hp: maxHp, mp: maxMp });
                game.UI.log(game.Utils.formatMessage('fullHeal'), 'var(--success-color)');
            }
        },

        showLoadScreen() {
            const meta = game.SaveLoad.getMeta();
            let slotsHtml = '<ul class="save-slot-list">';
            
            Array.from({ length: game.NUM_SAVE_SLOTS }, (_, i) => i + 1).forEach(slot => {
                const slotData = meta[slot];
                const info = slotData ? `${slotData.name} - ${slotData.time}` : '[空]';
                
                let buttonsHtml = '';
                if (slotData) {
                    buttonsHtml += `<button data-action="loadGame" data-slot="${slot}" title="读取">${gameData.icons.load}</button>`;
                    buttonsHtml += `<button data-action="exportSave" data-slot="${slot}" title="导出">${gameData.icons.export}</button>`;
                }
                buttonsHtml += `<button data-action="importSave" data-slot="${slot}" title="导入">${gameData.icons.import}</button>`;

                slotsHtml += `
                    <li>
                        <div>
                            <strong>存档 ${slot}</strong>
                            <small style="display:block; color:var(--text-muted-color);">${info}</small>
                        </div>
                        <div class="item-actions">
                            ${buttonsHtml}
                        </div>
                    </li>
                `;
            });
            slotsHtml += '</ul>';
            
            game.UI.showCustomModal('杭城旧梦', slotsHtml);
        },

        async importSave(slot) {
            if (!slot) return;
            
            const meta = game.SaveLoad.getMeta();
            const isInCustomModal = game.UI.isCustomModalOpen();

            if (meta[slot]) {
                if (isInCustomModal) {
                    game.UI.hideCustomModal();
                }

                const choice = await game.UI.showConfirmation({ 
                    title: '确认覆盖', text: `此操作将覆盖“存档 ${slot}”中的现有数据，是否继续？`,
                    options: [{ text: '覆盖', value: true, class: 'danger-button' }, { text: '取消', value: false, class: 'secondary-action' }]
                });
                
                if (!choice || !choice.originalOption.value) {
                    if (isInCustomModal) {
                        this.showLoadScreen();
                    }
                    return; 
                }
            }

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json,application/json';
            
            fileInput.onchange = e => {
                const file = e.target.files[0];
                if (!file) {
                     if (isInCustomModal) {
                        this.showLoadScreen();
                    }
                    return;
                };

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const saveData = JSON.parse(event.target.result);
                        if (!saveData.id || !saveData.name || !saveData.time || !saveData.stats) {
                           throw new Error("Invalid save file format.");
                        }
                        
                        const time = saveData.time;
                        const timeString = `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`;
                        meta[slot] = { name: saveData.name, time: timeString, timestamp: Date.now() };
                        
                        localStorage.setItem(game.SAVE_KEY_PREFIX + slot, JSON.stringify(saveData));
                        localStorage.setItem(game.SAVE_META_KEY, JSON.stringify(meta));

                        game.UI.log(game.Utils.formatMessage('gameImported', { slot: slot }), 'var(--success-color)');

                        if (isInCustomModal) {
                            this.showLoadScreen();
                        } else {
                            game.SaveLoad.renderSystemMenu();
                        }

                    } catch (err) {
                        game.UI.log(game.Utils.formatMessage('errorLoadGame'), "var(--error-color)");
                        console.error("Import save failed:", err);
                        if (isInCustomModal) {
                           this.showLoadScreen();
                       }
                    }
                };
                reader.readAsText(file);
            };
            fileInput.click();
        },
        
        newGame() {
            game.State.init(null);
            this.startSequence('character_creation');
        },

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
                game.UI.log(game.Utils.formatMessage('gameWelcome', { playerName: gameState.name }), 'var(--primary-color)');
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
                game.UI.render();
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
                game.UI.render();
            }
        },

        showAchievements() {
            game.UI.showConfirmation(gameData.systemMessages.achievementsContent);
        },
        showAbout() {
            game.UI.showConfirmation(gameData.systemMessages.aboutContent);
        },
        exitToTitle() {
            game.State.init(null); 
        },
        setUIMode: game.State.setUIMode,
        showMap() {
            game.State.setUIMode('MAP');
        },
        exitMenu() {
            const gameState = game.State.get();
            game.State.setUIMode(gameState.previousGameState || 'EXPLORE');
        },
        async handleInteraction(spotData, index) {
            game.currentHotspotContext = {
                locationId: game.State.get().currentLocationId,
                hotspotIndex: index
            };
            if (!game.ConditionChecker.evaluate(spotData.conditions)) {
                game.currentHotspotContext = null; 
                return;
            }
            const interaction = spotData.interaction;
            if (!interaction || !interaction.type) {
                game.currentHotspotContext = null; 
                return;
            }
            const handler = this.interactionHandlers[interaction.type];
            if (handler) { 
                await handler(interaction.payload); 
            } else { 
                console.warn(game.Utils.formatMessage('errorUnknownAction', { type: interaction.type })); 
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

            await this.handleInteraction(nodeData, -1);
        },

        interactionHandlers: {
            async interactive_dialogue(payload) {
                if (payload) {
                    await game.UI.showConfirmation(payload);
                }
            },
            action(payload) {
                if (payload.id && Actions.namedActions[payload.id]) {
                    Actions.namedActions[payload.id](payload.params || {});
                } else {
                    console.error(`[Interaction Handler] Named action "${payload.id}" not found.`);
                    game.UI.log(`错误：未知的交互动作ID "${payload.id}"`, 'var(--error-color)');
                }
            },
            async combat(payload) {
                if (!payload) {
                    console.error("Combat interaction is missing payload.");
                    return;
                }
                game.Combat.start(payload);
            },
            showMap() { Actions.showMap(); }
        },
        async executeActionBlock(actionBlock) {
             if (!actionBlock) return;
            for (const block of actionBlock) {
                const action = block.action || block;
                const handler = this.actionHandlers[action.type];
                if (handler) { await handler(action.payload); } 
                else { console.error(game.Utils.formatMessage('errorUnknownAction', { type: action.type })); }
            }
        },
        actionHandlers: {
            log({ text, color }) { game.UI.log(text, color); },
            showMessage({ text, button }) { return game.UI.showMessage(text, button); },
            effect(payload) { game.State.applyEffect(payload); },
            // [新增] 调用新的高光通知UI函数
            show_toast(payload) { game.UI.showToast(payload); },
            action(payload) {
                if (payload && payload.id && Actions.namedActions[payload.id]) {
                    Actions.namedActions[payload.id]();
                } else {
                    const id = payload ? payload.id : 'undefined';
                    console.error(`[Action Block Handler] Named action "${id}" not found.`);
                    game.UI.log(`错误：未知的动作块动作ID "${id}"`, 'var(--error-color)');
                }
            },
            set_flag(payload) {
                if (payload.flagId) {
                    game.State.get().flags[payload.flagId] = payload.value;
                }
            },
            destroy_hotspot() {
                if (game.currentHotspotContext) {
                    const { locationId, hotspotIndex } = game.currentHotspotContext;
                    const flagId = `hotspot_destroyed_${locationId}_${hotspotIndex}`;
                    game.State.get().flags[flagId] = true;
                    if (game.State.get().gameState === 'EXPLORE') {
                        game.UI.render();
                    }
                } else {
                    console.warn("destroy_hotspot called without a valid hotspot context.");
                }
            },
            enter_location(payload) {
                const gameState = game.State.get();
                gameState.currentLocationId = payload.locationId;
                game.State.setUIMode('EXPLORE');
                const locationName = gameData.locations[payload.locationId]?.name || '未知地点';
                game.UI.log(game.Utils.formatMessage('enterLocation', { locationName: locationName }));
            },
            add_item(payload) {
                Actions.addItemToInventory(payload.itemId, payload.quantity || 1);
            },
            showMap() {
                 Actions.showMap();
            },
            map_transition(payload) {
                const gameState = game.State.get();
                gameState.currentMapId = payload.targetMapId;
                gameState.currentMapNodeId = payload.targetStartNode;
                game.State.setUIMode('MAP');
            },
            advanceTime(payload) {
                return new Promise(resolve => {
                    const time = game.State.get().time;
                    const phasesInDay = gameData.settings.timePhases.length;
                    let phasesToAdvance = 0;
                    if (payload.until === 'next_morning') {
                        phasesToAdvance = (phasesInDay - time.phase);
                        if (phasesToAdvance <= 0) phasesToAdvance += phasesInDay;
                    } else { phasesToAdvance = payload.phases || 1; }
                    time.phase += phasesToAdvance;
                    while(time.phase >= phasesInDay) {
                        time.phase -= phasesInDay;
                        time.day++;
                        game.UI.log(game.Utils.formatMessage('newDay'), "var(--secondary-color)");
                        const daysInMonth = new Date(time.year, time.month, 0).getDate();
                        if(time.day > daysInMonth) {
                            time.day = 1; time.month++;
                            if(time.month > 12) { time.month = 1; time.year++; }
                        }
                    }
                    game.UI.renderTopBar();
                    resolve();
                });
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
                    game.UI.log(log, logColor);
                }
                if (state.gameState === 'MENU' && state.menu.current === 'INVENTORY') {
                    game.UI.render();
                }
            },
            modify_variable({ varId, operation, value, log, logColor }) {
                const state = game.State.get();
                if (!state.variables) state.variables = {}; 
                
                const oldValue = state.variables[varId] || 0;

                switch(operation) {
                    case 'set':
                        state.variables[varId] = value;
                        break;
                    case 'add':
                        state.variables[varId] = oldValue + value;
                        break;
                    case 'subtract':
                        state.variables[varId] = oldValue - value;
                        break;
                    default:
                        console.error(`未知的变量操作: ${operation}`);
                        return;
                }

                if (log) {
                    game.UI.log(log, logColor);
                }
            },
            async acceptJob({ jobId }) {
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
                
                // [修改] 默认的任务完成提示现在由completionActionBlock定义
                // game.UI.log(game.Utils.formatMessage('questCompleted', { questName: jobData.title }), 'var(--primary-color)');
                
                delete gameState.quests[questId];

                if (gameState.gameState === 'MENU' && gameState.menu.current === 'QUESTS') {
                    game.UI.render();
                }
            }
        },
        
        async useItem(index) { 
            const gameState = game.State.get();
            const itemStack = gameState.inventory[index]; 
            const itemData = gameData.items[itemStack.id]; 
            
            if (itemData.onUseActionBlock) {
                await this.executeActionBlock(itemData.onUseActionBlock);
            }

            itemStack.quantity--; 
            if (itemStack.quantity <= 0) gameState.inventory.splice(index, 1); 
            
            game.UI.render(); 
        },

        equipItem(index) { 
            const gameState = game.State.get();
            const i = gameState.inventory[index]; if (!i) return; 
            const d = gameData.items[i.id]; if (!d || !d.slot) return; 
            if (gameState.equipped[d.slot]) { this.unequipItem(d.slot, true); } 
            gameState.equipped[d.slot] = i.id; 
            gameState.inventory.splice(index, 1); 
            game.UI.log(game.Utils.formatMessage('equipItem', { itemName: d.name })); 
            game.State.updateAllStats(false); 
            game.UI.render(); 
        }, 
        unequipItem(slot, internal = false) { 
            const gameState = game.State.get();
            const id = gameState.equipped[slot]; if (!id) return; 
            this.addItemToInventory(id, 1); 
            gameState.equipped[slot] = null; 
            if (!internal) { 
                game.UI.log(game.Utils.formatMessage('unequipItem', { itemName: gameData.items[id].name })); 
                game.State.updateAllStats(false); 
                game.UI.render(); 
            } 
        },
        async dropItem(index) { 
            const gameState = game.State.get();
            const item = gameState.inventory[index];
            const itemData = gameData.items[item.id];
            const choice = await game.UI.showConfirmation({
                title: `确定要丢弃 ${itemData.name} x${item.quantity} 吗？`,
                options: [{text: '丢弃', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]
            });
            if (choice && choice.originalOption && choice.originalOption.value) { 
                gameState.inventory.splice(index, 1); 
                game.UI.render(); 
            } 
        },
        addItemToInventory(id, q = 1) { 
            const gameState = game.State.get();
            const itemData = gameData.items[id];
            if (!itemData) return;

            game.UI.log(game.Utils.formatMessage('getItemLoot', { itemName: itemData.name, quantity: q}), 'var(--success-color)');

            if (itemData.type === 'consumable' || itemData.type === 'material') { 
                const e = gameState.inventory.find(i => i.id === id); 
                if (e) e.quantity += q; 
                else gameState.inventory.push({ id: id, quantity: q }); 
            } else { 
                for (let i = 0; i < q; i++) {
                    gameState.inventory.push({ id: id, quantity: 1 }); 
                }
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
        saveGame(slot) { if (slot) game.SaveLoad.save(slot); }, 
        
        async loadGame(slot) { 
            if (!slot) return;

            if (game.State.get().gameState === 'TITLE') {
                game.SaveLoad.load(slot);
                return;
            }

            const choice = await game.UI.showConfirmation({ 
                title: '确认加载', text: '加载新存档将覆盖当前未保存的进度，确定要继续吗？',
                options: [
                    { text: '加载', value: true, class: 'danger-button' },
                    { text: '取消', value: false, class: 'secondary-action' }
                ]
            });

            if (choice && choice.originalOption && choice.originalOption.value) {
                game.SaveLoad.load(slot);
            }
        }, 
        exportSave(slot) {
            if (!slot) return;
            const savedString = localStorage.getItem(game.SAVE_KEY_PREFIX + slot);
            if (!savedString) {
                game.UI.log(game.Utils.formatMessage('noSaveFile'), "var(--error-color)");
                return;
            }
            try {
                const saveData = JSON.parse(savedString);
                const fileName = `都市回响-存档-${slot}-${saveData.name}-${new Date().toJSON().slice(0,10)}.json`;
                const fileToSave = new Blob([JSON.stringify(saveData, null, 2)], {
                    type: 'application/json'
                });

                const a = document.createElement('a');
                a.href = URL.createObjectURL(fileToSave);
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(a.href); 

                game.UI.log(game.Utils.formatMessage('gameExported', { slot: slot }), 'var(--primary-color)');

            } catch(e) {
                console.error("Export save failed:", e);
                game.UI.log("导出存档失败！", "var(--error-color)");
            }
        },
        async resetGame() { 
            const choice = await game.UI.showConfirmation({
                title: "【危险】确定要删除所有存档并重置游戏吗？",
                options: [{text: '全部删除', value: true, class: 'danger-button'}, {text: '取消', value: false, class: 'secondary-action'}]
            });
            if (choice && choice.originalOption && choice.originalOption.value) { 
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload(); 
            } 
        },
        playerCombatAttack() { game.Combat.playerAttack(); },
        playerCombatDefend() { game.Combat.playerDefend(); },
        playerCombatSkill() { game.UI.log("技能系统将在未来版本实装。"); },
        playerCombatItem() { game.UI.log("道具系统将在未来版本实装。"); },
        playerCombatFlee() { game.Combat.playerFlee(); },
    };
    
    game.Actions = Actions;
})();
