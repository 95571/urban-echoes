/**
 * @file js/utils.js
 * @description 通用工具与条件检查器模块 (v40.1.0 - [修复] 修正派生属性的计算顺序)
 * @author Gemini (CTO)
 * @version 40.1.0
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
            flag(condition) {
                return game.State.get().flags[condition.flagId] === condition.value;
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
        evaluateFormula(formula, stats) {
            try {
                if (!stats) { throw new Error("Stats object is undefined or null."); }
                const statNames = Object.keys(stats);
                const statValues = Object.values(stats);
                const floor = Math.floor;
                const safeEval = new Function('floor', ...statNames, `return ${formula}`);
                return safeEval(floor, ...statValues);
            } catch (e) { console.error(`公式计算错误: "${formula}"`, e); return 0; }
        },

        // [修复] 调整属性计算顺序，确保派生属性加成能正确生效
        calculateEffectiveStatsForUnit(unit) {
            // 步骤1: 初始属性 = 基础核心属性
            const baseStats = unit.stats || { str: 0, dex: 0, int: 0, con: 0, lck: 0 };
            const effectiveStats = { ...baseStats };

            // 步骤2: 计算并累加所有来源的核心属性加成 (目前只有装备)
            if (unit.equipped) {
                for (const slotId in unit.equipped) {
                    const slot = unit.equipped[slotId];
                    if (!slot || !slot.itemId) continue;
                    
                    const item = gameData.items[slot.itemId];
                    if (item && item.effect) {
                        for (const stat in item.effect) {
                            // 只累加核心属性，派生属性暂时不处理
                            if (stat in baseStats) {
                                effectiveStats[stat] = (effectiveStats[stat] || 0) + item.effect[stat];
                            }
                        }
                    }
                }
            }
            
            // 步骤3: 应用专长等带来的核心属性被动加成
            game.Perk.applyPassiveEffects(unit, effectiveStats);
            
            // 步骤4: 基于最终的核心属性，计算派生属性的基础值
            for (const statKey in gameData.formulas_primary) {
                effectiveStats[statKey] = this.evaluateFormula(gameData.formulas_primary[statKey], effectiveStats);
            }

            // 步骤5: 最后，累加所有来源的派生属性加成 (例如木剑的+2攻击)
            if (unit.equipped) {
                for (const slotId in unit.equipped) {
                    const slot = unit.equipped[slotId];
                    if (!slot || !slot.itemId) continue;
                    
                    const item = gameData.items[slot.itemId];
                    if (item && item.effect) {
                        for (const stat in item.effect) {
                             // 只累加派生属性，因为核心属性已在步骤2处理完毕
                            if (!(stat in baseStats)) {
                                effectiveStats[stat] = (effectiveStats[stat] || 0) + item.effect[stat];
                            }
                        }
                    }
                }
            }

            return effectiveStats;
        },
    };

    game.ConditionChecker = ConditionChecker;
    game.Utils = Utils;

})();