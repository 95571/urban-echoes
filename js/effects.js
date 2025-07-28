/**
 * @file js/effects.js
 * @description 统一效果修正系统 (v59.1.1 - [修复] 修正事件触发逻辑)
 * @author Gemini (CTO)
 * @version 59.1.1
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    let nextEffectInstanceId = 0;

    function applyInstantModifiersToUnit(unit, modifiers, context = {}) {
        if (!modifiers) return;
        const fullContext = { ...unit, ...unit.effectiveStats, context: context };
        
        for (const stat in modifiers) {
            const value = game.Utils.evaluateFormula(modifiers[stat], fullContext);
            if (typeof value !== 'number' || isNaN(value)) continue;

            if (stat === 'hp') {
                unit.hp = Math.max(0, Math.min(unit.maxHp, (unit.hp || 0) + value));
            } else if (stat === 'mp') {
                unit.mp = Math.max(0, Math.min(unit.maxMp, (unit.mp || 0) + value));
            } else if (unit.stats && stat in unit.stats) {
                unit.stats[stat] = Math.max(1, (unit.stats[stat] || 0) + value);
            } else {
                 unit[stat] = (unit[stat] || 0) + value;
            }
        }
    }

    const TriggerManager = {
        async processEvent(eventName, context) {
            // [修复] 只检查事件的源头单位 (context.source)，而不是所有参与单位
            const unit = context.source;
            if (!unit || !unit.activeEffects || unit.hp <= 0) return;

            for (const effect of [...unit.activeEffects]) {
                if (!effect.triggers) continue;

                for (const trigger of effect.triggers) {
                    if (trigger.event === eventName) {
                        if (game.ConditionChecker.evaluate(trigger.conditions, context)) {
                            // 将 effect 的源单位（持有者）作为目标传入 executeActionBlock
                            await game.Actions.executeActionBlock(trigger.actionBlock, unit, context);
                        }
                    }
                }
            }
        }
    };

    const Effects = {
        init() {
            game.Events.subscribe(EVENTS.TIME_ADVANCED, () => this.tick(game.State.get()));
            
            const combatEvents = [
                EVENTS.COMBAT_ATTACK_START, EVENTS.COMBAT_ATTACK_END,
                EVENTS.COMBAT_TAKE_DAMAGE_START, EVENTS.COMBAT_TAKE_DAMAGE_END,
                EVENTS.COMBAT_DEFEND,
                EVENTS.COMBAT_TURN_START, EVENTS.COMBAT_TURN_END
            ];
            combatEvents.forEach(eventName => {
                game.Events.subscribe(eventName, (context) => TriggerManager.processEvent(eventName, context));
            });
        },

        async add(unit, effectId) {
            const effectData = gameData.effects[effectId];
            if (!effectData) {
                console.error(`[Effects] 试图添加一个不存在的效果: ${effectId}`);
                return;
            }

            if (!unit.activeEffects) unit.activeEffects = [];

            if (effectData.instantModifiers) {
                applyInstantModifiersToUnit(unit, effectData.instantModifiers);
            }

            if (effectData.onApplyActionBlock) {
                 await game.Actions.executeActionBlock(effectData.onApplyActionBlock, unit);
            }
            
            const initialDuration = effectData.duration || 0;

            if (initialDuration !== 0) {
                const existingEffect = unit.activeEffects.find(e => e.id === effectId);
                
                if (existingEffect && effectData.duration !== -1 && effectData.stackable === false) {
                    existingEffect.duration = initialDuration; 
                    if (unit.id === 'player') game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `效果 [${effectData.name}] 的持续时间已刷新。`, color: 'var(--skill-color)' });
                } else { 
                    const newEffectInstance = {
                        instanceId: nextEffectInstanceId++,
                        id: effectId, name: effectData.name || '未知效果', icon: effectData.icon || '❓',
                        description: effectData.description || '', type: effectData.type || 'buff',
                        duration: initialDuration,
                        isHidden: effectData.isHidden || false,
                        persistentModifiers: effectData.persistentModifiers || [],
                        onTickActionBlock: effectData.onTickActionBlock || [],
                        triggers: effectData.triggers || []
                    };
                    unit.activeEffects.push(newEffectInstance);
                    if (unit.id === 'player' && !effectData.isHidden) game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `你获得了效果：[${effectData.name}]`, color: 'var(--log-color-success)' });
                }
            }

            if (unit.id === 'player') {
                game.State.updateAllStats(false);
                game.Events.publish(EVENTS.STATE_CHANGED);
            }
        },
        
        remove(unit, instanceId) {
            if (!unit.activeEffects) return;
            const index = unit.activeEffects.findIndex(e => e.instanceId === instanceId);
            if (index > -1) {
                const effectData = gameData.effects[unit.activeEffects[index].id];
                if(unit.id === 'player' && !effectData.isHidden) game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `效果 [${effectData.name}] 已结束。`, color: 'var(--text-muted-color)' });
                unit.activeEffects.splice(index, 1);
                if (unit.id === 'player') {
                    game.State.updateAllStats(false);
                    game.Events.publish(EVENTS.STATE_CHANGED);
                }
            }
        },
        
        removeById(unit, effectId) {
            if (!unit.activeEffects) return;
            const effectsToRemove = unit.activeEffects.filter(e => e.id === effectId);
            if (effectsToRemove.length > 0) {
                effectsToRemove.forEach(effect => this.remove(unit, effect.instanceId));
            }
        },

        async tick(unit) {
            if (!unit || !unit.activeEffects) return;
            
            for (const effect of [...unit.activeEffects]) {
                 if (effect.onTickActionBlock && effect.onTickActionBlock.length > 0) {
                    await game.Actions.executeActionBlock(effect.onTickActionBlock, unit);
                }
            }

            for (const effect of [...unit.activeEffects]) {
                 if (effect.duration > 0) {
                    effect.duration--;
                    if (effect.duration === 0) {
                        this.remove(unit, effect.instanceId);
                    }
                }
            }
            
            if (unit.id === 'player') {
                 game.Events.publish(EVENTS.STATE_CHANGED);
            }
        },
        
        getStatModifier(unit, stat) {
            let totalModifier = 0;
            if (!unit.activeEffects) return 0;

            unit.activeEffects.forEach(effect => {
                (effect.persistentModifiers || []).forEach(modifier => {
                    if (modifier.targetStat === stat) {
                        const formulaResult = game.Utils.evaluateFormula(modifier.value || modifier.formula, unit);
                        totalModifier += formulaResult;
                    }
                });
            });
            return totalModifier;
        },
        
        applyInstantModifiersToUnit: applyInstantModifiersToUnit
    };
    
    Effects.processEvent = TriggerManager.processEvent;
    
    if (!window.game.Effects) window.game.Effects = {};
    Object.assign(window.game.Effects, Effects);

})();