/**
 * @file js/ui_menus.js
 * @description UI模块 - 菜单渲染器 (v41.1.0 - [修复] 统一物品与装备列表的结构和点击逻辑)
 * @author Gemini (CTO)
 * @version 41.1.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const menuRenderers = {
        STATUS(container) {
            const gameState = game.State.get();
            if (gameState.menu.skillDetailView) { 
                this.renderSkillDetail(container, gameState.menu.skillDetailView); 
                return; 
            }
            const targetId = gameState.menu.statusViewTargetId;
            const isPlayer = !targetId;
            const unit = isPlayer ? gameState : gameState.party.find(p => p.id === targetId);
            if (!unit) { 
                container.innerHTML = `<p>错误：找不到要查看的角色。</p><button class="back-button" data-action="backToPartyScreen">返回</button>`; 
                return; 
            }
            
            const effectiveStats = isPlayer ? unit.effectiveStats : game.Utils.calculateEffectiveStatsForUnit(unit);
            
            container.innerHTML = `
                ${!isPlayer ? `<button class="back-button" data-action="backToPartyScreen">返回人际关系</button>`: ''}
                <div class="status-avatar-area" id="status-avatar"></div>
                <div class="status-header">
                    <h3 id="status-name"></h3>
                    <p id="status-desc" style="padding: 0 10px; line-height:1.6;"></p>
                </div>
                <div id="player-only-sections"></div>
            `;
            document.getElementById('status-avatar').innerHTML = game.UI.getAvatarHtml(unit);
            document.getElementById('status-name').textContent = unit.name;
            
            if (isPlayer) {
                document.getElementById('status-desc').textContent = '一个刚踏入社会的毕业生，未来充满无限可能。';
                const playerSectionsContainer = document.getElementById('player-only-sections');
                playerSectionsContainer.innerHTML = `
                    <div class="status-section"><h4>核心属性</h4><ul class="stat-list core-stats" id="core-stats-list"></ul></div>
                    <div class="status-section"><h4>派生属性</h4><ul class="stat-list" id="combat-stats-list"></ul></div>
                    <div class="status-section" id="perks-section"></div>
                    <div class="status-section" id="skill-proficiency-section"></div>
                `;
                
                const coreStatsList = document.getElementById('core-stats-list');
                coreStatsList.innerHTML = '';
                Object.entries({ str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运' }).forEach(([key, name]) => {
                    coreStatsList.appendChild(game.UI.createFromTemplate('template-core-stat-item', { 'stat-name': `${gameData.icons[key]} ${name}`, 'stat-value': effectiveStats[key] }));
                });
                
                const combatStatsList = document.getElementById('combat-stats-list');
                combatStatsList.innerHTML = '';
                [ 
                    { name: `${gameData.icons.health} 健康上限`, value: effectiveStats.maxHp }, 
                    { name: `${gameData.icons.energy} 精力上限`, value: effectiveStats.maxMp }, 
                    { name: `${gameData.icons.attack} 攻击`, value: effectiveStats.attack }, 
                    { name: `${gameData.icons.defense} 防御`, value: effectiveStats.defense }, 
                    { name: `${gameData.icons.spd} 行动力`, value: effectiveStats.spd } 
                ].forEach(stat => {
                    combatStatsList.appendChild(game.UI.createFromTemplate('template-derived-stat-item', { 'stat-name': stat.name, 'stat-value': stat.value }));
                });
                
                this.renderPerksList(unit, document.getElementById('perks-section'));
                this.renderSkillList(unit, document.getElementById('skill-proficiency-section'));
            } else {
                document.getElementById('status-desc').textContent = unit.description || "暂无更多信息。";
            }
        },

        renderPerksList(unit, container){ 
            container.innerHTML = `<h4>已掌握专长</h4><ul class="stat-list perks-list"></ul>`; 
            const list = container.querySelector('ul'); 
            let hasPerks = false; 
            if(unit.skillState) { 
                for(const skillId in unit.skillState){ 
                    const skillState = unit.skillState[skillId]; 
                    if (skillState.unlockedPerks.length > 0) hasPerks = true; 
                    skillState.unlockedPerks.forEach(perkId => { 
                        const perkData = gameData.perkLibrary[perkId]; 
                        if(!perkData) return; 
                        const clone = game.UI.createFromTemplate('template-perk-item', { 'perk-name': perkData.name }); 
                        clone.querySelector('li').title = perkData.description; 
                        list.appendChild(clone); 
                    }); 
                } 
            } 
            if (!hasPerks) list.innerHTML = '<li>尚未掌握任何专长。</li>'; 
        },

        renderSkillList(unit, container) { 
            container.innerHTML = `<h4>技能熟练度</h4><div class="skill-grid-container"></div>`; 
            const grid = container.querySelector('.skill-grid-container'); 
            const skillState = unit.skillState; 
            if (!skillState || Object.keys(skillState).length === 0) { 
                grid.innerHTML = '<p>尚未学习任何技能。</p>'; 
                return; 
            } 
            for (const skillId in skillState) { 
                const state = skillState[skillId]; 
                const data = gameData.skillLibrary[skillId]; 
                if (!data) continue; 
                const requiredProf = game.Proficiency.getRequiredForLevel(skillId, state.level + 1); 
                const progressPercent = requiredProf > 0 && requiredProf !== Infinity ? Math.min(100, (state.proficiency / requiredProf) * 100) : (state.level >= 100 ? 100 : 0); 
                const clone = game.UI.createFromTemplate('template-skill-proficiency-item', { 'skill-name': data.name, 'skill-level': `Lv. ${state.level}` }); 
                const entry = clone.querySelector('.skill-list-entry'); 
                entry.dataset.id = skillId; 
                clone.querySelector('.proficiency-bar').title = `熟练度: ${state.level >= 100 ? 'MAX' : `${state.proficiency} / ${requiredProf}`}`; 
                clone.querySelector('.proficiency-bar-fill').style.width = `${progressPercent}%`; 
                grid.appendChild(clone); 
            } 
        },

        renderSkillDetail(container, skillId) { 
            const gameState = game.State.get(); 
            const skillData = gameData.skillLibrary[skillId]; 
            const skillState = gameState.skillState[skillId]; 
            if (!skillData || !skillState) { 
                container.innerHTML = `<p>无法找到技能详情。</p>`; 
                return; 
            } 
            let perksByTier = {}; 
            if (skillData.perkTree) { 
                for (const level in skillData.perkTree) { 
                    skillData.perkTree[level].forEach(perkId => { 
                        if (!perksByTier[level]) perksByTier[level] = []; 
                        perksByTier[level].push(perkId); 
                    }); 
                } 
            } 
            let perkTreeHtml = '<div class="perk-tree-container">'; 
            for (const level of Object.keys(perksByTier).sort((a,b) => a-b)) { 
                perkTreeHtml += `<div class="perk-tier"><h4 class="perk-tier-header">等级 ${level} 自动解锁</h4><div class="perk-nodes-list">`; 
                perksByTier[level].forEach(perkId => { 
                    const perkData = gameData.perkLibrary[perkId]; 
                    const isLearned = skillState.unlockedPerks.includes(perkId); 
                    perkTreeHtml += `<div class="perk-node"><div class="perk-node-icon">✨</div><div class="perk-node-info"><strong>${perkData.name}</strong><small>${perkData.description}</small></div>${isLearned ? '<span style="color:var(--success-color); grid-column: 1 / -1; font-weight:bold; font-size: 0.9em; margin-top: 5px;">✓ 已掌握</span>' : ''}</div>`; 
                }); 
                perkTreeHtml += `</div></div>`; 
            } 
            perkTreeHtml += '</div>'; 
            container.innerHTML = `<button class="back-button" data-action="viewSkillDetail" data-id="">返回状态页</button><div style="text-align: center; margin: 1rem 0;"><h3>${skillData.name} - 专长树</h3><p>${skillData.description}</p></div>${perkTreeHtml}`; 
        },

        INVENTORY(container) {
            const gameState = game.State.get();
            let equippedHtml = '<h4>装备中</h4><ul id="equipped-list" class="menu-list">';
            for (const slotId in gameState.equipped) {
                const slot = gameState.equipped[slotId];
                const item = slot.itemId ? gameData.items[slot.itemId] : null;
                
                // [修复] 统一使用标准的列表项结构
                const itemDetailsHtml = item
                    ? `<div class="inventory-item-entry" data-item-id="${slot.itemId}"><span>${slot.name}</span><span class="equipped-item-name">${item.name}</span></div>`
                    : `<div class="inventory-item-entry"><span>${slot.name}</span><span>[空]</span></div>`;
                
                const unequipButton = item ? `<button data-action="unequipItem" data-slot="${slotId}">卸下</button>` : '';

                equippedHtml += `
                    <li>
                        ${itemDetailsHtml}
                        <div class="item-actions">
                           ${unequipButton}
                        </div>
                    </li>
                `;
            }
            equippedHtml += `</ul>`;

            const filters = ['全部', '装备', '消耗品', '材料', '重要'];
            const currentFilter = gameState.menu.inventoryFilter || '全部';
            let filterHtml = '<div class="inventory-filter-tabs">';
            filters.forEach(filter => {
                const isActive = filter === currentFilter;
                filterHtml += `<button class="inventory-filter-tab ${isActive ? 'active' : ''}" data-filter="${filter}">${filter}</button>`;
            });
            filterHtml += '</div>';

            container.innerHTML = `${equippedHtml}<h4>背包</h4>${filterHtml}<ul id="inventory-list" class="menu-list"></ul>`;
            
            const inventoryList = container.querySelector('#inventory-list');
            const filteredInventory = gameState.inventory.map((item, index) => ({...item, originalIndex: index})).filter(item => {
                const itemData = gameData.items[item.id];
                if (!itemData) return false;
                switch (currentFilter) {
                    case '装备': return !!itemData.slot;
                    case '消耗品': return itemData.type === 'consumable';
                    case '材料': return itemData.type === 'material';
                    case '重要': return itemData.droppable === false;
                    case '全部': default: return true;
                }
            });
            
            inventoryList.innerHTML = '';
            if (filteredInventory && filteredInventory.length > 0) {
                 filteredInventory.forEach(item => {
                    const itemData = gameData.items[item.id];
                    const clone = game.UI.createFromTemplate('template-inventory-item', { 'item-name-quantity': `${itemData.name} x${item.quantity}` });
                    
                    const entry = clone.querySelector('.inventory-item-entry');
                    entry.dataset.index = item.originalIndex;

                    const actionsContainer = clone.querySelector('.item-actions');
                    
                    if (itemData.type === 'consumable') {
                        const useButton = document.createElement('button');
                        useButton.textContent = '使用';
                        useButton.dataset.action = 'useItem';
                        useButton.dataset.index = item.originalIndex;
                        actionsContainer.appendChild(useButton);
                    }
                    if (itemData.slot) { 
                        const equipButton = document.createElement('button');
                        equipButton.textContent = '装备';
                        equipButton.dataset.action = 'equipItem';
                        equipButton.dataset.index = item.originalIndex;
                        actionsContainer.appendChild(equipButton);
                    }
                    
                    const dropButton = document.createElement('button');
                    dropButton.textContent = '丢弃';
                    dropButton.className = 'danger-button';
                    dropButton.dataset.action = 'dropItem';
                    dropButton.dataset.index = item.originalIndex;
                    actionsContainer.appendChild(dropButton);
                    
                    inventoryList.appendChild(clone);
                });
            }
        },

        QUESTS(container) {
            const gameState = game.State.get();
            container.innerHTML = `
                <div class="quest-container">
                    <div class="quest-section">
                        <h4 class="quest-section-header">进行中</h4>
                        <ul class="quest-list" id="active-quests-list"></ul>
                    </div>
                    <div class="quest-section">
                        <h4 class="quest-section-header">已完成</h4>
                        <ul class="quest-list" id="completed-quests-list"></ul>
                    </div>
                </div>
            `;

            const activeQuestsList = [];
            const completedQuestsList = [];
            const allJobData = { ...gameData.jobs }; 

            for (const varId in gameState.variables) {
                if (varId.startsWith('q_')) {
                    const questState = gameState.variables[varId];
                    const jobData = Object.values(allJobData).find(j => j.questVariable === varId);
                    if (!jobData) continue;

                    if (questState === 1) { 
                        activeQuestsList.push(jobData);
                    } else if (questState === 2) {
                        completedQuestsList.push(jobData);
                    }
                }
            }

            const activeListEl = container.querySelector('#active-quests-list');
            const completedListEl = container.querySelector('#completed-quests-list');

            activeListEl.innerHTML = '';
            if (activeQuestsList.length === 0) {
                activeListEl.innerHTML = '<li><p style="padding: 10px; color: var(--text-muted-color);">当前没有进行中的任务。</p></li>';
            } else {
                activeQuestsList.forEach(jobData => {
                    activeListEl.innerHTML += `<li class="quest-title-entry" data-job-id="${jobData.id}">${jobData.title}</li>`;
                });
            }

            completedListEl.innerHTML = '';
            if (completedQuestsList.length === 0) {
                completedListEl.innerHTML = '<li><p style="padding: 10px; color: var(--text-muted-color);">尚未完成任何值得记录的任务。</p></li>';
            } else {
                completedQuestsList.forEach(jobData => {
                    completedListEl.innerHTML += `<li class="quest-title-entry completed" data-job-id="${jobData.id}">${jobData.title}</li>`;
                });
            }
            
            container.querySelectorAll('.quest-title-entry').forEach(el => {
                el.onclick = () => {
                    const jobId = el.dataset.jobId;
                    if (jobId) {
                        game.UI.showQuestDetails(jobId);
                    }
                };
            });

            game.UI.ModalManager.makeListDraggable(activeListEl);
            game.UI.ModalManager.makeListDraggable(completedListEl);
        },

        PARTY(container) { 
            const gameState = game.State.get(); 
            container.innerHTML = `<ul class="party-member-list"></ul>`; 
            const list = container.querySelector('ul'); 
            if (!gameState.party || gameState.party.length === 0) { 
                list.innerHTML = '<li>你还没有建立任何稳定的人际关系。</li>'; 
                return; 
            } 
            gameState.party.forEach(person => { 
                const clone = game.UI.createFromTemplate('template-party-member-item', { 'member-name': person.name, 'member-desc': person.description }); 
                const entry = clone.querySelector('.relationship-entry'); 
                entry.dataset.id = person.id; 
                clone.querySelector('.party-member-avatar').innerHTML = game.UI.getAvatarHtml(person); 
                list.appendChild(clone); 
            }); 
        },

        SYSTEM(container) { 
            const otherActionsHtml = `
                <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 10px;">
                    <button data-action="exitToTitle" style="width: 100%;">回到开始界面</button>
                    <button class="danger-button" data-action="resetGame" style="width: 100%;">删除所有数据并重置游戏</button>
                </div>`; 
            container.innerHTML = `<h4>存档管理</h4><div id="system-save-slots"></div>${otherActionsHtml}`; 
            const listContainer = container.querySelector('#system-save-slots'); 
            const meta = game.SaveLoad.getMeta(); 
            let slotsHtml = '<ul class="save-slot-list">'; 
            Array.from({ length: game.NUM_SAVE_SLOTS }, (_, i) => i + 1).forEach(slot => { 
                const slotData = meta[slot]; 
                const info = slotData ? `${slotData.name} - ${slotData.time}` : '[空]'; 
                let buttonsHtml = `<button data-action="saveGame" data-slot="${slot}" title="保存">${gameData.icons.save}</button>`; 
                if (slotData) { 
                    buttonsHtml += `<button data-action="loadGame" data-slot="${slot}" title="读取">${gameData.icons.load}</button>`; 
                    buttonsHtml += `<button data-action="exportSave" data-slot="${slot}" title="导出">${gameData.icons.export}</button>`; 
                } 
                buttonsHtml += `<button data-action="importSave" data-slot="${slot}" title="导入">${gameData.icons.import}</button>`; 
                slotsHtml += `<li><div><strong>存档 ${slot}</strong><small>${info}</small></div><div class="item-actions">${buttonsHtml}</div></li>`; 
            }); 
            slotsHtml += '</ul>'; 
            listContainer.innerHTML = slotsHtml; 
        }
    };

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.menuRenderers = menuRenderers;

})();