/**
 * @file js/skills.js
 * @description 技能、熟练度与专长模块 (v25.6.0 - [重构] 适配新的属性计算流程)
 * @author Gemini (CTO)
 * @version 25.6.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

    // --- 熟练度管理 ---
    const Proficiency = {
        getRequiredForLevel(skillId, level) {
            const skillData = gameData.skillLibrary[skillId];
            if (!skillData || level > 100) return Infinity;
            return Math.floor(skillData.baseProficiency * Math.pow(level, skillData.proficiencyExponent));
        },
        add(skillId, baseAmount) {
            if (!gameData.skillLibrary[skillId]) return;
            if (typeof baseAmount !== 'number' || isNaN(baseAmount)) { return; }
            const gameState = game.State.get();
            if (!gameState.skillState[skillId]) {
                gameState.skillState[skillId] = { level: 0, proficiency: 0, unlockedPerks: [] };
            }
            const skillState = gameState.skillState[skillId];
            if(skillState.level >= 100) return;
            const skillData = gameData.skillLibrary[skillId];
            skillState.proficiency += baseAmount;
            game.UI.log(`[${skillData.name}] 熟练度 +${baseAmount}`, 'var(--skill-color)');
            let leveledUp;
            do { leveledUp = this.checkAndProcessLevelUp(skillId); } while (leveledUp);
        },
        checkAndProcessLevelUp(skillId) {
            const skillState = game.State.get().skillState[skillId];
            if (skillState.level >= 100) return false;
            const requiredProficiency = this.getRequiredForLevel(skillId, skillState.level + 1);
            if (skillState.proficiency >= requiredProficiency) {
                skillState.level++;
                skillState.proficiency -= requiredProficiency;
                game.UI.log(`⭐ [${gameData.skillLibrary[skillId].name}] 等级提升至 ${skillState.level}！`, 'var(--primary-color)');
                const perksToUnlock = gameData.skillLibrary[skillId].perkTree[skillState.level];
                if (perksToUnlock) {
                    perksToUnlock.forEach(perkId => {
                        if (!skillState.unlockedPerks.includes(perkId)) {
                            skillState.unlockedPerks.push(perkId);
                            const perkData = gameData.perkLibrary[perkId];
                            game.UI.log(`🌟 你已精通专长：[${perkData.name}]！`, 'var(--primary-color)');
                        }
                    });
                }
                game.State.updateAllStats(false);
                return true;
            }
            return false;
        }
    };

    // --- 专长管理 ---
    const Perk = {
        // [重构] 该函数现在直接修改传入的 effectiveStats 对象
        applyPassiveEffects(unit, effectiveStats) {
            if (!gameData.perkLibrary || !unit.skillState) return;
            
            // 1. 应用技能等级带来的被动加成
            for (const skillId in unit.skillState) {
                const skillState = unit.skillState[skillId];
                const skillData = gameData.skillLibrary[skillId];
                if (skillData && skillData.passiveEffectPerLevel && skillState.level > 0) {
                    for (const stat in skillData.passiveEffectPerLevel) {
                        effectiveStats[stat] = (effectiveStats[stat] || 0) + skillData.passiveEffectPerLevel[stat] * skillState.level;
                    }
                }
            }
            
            // 2. 应用已解锁专长带来的被动加成
            for (const skillId in unit.skillState) {
                const skillState = unit.skillState[skillId];
                if (skillState.unlockedPerks && skillState.unlockedPerks.length > 0) {
                    skillState.unlockedPerks.forEach(perkId => {
                        const perkData = gameData.perkLibrary[perkId];
                        if (perkData && perkData.effect.type === 'passive') {
                            const { stat, value } = perkData.effect;
                            effectiveStats[stat] = (effectiveStats[stat] || 0) + value;
                        }
                    });
                }
            }
        }
    };

    // 挂载到全局 game 对象
    game.Proficiency = Proficiency;
    game.Perk = Perk;

})();