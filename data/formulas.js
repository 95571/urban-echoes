/**
 * @file data/formulas.js
 * @description 游戏内容 - 公式与变量定义 (v58.0.0)
 * @author Gemini (CTO)
 * @version 58.0.0
 */

window.gameData.formulas = {
    /**
     * @description [文档] 原生变量 (Read-Only)
     * 以下是您可以在任何 `formula` 字符串中直接使用的原生变量。
     * 它们由引擎实时提供，您只能读取它们的值，不能修改。
     * * === 玩家核心属性 ===
     * str, dex, int, con, lck: 玩家的基础体魄、灵巧、学识、健康、机运
     * * === 玩家派生属性 ===
     * maxHp, maxMp, attack, defense, spd: 玩家的最终最大生命/精力，攻击/防御/行动力
     * * === 玩家资源 ===
     * hp, mp: 玩家的当前生命/精力
     * gold: 玩家的金钱
     * * === 时间变量 ===
     * time.year, time.month, time.day: 当前的年月日
     * time.phase: 当前的时间段索引 (0:清晨, 1:上午, 2:中午, 3:下午, 4:晚上, 5:深夜)
     * time.dayOfWeek: 当天是周几 (0:周日, 1:周一 ... 6:周六)
     * * === 技能变量 ===
     * skillLevel('skill_id'): 获取某个技能的等级。例如: skillLevel('skill_eloquence')
     * * === 自定义变量 ===
     * variables.variable_name: 获取您在 player.js 或通过 'modify_variable' 动作设置的任何自定义变量。
     * 例如: variables.kill_count
     * * === 其他 (未来可扩展) ===
     * party.member_id.relationship: 获取某位队友的好感度 (待实现)
     * */
    
    /**
     * @description [配置] 自定义公式变量
     * 在这里，您可以创建自己的变量，并在其他任何地方（如Buff的formula）引用它们。
     * 键名(Key): 您自定义的变量名，例如 'my_custom_stat'
     * 值(Value): 一个用于计算该变量的公式字符串。
     * * [重要]: 自定义变量之间可以互相引用！引擎会自动处理计算顺序。
     * 但请注意避免循环引用，例如 A引用B，B又引用A，这会导致游戏崩溃。
     */
    custom: {
        // 示例: 创建一个名为 'magic_power' 的新变量，它等于玩家学识的1.5倍
        'magic_power': 'int * 1.5',

        // 示例: 创建一个名为 'wealth_bonus' 的变量，玩家每有1000金币，就+1
        'wealth_bonus': 'floor(gold / 1000)',
        
        // 示例: 引用另一个自定义变量
        // 'advanced_magic_power': 'magic_power * (1 + wealth_bonus * 0.1)'
    }
};