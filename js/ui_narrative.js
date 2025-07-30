/**
 * @file js/ui_narrative.js
 * @description UI模块 - 叙事UI管理器 (v63.0.0 - [重构] 从ui_modals.js拆分)
 * @author Gemini (CTO)
 * @version 63.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;
    const createElement = window.game.UI.createElement;

    const NarrativeManager = {
        init() {
            const dom = game.dom;
            // [修复] 由于DOM结构在逻辑上被移动，重新定义查找范围
            const narrativeUI = dom["narrative-ui"];
            if (!narrativeUI) return;
            narrativeUI.innerHTML = `<div id="narrative-options"></div><div class="narrative-wrapper"><div id="narrative-avatar"></div><div id="narrative-box"><div id="narrative-name"></div><div id="narrative-text"></div><div id="narrative-continue-indicator" class="hidden">▼</div></div></div>`;
            
            const ids = [ "narrative-avatar", "narrative-box", "narrative-name", "narrative-text", "narrative-continue-indicator", "narrative-options" ];
            ids.forEach(id => dom[id] = document.getElementById(id));
        },
        show(initialDialogueId) {
            return new Promise(resolve => {
                const initialNode = gameData.dialogues[initialDialogueId];
                if (!initialNode) {
                    console.error(`[NarrativeManager] Dialogue with ID "${initialDialogueId}" not found.`);
                    resolve({ value: false, error: 'Dialogue not found' });
                    return;
                }
                game.narrativeContext = { currentNode: initialNode, currentSegmentIndex: 0, resolve, isWaitingForChoice: false };
                this.toggleUiElements(true);
                game.Events.publish(EVENTS.UI_RENDER_BOTTOM_NAV);
                const ui = game.dom["narrative-ui"];
                ui.classList.remove('hidden');
                setTimeout(() => ui.classList.add('visible'), 10);
                this.showNextSegment();
            });
        },
        hide() {
            if (!game.narrativeContext) return;
            clearTimeout(game.UI.typewriterTimeout);
            game.UI.isTyping = false;
            const ui = game.dom["narrative-ui"];
            ui.classList.remove('visible');
            this.toggleUiElements(false);
            setTimeout(() => {
                ui.classList.add('hidden');
                game.narrativeContext = null;
                game.Events.publish(EVENTS.UI_RENDER);
            }, 400); 
        },
        toggleUiElements(isNarrativeActive) {
            const dom = game.dom;
            ['left-panel', 'main-content', 'bottom-nav'].forEach(id => dom[id]?.classList.toggle('dimmed', isNarrativeActive));
            dom.screen.querySelectorAll('.hotspot-card, .sparkle-hotspot, .hotspot-arrow').forEach(el => {
                el.style.opacity = isNarrativeActive ? '0' : '1';
                el.style.pointerEvents = isNarrativeActive ? 'none' : 'all';
            });
            if (gameData.settings.narrativeUiSceneBlur) {
                const mapArea = dom.screen.querySelector('.map-area');
                if (mapArea) {
                    mapArea.style.transition = 'filter 0.3s ease-in-out';
                    mapArea.style.filter = isNarrativeActive ? 'blur(3px)' : 'none';
                }
            }
        },
        showNextSegment() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            if (game.UI.isTyping) {
                clearTimeout(game.UI.typewriterTimeout);
                game.UI.isTyping = false;
                const segment = ctx.currentNode.dialogueText[ctx.currentSegmentIndex - 1];
                game.dom["narrative-text"].innerHTML = segment.text.replace(/\n/g, '<br>');
                this.onSegmentComplete();
                return;
            }
            if (ctx.isWaitingForChoice) return;
            const dialogueText = ctx.currentNode.dialogueText;
            const hasDialogue = Array.isArray(dialogueText) && dialogueText.length > 0;
            if (!hasDialogue || ctx.currentSegmentIndex >= dialogueText.length) {
                this.showOptions();
                if (!hasDialogue) {
                    const defaultAvatar = game.State.get().currentLocationId ? gameData.locations[game.State.get().currentLocationId].imageUrl || 'images/player_dialogue.png' : 'images/player_dialogue.png';
                    this.updateAvatar(defaultAvatar, '');
                    game.dom["narrative-text"].innerHTML = '';
                }
                return;
            }
            const segment = dialogueText[ctx.currentSegmentIndex];
            ctx.currentSegmentIndex++;
            this.updateAvatar(segment.avatar, segment.name);
            game.dom["narrative-continue-indicator"].classList.add('hidden');
            game.UI.typewriter(game.dom["narrative-text"], segment.text.replace(/\n/g, '<br>'), () => this.onSegmentComplete());
        },
        onSegmentComplete() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            const hasMoreSegments = ctx.currentNode.dialogueText && ctx.currentSegmentIndex < ctx.currentNode.dialogueText.length;
            if (hasMoreSegments) {
                game.dom["narrative-continue-indicator"].classList.remove('hidden');
            } else {
                this.showOptions();
            }
        },
        updateAvatar(imageUrl, name) {
            const dom = game.dom;
            dom["narrative-avatar"].style.backgroundImage = `url('${imageUrl || game.DEFAULT_AVATAR_FALLBACK_IMAGE}')`;
            dom["narrative-name"].textContent = name || '';
            dom["narrative-name"].style.display = name ? 'block' : 'none';
        },
        showOptions() {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            ctx.isWaitingForChoice = true;
            game.dom["narrative-continue-indicator"].classList.add('hidden');
            game.dom["narrative-box"].style.cursor = 'default';
            const options = ctx.currentNode.options || [];
            const availableOptions = options.filter(opt => game.ConditionChecker.evaluate(opt.conditions));
            if (availableOptions.length === 0) {
                ctx.resolve({ value: true });
                this.hide();
                return;
            }
            const optionsContainer = game.dom["narrative-options"];
            optionsContainer.innerHTML = '';
            availableOptions.forEach((opt, index) => {
                const btn = createElement('button', {
                    textContent: opt.text,
                    className: opt.class || '',
                    dataset: { index: index },
                    eventListeners: { click: async (e) => { e.stopPropagation(); await this.handleChoice(opt); } }
                });
                optionsContainer.appendChild(btn);
            });
        },
        async handleChoice(chosenOption) {
            const ctx = game.narrativeContext;
            if (!ctx) return;
            game.dom["narrative-options"].innerHTML = '';
            if (chosenOption.actionBlock) {
                await game.Actions.executeActionBlock(chosenOption.actionBlock);
            }
            if (chosenOption.transitionTo) {
                const nextNode = gameData.dialogues[chosenOption.transitionTo];
                if (nextNode) {
                    ctx.currentNode = nextNode;
                    ctx.currentSegmentIndex = 0;
                    ctx.isWaitingForChoice = false;
                    game.dom["narrative-box"].style.cursor = 'pointer';
                    this.showNextSegment();
                } else {
                    console.error(`[NarrativeManager] Transition failed: Dialogue node "${chosenOption.transitionTo}" not found.`);
                    ctx.resolve({ value: false, error: 'Transition failed' });
                    this.hide();
                }
            } else if (chosenOption.subDialogue) {
                this.hide();
                setTimeout(() => {
                    const sub = chosenOption.subDialogue;
                    if (sub.type === 'job_board') game.UI.showJobBoard(sub.payload);
                    else game.UI.showCustomModal(sub.payload);
                }, 400);
            } else {
                ctx.resolve({ value: chosenOption.value, originalOption: chosenOption });
                this.hide();
            }
        }
    };

    if (!window.game.UI) window.game.UI = {};
    window.game.UI.NarrativeManager = NarrativeManager;

})();