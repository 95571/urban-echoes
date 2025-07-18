/**
 * @file js/utils.js
 * @description 通用工具与条件检查器模块 (v35.0.0 - [引擎] 适配最终版扁平化装备结构)
 * @author Gemini (CTO)
 * @version 35.0.0
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

        // [修改] 核心属性计算函数，适配最终的扁平化装备结构
        calculateEffectiveStatsForUnit(unit) {
            const baseStats = unit.stats || { str: 0, dex: 0, int: 0, con: 0, lck: 0 };
            const effectiveStats = { ...baseStats };

            if (unit.equipped) {
                // 直接遍历扁平化的装备槽位
                for (const slotId in unit.equipped) {
                    const slot = unit.equipped[slotId];
                    if (!slot || !slot.itemId) continue;
                    
                    const item = gameData.items[slot.itemId];
                    if (item && item.effect) {
                        for (const stat in item.effect) {
                            effectiveStats[stat] = (effectiveStats[stat] || 0) + item.effect[stat];
                        }
                    }
                }
            }
            
            game.Perk.applyPassiveEffects(unit, effectiveStats);
            
            for (const statKey in gameData.formulas_primary) {
                effectiveStats[statKey] = this.evaluateFormula(gameData.formulas_primary[statKey], effectiveStats);
            }

            return effectiveStats;
        },
    };

    game.ConditionChecker = ConditionChecker;
    game.Utils = Utils;

})();