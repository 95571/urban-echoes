/**
 * @file data/effects.js
 * @description 游戏内容 - 状态效果数据库 (v55.2.1 - [优化] 区分纯即时效果)
 * @author Gemini (CTO)
 * @version 55.2.1
 */

window.gameData.effects = {
    // --- 道具效果 ---
    "eff_energy_boost": {
        id: "eff_energy_boost",
        name: "能量补充", // 名称可以更通用
        // [修改] 移除了icon, description, type, duration，因为它不再是一个需要显示的状态
        instantModifiers: { 
            mp: 40, 
            hp: -5 
        }
    },

    // --- 周期性效果示例 ---
    "eff_regeneration": {
        id: "eff_regeneration",
        name: "再生",
        icon: "❤️‍🩹",
        description: "一股温暖的能量在体内流动，持续恢复健康。",
        type: 'buff',
        duration: 3,
        onTickActionBlock: [
            { action: { type: 'effect', payload: { hp: 20 } } },
            { action: { type: 'log', payload: { text: "再生效果恢复了你的健康。", color: 'var(--log-color-success)' } } }
        ]
    },

    // --- 天赋/技能效果 (为未来做准备的示例) ---
    "passive_crit_master_pro": {
        id: "passive_crit_master_pro",
        name: "暴击高手 (专家)",
        icon: "🎯",
        description: "凭借对暴击的深刻理解，大幅提升暴击率。",
        type: 'buff',
        duration: -1,
        isHidden: true,
        persistentModifiers: [
            { 
                targetStat: 'criticalChance', 
                formula: "skillLevel('skill_crit_master') * 0.05"
            }
        ]
    }
};