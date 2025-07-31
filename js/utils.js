/**
 * @file js/utils.js
 * @description 通用工具与条件检查器模块 (v80.0.0 - [动画] 新增寻路算法)
 * @author Gemini (CTO)
 * @version 80.0.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    const ConditionChecker = {
        evaluate(conditions, context = {}) {
            if (!conditions || conditions.length === 0) return true;
            for (const condition of conditions) {
                const fullContext = { ...game.State.get(), ...context };
                const handler = this.conditionHandlers[condition.type];
                if (!handler || !handler(condition, fullContext)) {
                    return false;
                }
            }
            return true;
        },

        evaluateSingle(condition, context = {}) {
            const fullContext = { ...game.State.get(), ...context };
            const handler = this.conditionHandlers[condition.type];
            return handler ? handler(condition, fullContext) : false;
        },

        conditionHandlers: {
            time(condition, context) {
                return condition.allowedPhases.includes(context.time.phase);
            },
            stat(condition, context) {
                const effectiveStats = context.effectiveStats || context.stats;
                let statValue;

                if (condition.stat in effectiveStats) {
                    statValue = effectiveStats[condition.stat];
                } else if (condition.stat in context) {
                    statValue = context[condition.stat];
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
            variable(condition, context) {
                const varValue = context.variables[condition.varId] || 0;
                let compareToValue;

                if (typeof condition.value === 'string' && condition.value.startsWith('variables.')) {
                    const targetVarId = condition.value.substring(10);
                    compareToValue = context.variables[targetVarId] || 0;
                } else {
                    compareToValue = condition.value;
                }

                 switch (condition.comparison) {
                    case '>':  return varValue > compareToValue;
                    case '<':  return varValue < compareToValue;
                    case '>=': return varValue >= compareToValue;
                    case '<=': return varValue <= compareToValue;
                    case '==': return varValue == compareToValue;
                    case '!=': return varValue != compareToValue;
                    default: return false;
                }
            },
            has_item(condition, context) {
                const inventory = context.inventory;
                const requiredQuantity = condition.quantity || 1;
                let currentQuantity = 0;
                for (const item of inventory) {
                    if (item.id === condition.itemId) {
                        currentQuantity += item.quantity;
                    }
                }
                return currentQuantity >= requiredQuantity;
            },
            random(condition) {
                const chance = condition.chance || 0;
                return (Math.random() * 100) < chance;
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
            if (typeof formula === 'number') {
                return formula;
            }
            if (typeof formula !== 'string') {
                console.warn(`evaluateFormula expects a string or number, but got ${typeof formula}. Returning 0.`);
                return 0;
            }

            try {
                if (!context) throw new Error("公式计算需要一个上下文对象。");

                const flatContext = { ...context, ...(context.context || {}) };
                const contextKeys = Object.keys(flatContext);
                const contextValues = Object.values(flatContext);
                const floor = Math.floor;
                const ceil = Math.ceil;
                const round = Math.round;
                const random = Math.random;

                const safeEval = new Function('floor', 'ceil', 'round', 'random', ...contextKeys, `return ${formula}`);
                const result = safeEval(floor, ceil, round, random, ...contextValues);
                return isNaN(result) ? 0 : result;

            } catch (e) {
                if (e instanceof ReferenceError) {
                   return 0;
                }
                console.error(`公式计算错误: "${formula}"`, e);
                return 0;
            }
        },

        calculateEffectiveStatsForUnit(unit) {
            const effectiveStats = { ...(unit.stats || { str: 0, dex: 0, int: 0, con: 0, lck: 0 }) };
            const coreStatKeys = Object.keys(unit.stats || {});
            const derivedStatKeys = Object.keys(gameData.formulas_primary);

            // Pass 1: Core stats
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
            game.Perk.applyPassiveEffects(unit, effectiveStats);

            if (unit.activeEffects) {
                unit.activeEffects.forEach(effect => {
                    (effect.persistentModifiers || []).forEach(modifier => {
                        if (coreStatKeys.includes(modifier.targetStat)) {
                            const tempContext = { ...unit, ...effectiveStats, ...unit.stats };
                            effectiveStats[modifier.targetStat] += this.evaluateFormula(modifier.value || modifier.formula, tempContext);
                        }
                    });
                });
            }

            // Pass 2: Build final context
            const finalContext = { ...unit, ...effectiveStats };
            finalContext.variables = game.State.get().variables || {};
            finalContext.skillLevel = (skillId) => (game.State.get()?.skillState?.[skillId]?.level || 0);

            // Pass 3: Custom formulas
            const customFormulas = gameData.formulas?.custom || {};
            for (const key in customFormulas) {
                finalContext[key] = this.evaluateFormula(customFormulas[key], finalContext);
            }

            // Pass 4: Derived stats
            for (const key of derivedStatKeys) {
                effectiveStats[key] = this.evaluateFormula(gameData.formulas_primary[key], finalContext);
            }

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

            if (unit.activeEffects) {
                 unit.activeEffects.forEach(effect => {
                    (effect.persistentModifiers || []).forEach(modifier => {
                        if (derivedStatKeys.includes(modifier.targetStat)) {
                            const contextForDerived = { ...finalContext, ...effectiveStats };
                            effectiveStats[modifier.targetStat] += this.evaluateFormula(modifier.value || modifier.formula, contextForDerived);
                        }
                    });
                });
            }

            // Pass 5: Final rounding
            for (const key of derivedStatKeys) {
                if (typeof effectiveStats[key] === 'number') {
                    effectiveStats[key] = Math.floor(effectiveStats[key]);
                }
            }

            for (const key in customFormulas) {
                effectiveStats[key] = finalContext[key];
            }

            return effectiveStats;
        },

        // [核心新增] 使用广度优先搜索(BFS)算法寻找地图节点间的最短路径
        findShortestPath(mapId, startNodeId, endNodeId) {
            const mapData = gameData.maps[mapId];
            if (!mapData || !mapData.nodes[startNodeId] || !mapData.nodes[endNodeId]) {
                return null; // 无效输入
            }
            if (startNodeId === endNodeId) return [startNodeId];

            const adj = {}; // 邻接表
            for (const nodeId in mapData.nodes) {
                adj[nodeId] = [];
            }
            mapData.connections.forEach(([a, b]) => {
                adj[a].push(b);
                adj[b].push(a);
            });

            const queue = [startNodeId];
            const visited = { [startNodeId]: true };
            const parent = { [startNodeId]: null };

            while (queue.length > 0) {
                const currentNode = queue.shift();
                if (currentNode === endNodeId) {
                    // 找到了，回溯路径
                    const path = [];
                    let curr = endNodeId;
                    while (curr !== null) {
                        path.unshift(curr);
                        curr = parent[curr];
                    }
                    return path;
                }
                for (const neighbor of adj[currentNode]) {
                    if (!visited[neighbor]) {
                        visited[neighbor] = true;
                        parent[neighbor] = currentNode;
                        queue.push(neighbor);
                    }
                }
            }
            return null; // 找不到路径
        }
    };

    game.ConditionChecker = ConditionChecker;
    game.Utils = Utils;

})();