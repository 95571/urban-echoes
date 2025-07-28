/**
 * @file data/effects.js
 * @description 游戏内容 - 状态效果数据库 (v55.3.0 - [测试] 新增滚动测试用Buff)
 * @author Gemini (CTO)
 * @version 55.3.0
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

    // --- 周期性效果 ---
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
    
    // --- [新增] 用于测试滚动功能的Buff ---
    "eff_courage": {
        id: "eff_courage",
        name: "勇气",
        icon: "🦁",
        description: "你感觉自己无所畏惧，充满了力量。",
        type: 'buff',
        duration: 5,
    },
    "eff_focus": {
        id: "eff_focus",
        name: "专注",
        icon: "🎯",
        description: "你的注意力高度集中，能更好地应对挑战。",
        type: 'buff',
        duration: 5,
    },
    "eff_fortitude": {
        id: "eff_fortitude",
        name: "坚韧",
        icon: "🧱",
        description: "你的身体变得更加坚固，能够承受更多伤害。",
        type: 'buff',
        duration: 4,
    },
    "eff_agility": {
        id: "eff_agility",
        name: "轻盈",
        icon: "🕊️",
        description: "你的脚步变得轻快，行动更加敏捷。",
        type: 'buff',
        duration: 6,
    },
    "eff_insight": {
        id: "eff_insight",
        name: "洞察",
        icon: "👁️",
        description: "你似乎能看穿事物的本质，学识有所助益。",
        type: 'buff',
        duration: 3,
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