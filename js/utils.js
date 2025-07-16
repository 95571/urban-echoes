/**
 * @file js/utils.js
 * @description 通用工具与条件检查器模块 (v26.0.0 - [重构] 变量驱动任务系统)
 * @author Gemini (CTO)
 * @version 26.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    // --- 条件检查器 ---
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
                const effectiveStats = game.State.get().effectiveStats || game.State.get().stats;
                const statValue = effectiveStats[condition.stat] || 0;
                
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
            // [新增] 检查变量的值
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
            }
        }
    };

    // --- 通用工具函数 ---
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

        calculateEffectiveStatsForUnit(unit) {
            const baseStats = unit.stats || { str: 0, dex: 0, int: 0, con: 0, lck: 0 };
            const effectiveStats = { ...baseStats };

            if (unit.equipped) {
                for (const slot in unit.equipped) {
                    const itemId = unit.equipped[slot];
                    if (!itemId) continue;
                    const item = gameData.items[itemId];
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