/**
 * @file js/effects.js
 * @description 统一效果修正系统 (v55.2.4 - [修复] 修正持续效果的触发与移除时机)
 * @author Gemini (CTO)
 * @version 55.2.4
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

            // 步骤2: 执行周期性效果的第一跳
            if (effectData.onTickActionBlock && effectData.onTickActionBlock.length > 0) {
                await game.Actions.executeActionBlock(effectData.onTickActionBlock, unit);
            }
            
            // [修改] 步骤3: 注册持续性效果，并将持续时间减1，因为第一跳已经触发
            const initialDuration = effectData.duration || 0;
            if (initialDuration > 1) { // 只有在总持续时间大于1时，才有后续的tick
                const existingEffect = unit.activeEffects.find(e => e.id === effectId);
                if (existingEffect) {
                    existingEffect.duration = initialDuration - 1;
                    if (unit.id === 'player') game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `效果 [${effectData.name}] 的持续时间已刷新。`, color: 'var(--skill-color)' });
                } else {
                    const newEffectInstance = {
                        instanceId: nextEffectInstanceId++,
                        id: effectId, name: effectData.name || '未知效果', icon: effectData.icon || '❓',
                        description: effectData.description || '', type: effectData.type || 'buff',
                        duration: initialDuration - 1, // 存入剩余的持续时间
                        isHidden: effectData.isHidden || false,
                        persistentModifiers: effectData.persistentModifiers || [],
                        onTickActionBlock: effectData.onTickActionBlock || []
                    };
                    unit.activeEffects.push(newEffectInstance);
                    if (unit.id === 'player') game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `你获得了效果：[${effectData.name}]`, color: 'var(--log-color-success)' });
                }
            } else if (unit.id === 'player' && !effectData.instantModifiers) {
                 // 如果效果只有1跳，并且没有即时效果，也需要通知UI刷新
                 game.Events.publish(EVENTS.STATE_CHANGED);
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
                if(unit.id === 'player') game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `效果 [${effectData.name}] 已结束。`, color: 'var(--text-muted-color)' });
                unit.activeEffects.splice(index, 1);
                if (unit.id === 'player') {
                    game.State.updateAllStats(false);
                    game.Events.publish(EVENTS.STATE_CHANGED);
                }
            }
        },

        async tick(unit) {
            if (!unit || !unit.activeEffects) return;
            
            // [修复] 采用新的、更精确的tick逻辑
            const effectsToRemove = [];
            const tickActions = [];

            // 1. 收集本轮需要执行的动作
            for (const effect of unit.activeEffects) {
                if (effect.duration > 0 && effect.onTickActionBlock && effect.onTickActionBlock.length > 0) {
                    tickActions.push({ actionBlock: effect.onTickActionBlock, unit: unit, effectInstance: effect });
                }
            }

            // 2. 依次执行所有动作
            for (const item of tickActions) {
                 await game.Actions.executeActionBlock(item.actionBlock, item.unit);
            }

            // 3. 在所有动作执行完毕后，处理倒计时和移除
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
            } else {
                 if (unit.id === 'player' && tickActions.length > 0) {
                     game.Events.publish(EVENTS.STATE_CHANGED);
                 }
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