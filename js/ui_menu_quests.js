/**
 * @file js/ui_menu_quests.js
 * @description UI模块 - 任务菜单渲染器 (v64.0.0)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const questsScreenRenderer = {
        render(container) {
            container.innerHTML = '';
            const gameState = game.State.get();

            const activeQuestsList = [];
            const completedQuestsList = [];
            const allJobData = { ...gameData.jobs };

            for (const varId in gameState.variables) {
                if (varId.startsWith('q_')) {
                    const questState = gameState.variables[varId];
                    const jobData = Object.values(allJobData).find(j => j.questVariable === varId);
                    if (!jobData) continue;
                    if (questState === 1) activeQuestsList.push(jobData);
                    else if (questState === 2) completedQuestsList.push(jobData);
                }
            }
            
            const createQuestList = (title, quests) => {
                const listEl = createElement('ul', { className: 'quest-list' });
                if (quests.length === 0) {
                    const emptyText = title === '进行中' ? '当前没有进行中的任务。' : '尚未完成任何值得记录的任务。';
                    listEl.appendChild(createElement('li', {}, [
                        createElement('p', { textContent: emptyText, style: { padding: '10px', color: 'var(--text-muted-color)' } })
                    ]));
                } else {
                    quests.forEach(jobData => {
                        const isMainQuest = jobData.isMain ? 'main-quest' : '';
                        const isCompleted = title === '已完成' ? 'completed' : '';
                        const questEntry = createElement('li', {
                            className: `quest-title-entry ${isMainQuest} ${isCompleted}`,
                            textContent: jobData.title,
                            dataset: { jobId: jobData.id },
                            eventListeners: { click: () => game.UI.showQuestDetails(jobData.id) }
                        });
                        listEl.appendChild(questEntry);
                    });
                }
                
                game.UI.makeListDraggable(listEl);

                return createElement('div', { className: 'quest-section' }, [
                    createElement('h4', { className: 'quest-section-header', textContent: title }),
                    listEl
                ]);
            };

            const questContainer = createElement('div', { className: 'quest-container' }, [
                createQuestList('进行中', activeQuestsList),
                createQuestList('已完成', completedQuestsList)
            ]);
            
            container.appendChild(questContainer);
        }
    };

    if (!window.game.UI.menuRenderers) window.game.UI.menuRenderers = {};
    window.game.UI.menuRenderers.QUESTS = questsScreenRenderer.render.bind(questsScreenRenderer);
})();