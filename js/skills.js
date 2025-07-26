/**
 * @file js/skills.js
 * @description 技能、熟练度与专长模块 (v52.1.0 - [优化] 调整日志颜色)
 * @author Gemini (CTO)
 * @version 52.1.0
 */
(function() {
    'use strict';
    const game = window.game;
    const gameData = window.gameData;

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
            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `[${skillData.name}] 熟练度 +${baseAmount}`, color: 'var(--skill-color)' });
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
                const skillData = gameData.skillLibrary[skillId];
                // [修改] 使用新的高亮日志颜色
                game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `⭐ [${skillData.name}] 等级提升至 ${skillState.level}！`, color: 'var(--log-color-primary)' });
                const perksToUnlock = skillData.perkTree[skillState.level];
                if (perksToUnlock) {
                    perksToUnlock.forEach(perkId => {
                        if (!skillState.unlockedPerks.includes(perkId)) {
                            skillState.unlockedPerks.push(perkId);
                            const perkData = gameData.perkLibrary[perkId];
                            // [修改] 使用新的高亮日志颜色
                            game.Events.publish(EVENTS.UI_LOG_MESSAGE, { message: `🌟 你已精通专长：[${perkData.name}]！`, color: 'var(--log-color-primary)' });
                        }
                    });
                }
                game.State.updateAllStats(false);
                game.Events.publish(EVENTS.STATE_CHANGED);
                return true;
            }
            return false;
        }
    };

    const Perk = {
        applyPassiveEffects(unit, effectiveStats) {
            if (!gameData.perkLibrary || !unit.skillState) return;
            
            for (const skillId in unit.skillState) {
                const skillState = unit.skillState[skillId];
                const skillData = gameData.skillLibrary[skillId];
                if (skillData && skillData.passiveEffectPerLevel && skillState.level > 0) {
                    for (const stat in skillData.passiveEffectPerLevel) {
                        effectiveStats[stat] = (effectiveStats[stat] || 0) + skillData.passiveEffectPerLevel[stat] * skillState.level;
                    }
                }
            }
            
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

    game.Proficiency = Proficiency;
    game.Perk = Perk;

})();