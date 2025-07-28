/**
 * @file data/effects.js
 * @description 游戏内容 - 状态效果数据库 (v59.1.0 - [新增] 事件触发系统)
 * @author Gemini (CTO)
 * @version 59.1.0
 */

window.gameData.effects = {
    // --- [新增] 事件触发型Buff ---

    "eff_vampiric_strike": {
        id: "eff_vampiric_strike",
        name: "吸血攻击",
        icon: "🩸",
        description: "你的攻击能为你回复生命值。",
        type: 'buff',
        duration: -1, // -1 代表永久效果
        isHidden: true, // 不在UI上显示，作为被动效果
        /**
         * @property {Array} triggers - [新增] 事件触发器数组
         * @description 定义了该效果在何种条件下触发何种效果。可以定义多个触发器。
         */
        triggers: [
            {
                /**
                 * @property {string} event - 监听的事件名称 (必须是 data/constants.js 中定义的事件)
                 */
                event: EVENTS.COMBAT_ATTACK_END, // 在攻击结束后触发

                /**
                 * @property {Array} conditions - [可选] 附加条件数组
                 * @description 定义了触发需要满足的额外条件，所有条件都满足(AND逻辑)才会触发。
                 */
                conditions: [
                    // 这里可以留空，代表每次攻击结束都触发
                ],

                /**
                 * @property {Array} actionBlock - 动作序列
                 * @description 条件满足后执行的标准化动作序列。
                 * @description [上下文变量] 在actionBlock中，你可以使用特殊的上下文变量来获取事件相关的数据:
                 * - context.damageDealt: 本次攻击造成的最终伤害值
                 * - context.target: 本次攻击的目标单位
                 * - context.source: 触发事件的源单位 (在这里就是攻击者自己)
                 */
                actionBlock: [
                    // 动作为：为自己（源单位）回复等同于“造成的伤害(damageDealt)的30%”的生命值。
                    // floor() 是向下取整的数学函数。
                    { action: { type: 'effect', payload: { hp: "floor(context.damageDealt * 0.3)" } } },
                    { action: { type: 'log', payload: { text: "你从攻击中汲取了生命！", color: 'var(--log-color-success)' } } }
                ]
            }
        ]
    },

    "eff_focused_assault_proc": {
        id: "eff_focused_assault_proc",
        name: "专注打击",
        icon: "💥",
        description: "你的下一次攻击将无视敌人的防御。",
        type: 'buff',
        duration: 1, // 只持续1个回合的临时buff
        isHidden: true,
        persistentModifiers: [
             // 这是一个示例，实际的“破防”逻辑由触发器实现
            { targetStat: 'attack', value: 5 }
        ]
    },

    "eff_precision_mastery": {
        id: "eff_precision_mastery",
        name: "精准掌握",
        icon: "🎯",
        description: "你的常规攻击有一定几率变得极其专注，能够穿透防御。",
        type: 'buff',
        duration: -1,
        isHidden: true,
        triggers: [
            {
                event: EVENTS.COMBAT_ATTACK_START, // 在攻击开始前触发
                conditions: [
                    // 新增的 'random' 条件类型
                    { type: 'random', chance: 70 } // 50%的概率
                ],
                actionBlock: [
                    // 增加一个临时的、仅持续1回合的“专注打击”Buff
                    { action: { type: 'add_effect', payload: { effectId: 'eff_focused_assault_proc' } } },
                    { action: { type: 'log', payload: { text: "你集中了精神，准备进行一次专注打击！", color: 'var(--log-color-primary)' } } }
                ]
            }
        ]
    },


    // --- [旧版] 公式化Buff ---
    "eff_scholars_blessing": {
        id: "eff_scholars_blessing",
        name: "学者的祝福",
        description: "你的学识让你能更高效地运用精力。",
        type: 'buff',
        duration: -1,
        isHidden: true,
        persistentModifiers: [
            { targetStat: 'maxMp', formula: 'magic_power' }
        ]
    },


    // --- [旧版] 装备特性 Buff ---
    "eff_sharpness": {
        id: "eff_sharpness",
        name: "锋锐",
        description: "你的攻击更加致命。",
        type: 'buff',
        duration: -1, 
        isHidden: true, 
        persistentModifiers: [
            { targetStat: 'attack', value: 2 }
        ]
    },
    "eff_swiftness": {
        id: "eff_swiftness",
        name: "迅捷",
        description: "你的动作更加迅速。",
        type: 'buff',
        duration: -1,
        isHidden: true,
        persistentModifiers: [
            { targetStat: 'spd', value: 1 }
        ]
    },

    // --- [旧版] 道具效果 ---
    "eff_energy_boost": {
        id: "eff_energy_boost",
        name: "能量补充",
        instantModifiers: { 
            mp: 40, 
            hp: -5 
        }
    },

    // --- [旧版] 周期性效果 ---
    "eff_regeneration": {
        id: "eff_regeneration",
        name: "再生",
        icon: "❤️‍🩹",
        description: "一股温暖的能量在体内流动，持续恢复健康。",
        type: 'buff',
        duration: 3,
        onTickActionBlock: [
            // 注意：这里的 context 是 tick 的上下文，目前为空
            { action: { type: 'effect', payload: { hp: 20 } } },
            { action: { type: 'log', payload: { text: "再生效果恢复了你的健康。", color: 'var(--log-color-success)' } } }
        ]
    },
    
    // --- [旧版] 用于测试滚动功能的Buff ---
    "eff_courage": { id: "eff_courage", name: "勇气", icon: "🦁", description: "你感觉自己无所畏惧，充满了力量。", type: 'buff', duration: 5, },
    "eff_focus": { id: "eff_focus", name: "专注", icon: "🎯", description: "你的注意力高度集中，能更好地应对挑战。", type: 'buff', duration: 5, },
    "eff_fortitude": { id: "eff_fortitude", name: "坚韧", icon: "🧱", description: "你的身体变得更加坚固，能够承受更多伤害。", type: 'buff', duration: 4, },
    "eff_agility": { id: "eff_agility", name: "轻盈", icon: "🕊️", description: "你的脚步变得轻快，行动更加敏捷。", type: 'buff', duration: 6, },
    "eff_insight": { id: "eff_insight", name: "洞察", icon: "👁️", description: "你似乎能看穿事物的本质，学识有所助益。", type: 'buff', duration: 3, },

    // --- [旧版] 天赋/技能效果 (为未来做准备的示例) ---
    "passive_crit_master_pro": {
        id: "passive_crit_master_pro",
        name: "暴击高手 (专家)",
        icon: "🎯",
        description: "凭借对暴击的深刻理解，大幅提升暴击率。",
        type: 'buff',
        duration: -1,
        isHidden: true,
        persistentModifiers: [
            { targetStat: 'criticalChance', formula: "skillLevel('skill_crit_master') * 0.05" }
        ]
    }
};