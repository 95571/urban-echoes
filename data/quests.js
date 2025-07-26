/**
 * @file data/quests.js
 * @description 游戏内容 - 任务与兼职 (v44.0.1 - [优化] 调整日志颜色)
 */
window.gameData.jobs = {
    "job_flyer": {
        id: "job_flyer",
        questId: "quest_job_flyer",
        questVariable: "q_job_flyer", 
        isMain: false, // 设为可重复任务
        title: "派发传单",
        description: "在市中心广场派发健身房的宣传传单。简单劳动，但有点枯燥。",
        requirements: [{ type: 'stat', stat: 'con', comparison: '>=', value: 5, text: '需要一定的体力 (体质 >= 5)' }],
        reward: "80 " + gameData.icons.gold,
        objectives: [{ id: "complete_work", text: "完成传单派发工作", target: 1, current: 0 }],
        completionActionBlock: [
            { action: { type: 'show_toast', payload: { 
                icon: gameData.icons.quest,
                title: '任务完成', 
                text: '你完成了【派发传单】的工作。' 
            } } },
            { action: { type: 'effect', payload: { gold: 80 } } },
            { action: { type: 'modify_variable', payload: { varId: 'q_job_flyer', operation: 'set', value: 0 } } }
        ]
    },
    "job_waiter": {
        id: "job_waiter",
        questId: "quest_job_waiter",
        questVariable: "q_job_waiter",
        isMain: false, // 设为可重复任务
        title: "餐厅服务员",
        description: "在繁忙的快餐店担任服务员，负责点餐和清洁工作。",
        requirements: [{ type: 'stat', stat: 'str', comparison: '>=', value: 6, text: '需要不错的体力 (体魄 >= 6)' }],
        reward: "120 " + gameData.icons.gold,
        objectives: [{ id: "complete_work", text: "完成餐厅服务工作", target: 1, current: 0 }],
        completionActionBlock: [
            { action: { type: 'show_toast', payload: { icon: '🧑‍🍳', title: '工作结束', text: '餐厅的辛勤劳动有了回报。' } } },
            { action: { type: 'effect', payload: { gold: 120 } } },
            { action: { type: 'modify_variable', payload: { varId: 'q_job_waiter', operation: 'set', value: 0 } } }
        ]
    },
    "job_tutor": {
        id: "job_tutor",
        questId: "quest_job_tutor",
        questVariable: "q_job_tutor",
        isMain: true, // 设为重要（主线）任务
        title: "家教老师",
        description: "为一名初中生辅导数学。需要对初中数学有较好的掌握。",
        requirements: [{ type: 'stat', stat: 'int', comparison: '>=', value: 8, text: '需要良好的学识 (学识 >= 8)' }],
        reward: "200 " + gameData.icons.gold,
        objectives: [{ id: "complete_work", text: "完成家教辅导", target: 1, current: 0 }],
        completionActionBlock: [
             { action: { type: 'show_toast', payload: { icon: gameData.icons.study, title: '任务完成', text: '家教工作顺利结束！' } } },
             { action: { type: 'effect', payload: { gold: 200 } } },
             { action: { type: 'modify_variable', payload: { varId: 'q_job_tutor', operation: 'set', value: 2 } } }
        ]
    },
    "job_visit_grandma": {
        id: "job_visit_grandma",
        questId: "quest_visit_grandma",
        questVariable: "q_visit_grandma",
        isMain: true, // 设为重要（主线）任务
        title: "看望姥姥",
        description: "妈妈让你带两条咸鱼回老家看望姥姥。",
        reward: "亲情",
        objectives: [{ id: "deliver_fish", text: "把咸鱼带给姥姥", target: 1, current: 0 }],
        completionActionBlock: [
            { action: { type: 'show_toast', payload: { 
                icon: '👵', 
                title: '任务完成', 
                text: '【看望姥姥】' 
            } } },
            { action: { type: 'modify_variable', payload: { varId: 'q_visit_grandma', operation: 'set', value: 2 } } }
        ]
    },
    "job_buy_ribs": {
        id: "job_buy_ribs",
        questId: "quest_buy_ribs",
        questVariable: "q_buy_ribs",
        isMain: true, // 设为重要（主线）任务
        title: "给姥姥买排骨",
        description: "姥姥想吃排骨了，让你去菜市场买2斤回来。",
        reward: "姥姥的红烧排骨",
        objectives: [{ id: "buy_ribs", text: "购买2斤排骨", target: 2, current: 0 }],
        completionActionBlock: [
            { action: { type: 'show_toast', payload: { 
                icon: '🍖', 
                title: '任务完成', 
                text: '【给姥姥买排骨】' 
            } } },
            { action: { type: 'log', payload: { text: '姥姥高兴地接过了排骨，走进了厨房。不一会儿，香喷喷的红烧排骨就出锅了！' } } },
            { action: { type: 'effect', payload: { hp: 50, mp: 50 } } },
            { action: { type: 'log', payload: { text: '你吃得心满意足，感觉浑身充满了力量。' , color: 'var(--log-color-success)'} } },
            { action: { type: 'modify_variable', payload: { varId: 'q_buy_ribs', operation: 'set', value: 2 } } }
        ]
    }
};