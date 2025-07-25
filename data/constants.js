/**
 * @file data/constants.js
 * @description 游戏内容 - 全局常量 (v52.0.0)
 * @description [新增] 引入常量系统，消除魔法字符串。
 */

window.gameData.constants = {
    // 事件名 (用于事件总线)
    EVENTS: {
        // UI 事件
        UI_RENDER: 'ui:render', // 请求UI模块进行一次完整的重绘
        UI_RENDER_BOTTOM_NAV: 'ui:renderBottomNav', // 只刷新底部导航栏
        UI_LOG_MESSAGE: 'ui:logMessage', // 在消息日志中打印一条消息
        UI_SHOW_TOAST: 'ui:showToast', // 显示一个短暂的顶部通知

        // 状态事件
        STATE_CHANGED: 'state:changed', // 当任何核心玩家状态（属性、金钱、物品等）发生变化时发布
        TIME_ADVANCED: 'time:advanced', // 当时间推进时发布

        // 流程事件
        GAME_SAVED: 'game:saved', // 游戏存档完成
        GAME_LOADED: 'game:loaded', // 游戏读档完成
    },

    // 变量ID
    VARS: {
        // 任务状态
        Q_VISIT_GRANDMA: 'q_visit_grandma',
        Q_BUY_RIBS: 'q_buy_ribs',
        Q_JOB_FLYER: 'q_job_flyer',
        Q_JOB_TUTOR: 'q_job_tutor',
        Q_JOB_WAITER: 'q_job_waiter',

        // 标志变量
        CHEAT_UNLOCKED: 'cheat_unlocked',
        A_LETTER_APPEARED: 'a_letter_appeared',
        LETTER_READ: 'letter_read',

        // 计数器
        THUG_DEFEAT_COUNT: 'thug_defeat_count',
        DEFEATED_TEST_THUGS: 'defeated_test_thugs',

        // 场景元素状态
        hotspotDestroyed: (locationId, index) => `hotspot_destroyed_${locationId}_${index}`,
        discoveryDestroyed: (locationId, index) => `discovery_destroyed_${locationId}_${index}`,
    },

    // 物品ID
    ITEMS: {
        PHONE: 'item_phone',
        NEWBIE_PACK: 'item_newbie_pack',
        ENERGY_DRINK: 'item_energy_drink',
        SALTED_FISH: 'item_salted_fish',
        RIBS: 'item_ribs',
        WOOD_SWORD: 'equip_wood_sword',
        BASEBALL_CAP: 'equip_baseball_cap',
        TSHIRT: 'equip_tshirt',
        JEANS: 'equip_jeans',
        RUNNERS: 'equip_runners',
        CLOVER: 'equip_clover',
    },

    // 任务/兼职ID
    JOBS: {
        VISIT_GRANDMA: 'job_visit_grandma',
        BUY_RIBS: 'job_buy_ribs',
        FLYER: 'job_flyer',
        WAITER: 'job_waiter',
        TUTOR: 'job_tutor',
    },
    
    // 퀘스트 ID
    QUESTS: {
        VISIT_GRANDMA: 'quest_visit_grandma',
        BUY_RIBS: 'quest_buy_ribs',
        JOB_FLYER: 'quest_job_flyer',
        JOB_WAITER: 'quest_job_waiter',
        JOB_TUTOR: 'quest_job_tutor',
    }
};

// 为了方便使用，我们将常量挂载到更短的别名上
window.EVENTS = window.gameData.constants.EVENTS;
window.VARS = window.gameData.constants.VARS;
window.ITEMS = window.gameData.constants.ITEMS;
window.JOBS = window.gameData.constants.JOBS;
window.QUESTS = window.gameData.constants.QUESTS;