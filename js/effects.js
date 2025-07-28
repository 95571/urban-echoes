/**
 * @file js/effects.js
 * @description 统一效果修正系统 (v58.0.0 - [重构] 实现公式化动态属性)
 * @author Gemini (CTO)
 * @version 58.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    let nextEffectInstanceId = 0;

    function applyInstantModifiersToUnit(unit, modifiers) {
        if (!modifiers) return;
        for (const stat in modifiers) {
            const value = modifiers[stat];
            if (typeof value !== 'number') continue;

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

    const Effects = {
        init() {
            game.Events.subscribe(EVENTS.TIME_ADVANCED, () => this.tick(game.State.get()));
        },

        async add(unit, effectId) {
            const effectData = gameData.effects[effectId];
            if (!effectData) {
                console.error(`[Effects] 试图添加一个不存在的效果: ${effectId}`);
                return;
            }

            if (!unit.activeEffects) unit.activeEffects = [];

            // 步骤1: 应用即时效果
            if (effectData.instantModifiers) {
                applyInstantModifiersToUnit(unit, effectData.instantModifiers);
            }

            // 步骤2: 执行周期性效果的第一跳 (如果适用)
            if (effectData.onTickActionBlock && effectData.onTickActionBlock.length > 0) {
                await game.Actions.executeActionBlock(effectData.onTickActionBlock, unit);
            }
            
            // 步骤3: 注册持续性效果
            const initialDuration = effectData.duration || 0;
            const remainingDuration = (effectData.onTickActionBlock && initialDuration > 0) ? initialDuration - 1 : initialDuration;

            if (remainingDuration !== 0) { 
                const existingEffect = unit.activeEffects.find(e => e.id === effectId);
                
                if (existingEffect && effectData.duration !== -1) {
                    existingEffect.duration = remainingDuration; 
                    if (unit.id === 'player') game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `效果 [${effectData.name}] 的持续时间已刷新。`, color: 'var(--skill-color)' });
                } else if (!existingEffect || effectData.duration === -1) { 
                    const newEffectInstance = {
                        instanceId: nextEffectInstanceId++,
                        id: effectId, name: effectData.name || '未知效果', icon: effectData.icon || '❓',
                        description: effectData.description || '', type: effectData.type || 'buff',
                        duration: remainingDuration,
                        isHidden: effectData.isHidden || false,
                        persistentModifiers: effectData.persistentModifiers || [],
                        onTickActionBlock: effectData.onTickActionBlock || []
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
            const effectToRemove = unit.activeEffects.find(e => e.id === effectId);
            if (effectToRemove) {
                this.remove(unit, effectToRemove.instanceId);
            }
        },

        async tick(unit) {
            if (!unit || !unit.activeEffects) return;
            
            const effectsToRemove = [];
            const tickActions = [];

            for (const effect of unit.activeEffects) {
                if (effect.duration > 0) {
                     if (effect.onTickActionBlock && effect.onTickActionBlock.length > 0) {
                        tickActions.push({ actionBlock: effect.onTickActionBlock, unit: unit });
                    }
                }
            }

            for (const item of tickActions) {
                 await game.Actions.executeActionBlock(item.actionBlock, item.unit);
            }

            for (const effect of [...unit.activeEffects]) {
                 if (effect.duration > 0) {
                    effect.duration--;
                    if (effect.duration === 0) {
                        effectsToRemove.push(effect.instanceId);
                    }
                }
            }
            
            if (effectsToRemove.length > 0) {
                effectsToRemove.forEach(instanceId => this.remove(unit, instanceId));
            } else if (tickActions.length > 0 && unit.id === 'player') {
                 game.Events.publish(EVENTS.STATE_CHANGED);
            }
        },
        
        getStatModifier(unit, stat) {
            let totalModifier = 0;
            if (!unit.activeEffects) return 0;

            unit.activeEffects.forEach(effect => {
                (effect.persistentModifiers || []).forEach(modifier => {
                    if (modifier.targetStat === stat) {
                        if (typeof modifier.value === 'number') {
                            totalModifier += modifier.value;
                        } 
                        else if (typeof modifier.formula === 'string') {
                            const formulaResult = game.Utils.evaluateFormula(modifier.formula, unit);
                            totalModifier += formulaResult;
                        }
                    }
                });
            });
            return totalModifier;
        },
        
        applyInstantModifiersToUnit: applyInstantModifiersToUnit
    };
    
    if (!window.game.Effects) window.game.Effects = {};
    Object.assign(window.game.Effects, Effects);

})();