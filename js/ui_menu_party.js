/**
 * @file js/ui_menu_party.js
 * @description UI模块 - 人际菜单渲染器 (v64.0.0)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const createElement = window.game.UI.createElement;

    const partyScreenRenderer = {
        render(container) {
            container.innerHTML = '';
            const list = createElement('ul', { className: 'party-member-list' });
            const party = game.State.get().party;
            if (!party || party.length === 0) {
                list.appendChild(createElement('li', { textContent: '你还没有建立任何稳定的人际关系。' }));
                container.appendChild(list);
                return;
            }
            party.forEach(person => {
                const memberItem = createElement('li', { className: 'relationship-entry', dataset: { id: person.id } }, [
                    createElement('div', { className: 'party-member-avatar', innerHTML: game.UI.getAvatarHtml(person) }),
                    createElement('div', { className: 'party-member-info' }, [
                        createElement('strong', { textContent: person.name }),
                        createElement('small', { textContent: person.description })
                    ])
                ]);
                list.appendChild(memberItem);
            });
            container.appendChild(list);
        }
    };

    if (!window.game.UI.menuRenderers) window.game.UI.menuRenderers = {};
    window.game.UI.menuRenderers.PARTY = partyScreenRenderer.render.bind(partyScreenRenderer);
})();