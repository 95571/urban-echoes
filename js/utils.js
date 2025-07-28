/**
 * @file js/utils.js
 * @description 通用工具与条件检查器模块 (v58.4.0 - [终极修复] 重构属性计算流水线)
 * @author Gemini (CTO)
 * @version 58.4.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const ConditionChecker = {
        evaluate(conditions) {
            if (!conditions || conditions.length === 0) return true;
            for (const condition of conditions) {
                const handler = this.conditionHandlers[condition.type];
                if (!handler || !handler(condition)) {
                    return false;
                }
            }
            return true;
        },

        evaluateSingle(condition) {
            const handler = this.conditionHandlers[condition.type];
            return handler ? handler(condition) : false;
        },

        conditionHandlers: {
            time(condition) {
                return condition.allowedPhases.includes(game.State.get().time.phase);
            },
            stat(condition) {
                const state = game.State.get();
                const effectiveStats = state.effectiveStats || state.stats;
                let statValue;

                if (condition.stat in effectiveStats) {
                    statValue = effectiveStats[condition.stat];
                } else if (condition.stat in state) {
                    statValue = state[condition.stat];
                } else {
                    statValue = 0;
                }

                switch (condition.comparison) {
                    case '>':  return statValue > condition.value;
                    case '<':  return statValue < condition.value;
                    case '>=': return statValue >= condition.value;
                    case '<=': return statValue <= condition.value;
                    case '==': return statValue == condition.value;
                    case '!=': return statValue != condition.value;
                    default: return false;
                }
            },
            variable(condition) {
                const varValue = game.State.get().variables[condition.varId] || 0;
                 switch (condition.comparison) {
                    case '>':  return varValue > condition.value;
                    case '<':  return varValue < condition.value;
                    case '>=': return varValue >= condition.value;
                    case '<=': return varValue <= condition.value;
                    case '==': return varValue == condition.value;
                    case '!=': return varValue != condition.value;
                    default: return false;
                }
            },
            has_item(condition) {
                const inventory = game.State.get().inventory;
                const requiredQuantity = condition.quantity || 1;
                let currentQuantity = 0;
                for (const item of inventory) {
                    if (item.id === condition.itemId) {
                        currentQuantity += item.quantity;
                    }
                }
                return currentQuantity >= requiredQuantity;
            }
        }
    };

    const Utils = {
        formatMessage(messageId, context = {}) {
            let message = gameData.systemMessages[messageId];
            if (!message) {
                console.error(`System message with id "${messageId}" not found.`);
                return `[${messageId}]`;
            }
            return message.replace(/\${(.*?)}/g, (match, key) => {
                return context.hasOwnProperty(key) ? context[key] : match;
            });
        },

        evaluateFormula(formula, context) {
            try {
                if (!context) throw new Error("公式计算需要一个上下文对象。");

                const contextKeys = Object.keys(context);
                const contextValues = Object.values(context);
                const floor = Math.floor;
                const safeEval = new Function('floor', ...contextKeys, `return ${formula}`);
                
                const result = safeEval(floor, ...contextValues);
                return isNaN(result) ? 0 : result;

            } catch (e) {
                if (e instanceof ReferenceError) {
                   return 0; // 公式中引用的变量在上下文中不存在，按0处理
                }
                console.error(`公式计算错误: "${formula}"`, e);
                return 0;
            }
        },

        // [核心重构] 属性计算流水线 V6.0 - 终极修正版
        calculateEffectiveStatsForUnit(unit) {
            const effectiveStats = { ...(unit.stats || { str: 0, dex: 0, int: 0, con: 0, lck: 0 }) };
            const coreStatKeys = Object.keys(unit.stats || {});
            const derivedStatKeys = Object.keys(gameData.formulas_primary);

            // --- Pass 1: 计算最终的核心属性 ---
            // a. 基础核心属性
            // b. 装备的基础核心属性
            if (unit.equipped) {
                for (const slotId in unit.equipped) {
                    const item = gameData.items[unit.equipped[slotId]?.itemId];
                    if (item?.effect) {
                        for (const statKey in item.effect) {
                            if (coreStatKeys.includes(statKey)) {
                                effectiveStats[statKey] += item.effect[statKey];
                            }
                        }
                    }
                }
            }
            // c. 技能被动
            game.Perk.applyPassiveEffects(unit, effectiveStats);
            
            // d. Buff系统对核心属性的修正
            if (unit.activeEffects) {
                unit.activeEffects.forEach(effect => {
                    (effect.persistentModifiers || []).forEach(modifier => {
                        if (coreStatKeys.includes(modifier.targetStat)) {
                            const tempContext = { ...unit, ...effectiveStats, ...unit.stats };
                            if (typeof modifier.value === 'number') {
                                effectiveStats[modifier.targetStat] += modifier.value;
                            } else if (typeof modifier.formula === 'string') {
                                effectiveStats[modifier.targetStat] += this.evaluateFormula(modifier.formula, tempContext);
                            }
                        }
                    });
                });
            }
            
            // --- Pass 2: 基于最终的核心属性，构建最终计算上下文 ---
            const finalContext = { ...unit, ...effectiveStats };
            finalContext.variables = game.State.get().variables || {};

            // --- Pass 3: 计算自定义公式变量 ("备菜") ---
            const customFormulas = gameData.formulas?.custom || {};
            for (const key in customFormulas) {
                finalContext[key] = this.evaluateFormula(customFormulas[key], finalContext);
            }
            
            // --- Pass 4: 计算派生属性 ---
            for (const key of derivedStatKeys) {
                effectiveStats[key] = this.evaluateFormula(gameData.formulas_primary[key], finalContext);
            }
            
            // a. 装备对派生属性的修正
            if (unit.equipped) {
                for (const slotId in unit.equipped) {
                    const item = gameData.items[unit.equipped[slotId]?.itemId];
                    if (item?.effect) {
                        for (const statKey in item.effect) {
                            if (derivedStatKeys.includes(statKey)) {
                                effectiveStats[statKey] += item.effect[statKey];
                            }
                        }
                    }
                }
            }

            // b. Buff系统对派生属性的修正
            if (unit.activeEffects) {
                 unit.activeEffects.forEach(effect => {
                    (effect.persistentModifiers || []).forEach(modifier => {
                        if (derivedStatKeys.includes(modifier.targetStat)) {
                             // 使用包含自定义变量的 finalContext
                            const contextForDerived = { ...finalContext, ...effectiveStats };
                            if (typeof modifier.value === 'number') {
                                effectiveStats[modifier.targetStat] += modifier.value;
                            } else if (typeof modifier.formula === 'string') {
                                effectiveStats[modifier.targetStat] += this.evaluateFormula(modifier.formula, contextForDerived);
                            }
                        }
                    });
                });
            }
            
            // 将计算好的自定义变量附加到最终结果上，以便调试器等模块访问
             for (const key in customFormulas) {
                effectiveStats[key] = finalContext[key];
            }


            return effectiveStats;
        }
    };

    game.ConditionChecker = ConditionChecker;
    game.Utils = Utils;

})();