/**
 * @file data.js
 * @description 游戏内容配置文件 (v29.0.0 - [新增] 看望姥姥任务线)
 * @author Gemini (PM/CTO)
 * @version 29.0.0
 */
window.gameData = {};

gameData.icons = { 
    str: '💪', dex: '🤸', int: '🧠', con: '❤️', lck: '🍀', 
    health: '❤️', energy: '⚡', gold: '💰',
    attack:'⚔️', defense:'🛡️', spd: '🏃',
    location: '📍', unknown: '❓', quest: '📜', time: '🕒',
    home: '🏠', work: '🏢', study: '📚', shop: '🛍️', park: '🌳', bus: '🚌',
    cheat: '🛠️',
    save: '💾', load: '📂', export: '📤', import: '📥'
};
gameData.settings = {
    timePhases: ['清晨', '上午', '中午', '下午', '晚上', '深夜'],
    weekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    travelTime: {
        'bus_long_distance': 4,
        'bus_short_distance': 1
    }
};
gameData.screenTitles = {
    "TITLE": "都市回响", 
    "STATUS": "状态详情", "INVENTORY": "持有物品", "QUESTS": "任务日志",
    "PARTY": "人际关系", "SYSTEM": "杭城旧梦", "MAP": "地图" ,
    "SEQUENCE": "人生的选择"
};
gameData.formulas_primary = {
    maxHp: 'con * 10 + 50', maxMp: 'int * 5 + con * 5 + 50',
    attack: 'str * 2', defense: 'con * 1', spd: '10 + dex',
};

// -----------------------------------------------------------------------------
// 2. 核心数据库 (Core Libraries)
// -----------------------------------------------------------------------------

gameData.jobs = {
    "job_flyer": {
        id: "job_flyer",
        questId: "quest_job_flyer",
        questVariable: "q_job_flyer", 
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
            { action: { type: 'log', payload: { text: `获得了 80 ${gameData.icons.gold}。`, color: 'var(--success-color)' } } },
            { action: { type: 'modify_variable', payload: { varId: 'q_job_flyer', operation: 'set', value: 0 } } }
        ]
    },
    "job_waiter": {
        id: "job_waiter",
        questId: "quest_job_waiter",
        questVariable: "q_job_waiter",
        title: "餐厅服务员",
        description: "在繁忙的快餐店担任服务员，负责点餐和清洁工作。",
        requirements: [{ type: 'stat', stat: 'str', comparison: '>=', value: 6, text: '需要不错的体力 (体魄 >= 6)' }],
        reward: "120 " + gameData.icons.gold,
        objectives: [{ id: "complete_work", text: "完成餐厅服务工作", target: 1, current: 0 }],
        completionActionBlock: [
            { action: { type: 'show_toast', payload: { icon: '🧑‍🍳', title: '工作结束', text: '餐厅的辛勤劳动有了回报。' } } },
            { action: { type: 'effect', payload: { gold: 120 } } },
            { action: { type: 'log', payload: { text: `获得了 120 ${gameData.icons.gold}。`, color: 'var(--success-color)' } } },
            { action: { type: 'modify_variable', payload: { varId: 'q_job_waiter', operation: 'set', value: 0 } } }
        ]
    },
    "job_tutor": {
        id: "job_tutor",
        questId: "quest_job_tutor",
        questVariable: "q_job_tutor",
        title: "家教老师",
        description: "为一名初中生辅导数学。需要对初中数学有较好的掌握。",
        requirements: [{ type: 'stat', stat: 'int', comparison: '>=', value: 8, text: '需要良好的学识 (学识 >= 8)' }],
        reward: "200 " + gameData.icons.gold,
        objectives: [{ id: "complete_work", text: "完成家教辅导", target: 1, current: 0 }],
        completionActionBlock: [
             { action: { type: 'show_toast', payload: { icon: gameData.icons.study, title: '任务完成', text: '家教工作顺利结束！' } } },
             { action: { type: 'effect', payload: { gold: 200 } } },
             { action: { type: 'log', payload: { text: `获得了 200 ${gameData.icons.gold}。`, color: 'var(--success-color)' } } },
             { action: { type: 'modify_variable', payload: { varId: 'q_job_tutor', operation: 'set', value: 2 } } }
        ]
    },
    "job_visit_grandma": {
        id: "job_visit_grandma",
        questId: "quest_visit_grandma",
        questVariable: "q_visit_grandma",
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
};

gameData.items = {
    "item_phone": { name: "智能手机", type: "accessory", slot: "accessory1", description: "现代人的必需品。", effect: { lck: 1 } },
    "item_energy_drink": { 
        name: "功能饮料", 
        type: "consumable", 
        description: "一罐能让你瞬间精神抖擞的神奇液体，但似乎对健康没什么好处。", 
        onUseActionBlock: [
            { action: { type: 'log', payload: { text: '你喝下功能饮料，感觉精力充沛，但心脏有些不舒服。', color: 'var(--primary-color)' } } },
            { action: { type: 'effect', payload: { mp: 40, hp: -5 } } }
        ]
    },
    "item_salted_fish": {
        name: "咸鱼",
        type: "quest",
        description: "妈妈让你带给姥姥的咸鱼，闻起来很香。"
    }
};

gameData.skillLibrary = { 
    "skill_eloquence": { name: "口才", description: "能言善辩，说服他人的能力。", baseProficiency: 50, proficiencyExponent: 1.5, baseProficiencyGain: 10, passiveEffectPerLevel: {}, perkTree: {} } 
};
gameData.perkLibrary = {};
gameData.monsters = { 
    "thug": { id: "thug", name: "小混混", stats: { str: 8, dex: 4, int: 2, con: 8, lck: 3 }, fleeable: true },
    "thug_leader": { id: "thug_leader", name: "混混头目", stats: { str: 12, dex: 6, int: 4, con: 10, lck: 5 }, fleeable: false } 
};

gameData.systemMessages = {
    achievementsContent: {
        title: "成就殿堂",
        text: "此功能正在开发中，敬请期待您在杭城中的每一个高光时刻被铭记。",
        options: [{text: '关闭', value: true}]
    },
    aboutContent: {
        title: "关于《都市回响》",
        text: "<strong>创意总监:</strong> [您的名字]<br><strong>首席产品/技术:</strong> Gemini<br><br>这是一款我们共同构筑的，关于在现代都市中探索、成长与生活的故事模拟器。<br><br>特别鸣谢每一位体验这个世界的玩家。",
        options: [{text: '关闭', value: true}]
    },
    errorNotFound: "错误：找不到 ${target}",
    errorRender: "渲染时发生致命错误，详情请见控制台。",
    errorStateRenderer: "未找到状态 ${gameState} 的渲染器。",
    errorUnknownAction: "未知的动作类型: ${type}",
    errorLoadGame: "读档失败！存档文件可能已损坏或格式不正确。",
    errorSaveGame: "存档失败！",
    errorCannotSave: "此状态下无法保存。",
    fatalError: "捕获到未处理的致命错误: ${message}",
    enterLocation: "你进入了${locationName}。",
    gameWelcome: "欢迎，${playerName}！你的故事开始了！",
    newDay: "新的一天开始了。",
    gameSaved: "游戏已保存到存档 ${slot}！",
    gameLoaded: "游戏已从存档 ${slot} 读取！",
    gameExported: "存档 ${slot} 已导出为JSON文件！",
    gameImported: "存档已成功导入至存档槽 ${slot}！",
    noSaveFile: "此存档槽位为空。",
    newRound: "新的回合开始！",
    encounter: "遭遇了敌人！",
    playerTurn: "轮到你的回合了！请选择行动。",
    attackDamage: "${attackerName} 对 ${defenderName} 造成了 ${damage} 点伤害。",
    unitDefeated: "${unitName} 被击败了。",
    combatWin: "你获得了胜利！",
    combatWinPrompt: "胜利！",
    combatLoss: "你失败了...",
    combatLossPrompt: "失败...",
    defendAction: "${name} 摆出了防御姿态。",
    fleeSuccess: "你成功逃跑了！",
    fleeFail: "你试图逃跑，但是失败了！",
    extraTurnSuccess: "⚡ ${name} 的速度惊人，获得了额外行动机会！",
    getLoot: "你获得了 ${gold} ${goldIcon}。",
    getItemLoot: "战利品：获得了 [${itemName}] x${quantity}。",
    equipItem: "装备了 [${itemName}]。",
    unequipItem: "卸下了 [${itemName}]。",
    fullHeal: "你好好休息了一下，健康和精力都完全恢复了！",
    jobAccepted: "新任务：【${jobName}】已添加到你的任务日志。",
    jobAlreadyActive: "你已经接取了任务：【${jobName}】。",
    jobRequirementsNotMet: "由于不满足条件，你无法接受【${jobName}】这份工作。<br><small>要求：${requirementsText}</small>",
    questCompleted: "任务完成：【${questName}】！",
};

gameData.questionSequences = {
    "character_creation": {
        startQuestionId: "q_background",
        questions: {
            "q_background": {
                type: 'multiple_choice',
                text: "站在人生的十字路口，你来自怎样的家庭？",
                imageUrl: "images/location_home.png",
                answers: [
                    {
                        text: "普通家庭：父母是工薪阶层，生活平淡但安稳。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你出生在一个普通的家庭，不好也不坏。" } } },
                            { action: { type: 'effect', payload: { stats: { con: 1, int: 1 }, gold: 2000 } } }
                        ],
                        transition: "q_childhood_memory"
                    },
                    {
                        text: "单亲家庭：由母亲一人抚养长大，更早熟独立。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你在单亲家庭长大，这让你更加坚强。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 1, lck: 1 }, gold: 1000 } } }
                        ],
                        transition: "q_childhood_memory"
                    },
                    {
                        text: "小镇青年：来自周边小镇，对大城市充满向往。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你带着全村的希望来到杭城，未来要靠自己打拼。" } } },
                            { action: { type: 'effect', payload: { stats: { str: 1, con: 1 }, gold: 3000 } } }
                        ],
                        transition: "q_childhood_memory"
                    }
                ]
            },
            "q_childhood_memory": {
                type: 'multiple_choice',
                text: "回忆童年，哪段记忆最为深刻？",
                imageUrl: "images/location_park.png",
                answers: [
                    {
                        text: "第一次解出数学难题后的喜悦。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你对知识的渴望，从那时便已萌芽。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 2 } } } }
                        ],
                        transition: {
                            type: 'random',
                            outcomes: [
                                { id: 'q_part_time_job', weight: 80 },
                                { id: 'q_special_event', weight: 20 }
                            ]
                        }
                    },
                    {
                        text: "在运动会上为班级赢得荣誉的瞬间。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "强健的体魄是你最大的本钱。" } } },
                            { action: { type: 'effect', payload: { stats: { str: 1, dex: 1 } } } }
                        ],
                        transition: "q_part_time_job"
                    }
                ]
            },
            "q_part_time_job": {
                type: 'multiple_choice',
                text: "大学期间，你通过哪种方式赚取零花钱？",
                imageUrl: "images/location_downtown.png",
                answers: [
                    {
                        text: "家教：将知识变现。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你通过分享知识获得了报酬。" } } },
                            { action: { type: 'effect', payload: { gold: 500 } } }
                        ],
                        transition: "q_name"
                    },
                    {
                        text: "餐厅服务员：体验劳动的辛苦。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "辛勤的劳动让你对金钱有了更深的理解。" } } },
                            { action: { type: 'effect', payload: { gold: 800 } } }
                        ],
                        transition: "q_name"
                    }
                ]
            },
            "q_special_event": {
                type: 'multiple_choice',
                text: "你回忆起，在一次编程竞赛中，你凭借一个巧妙的算法获得了意外的名次，这让你...",
                imageUrl: "images/location_study.png",
                answers: [
                    {
                        text: "对计算机科学产生了浓厚的兴趣。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "一个偶然的机会，为你打开了新世界的大门。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 1 } } } },
                            { action: { type: 'modify_variable', payload: { varId: 'programming_aptitude', operation: 'add', value: 10 } } }
                        ],
                        transition: "q_name"
                    }
                ]
            },
            "q_name": {
                type: 'text_input',
                text: "你将以何姓名，开始你在杭城的故事？",
                imageUrl: "images/creation_name.png",
                answers: [
                    {
                        text: "以此之名，踏上旅途",
                        transition: "END_SEQUENCE"
                    }
                ]
            }
        }
    }
};

gameData.initialPlayerState = {
    id: "player", name: "无名者", gold: 0,
    hp: 100, maxHp: 100, mp: 100,  maxMp: 100,
    stats: { str: 5, dex: 5, int: 5, con: 5, lck: 5 },
    derivedStats: {},
    inventory: [ { id: "item_phone", quantity: 1 }, { id: "item_energy_drink", quantity: 2 }, ],
    equipped: { mainHand: null, body: null, accessory1: "item_phone", accessory2: null },
    skillState: { "skill_eloquence": { level: 1, proficiency: 0, unlockedPerks: [] } },
    quests: {}, 
    flags: { cheat_unlocked: false },
    variables: {},
    menu: { current: null, skillDetailView: null, statusViewTargetId: null },
    party: [ 
        { id: "mother", name: "妈妈", description: "一位关心你的职场白领。工作很忙，但总是会为你准备好热腾腾的饭菜。" },
        { id: "sister", name: "妹妹", description: "一位有些叛逆的可爱高中生。嘴上不说，其实很依赖你。" }
    ], 
    time: { year: 2025, month: 7, day: 7, phase: 0, },
    currentLocationId: "location_home",
    currentMapNodeId: "map_node_home",
    currentMapId: "hangcheng",
    gameState: "TITLE",
    previousGameState: "TITLE", 
    activeSequence: null,
    isCombat: false, combatState: null,
};

gameData.maps = {
    "hangcheng": {
        name: "杭城地图",
        nodes: {
            "map_node_home":      { name: "家",      icon: gameData.icons.home, x: 25, y: 20, interaction: { type: 'interactive_dialogue', payload: {
                title: '家',
                options: [
                    { text: '进入小区', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_community' } } } ] },
                    { text: '留在地图上', actionBlock: [] }
                ]
            }}},
            "map_node_downtown":  { name: "市中心",  icon: gameData.icons.work, x: 50, y: 45, interaction: { type: 'interactive_dialogue', payload: {
                title: '市中心广场',
                textAlign: 'center',
                options: [
                    { text: '进入广场 (消耗1时间段)', actionBlock: [
                        { action: { type: 'advanceTime', payload: { phases: 1 } } },
                        { action: { type: 'enter_location', payload: { locationId: 'location_downtown' } } }
                    ]},
                     { text: `[作弊] ${gameData.icons.cheat} 属性+1`, conditions: [{ type: 'flag', flagId: 'cheat_unlocked', value: true }], actionBlock: [
                        { action: { type: 'effect', payload: { stats: { str: 1, dex: 1, int: 1, con: 1, lck: 1 } } } },
                        { action: { type: 'log', payload: { text: '一道光芒闪过，你感觉自己变强了！', color: 'var(--skill-color)' } } }
                    ]},
                     { text: '还是算了', actionBlock: [] }
                ]
            }}},
            "map_node_bus_station": { 
                name: "汽车客运站", icon: gameData.icons.bus, x: 75, y: 80,
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '售票员：你要去哪里？',
                    options: [
                        { text: `回老家 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [
                            { action: { type: 'log', payload: { text: '你坐上了长途汽车...' } } },
                            { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                            { action: { type: 'map_transition', payload: { targetMapId: "hometown", targetStartNode: "map_node_hometown_station" } } },
                            { action: { type: 'log', payload: { text: '经过一路奔波，你抵达了新的地方。', color: 'var(--primary-color)' } } }
                        ]},
                        { text: '我再想想', actionBlock: [] }
                    ]
                }}
            }
        },
        connections: [ ["map_node_home", "map_node_downtown"], ["map_node_downtown", "map_node_bus_station"] ]
    },
    "hometown": {
        name: "老家地图",
        nodes: {
            "map_node_hometown_station": {
                name: "客运站", icon: gameData.icons.bus, x: 30, y: 70,
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '准备回杭城吗？',
                    options: [
                         { text: `返回杭城 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [
                            { action: { type: 'log', payload: { text: '你坐上了返回杭城的汽车...' } } },
                            { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                            { action: { type: 'map_transition', payload: { targetMapId: "hangcheng", targetStartNode: "map_node_bus_station" } } },
                            { action: { type: 'log', payload: { text: '经过一路奔波，你回到了杭城。', color: 'var(--primary-color)' } } }
                        ]},
                        { text: '在老家再待会儿', actionBlock: [] }
                    ]
                }}
            },
            "map_node_old_home": { name: "老家", icon: gameData.icons.home, x: 60, y: 30, interaction: { type: 'interactive_dialogue', payload: {
                title: '老家的房子',
                options: [
                    { text: '进去看看', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_old_home' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            }} },
			"map_node_grandma_home": { name: "姥姥家", icon: '👵', x: 75, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '姥姥家的房子',
                options: [
                    { text: '进去看看', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_grandma_home' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            }} },
        },
        connections: [ ["map_node_hometown_station", "map_node_old_home"], ["map_node_old_home", "map_node_grandma_home"] ]
    }
};

gameData.locations = {
    "start_creation": { name: "命运的十字路口", description: "回忆如潮水般涌来...", imageUrl: null, hotspots: [] },
    "location_home": { name: "你的房间", description: "一个温馨的小房间，是你休憩的港湾。", imageUrl: "images/location_home.png", hotspots: [
            { label: "出门", x: 80, y: 80, interaction: { type: 'interactive_dialogue', payload: { 
                title: '出门',
                options: [
                    { text: '前往小区门口', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_community' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            } } },
            { label: "床", x: 25, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: "你要休息一下吗？",
                options: [
                    { text: "小睡一会儿 (推进1个时间段)", actionBlock: [ { action: { type: 'log', payload: { text: "你躺在床上小睡了一会儿..." } } }, { action: { type: 'advanceTime', payload: { phases: 1 } } }, { action: { type: 'effect', payload: { mp: 50, hp: 10 } } } ] },
                    { text: "睡到第二天早上", actionBlock: [ { action: { type: 'log', payload: { text: "你决定好好睡一觉，迎接新的一天。" } } }, { action: { type: 'advanceTime', payload: { until: 'next_morning' } } }, { action: { type: 'action', payload: { id: 'fullHeal' } } } ] },
                    { text: "还是算了", actionBlock: [] }
                ]
            } } },
            { label: "妈妈", x: 60, y: 40, interaction: { type: 'interactive_dialogue', payload: {
                title: '妈妈', 
                imageUrl: 'images/mother.png',
                dialogueText: [
                    '回来了啊，孩子。今天过得怎么样？\n工作不着急找，先玩一段时间。',
                    '找到工作了吗？没找到不用急。\n先吃饭吧。',
                    '你妹又跑出去玩了，一放假就玩得不记得时间。\n可能在市中心逛街。'
                ],
                options: [
                    { text: '“还行，投了几份简历。”', actionBlock: [
                        { action: { type: 'log', payload: { text: '妈妈欣慰地点点头：“不着急，慢慢来，总能找到合适的。”' } } }
                    ]},
                    { text: '“别提了，有点不顺利...”',
                      followUp: {
                          dialogueText: '妈妈拍了拍你的肩膀：“没关系，刚毕业都这样。先吃饭，吃饱了才有力气想别的。”',
                          options: [
                              { text: '“嗯...谢谢妈。”', actionBlock: [ 
                                  { action: { type: 'log', payload: { text: '你感到一阵暖心。' } } },
								  { action: { type: 'log', payload: { text: '你的<strong><span style="color:var(--error-color)">mp+10</span></strong>' } } },
                                  { action: { type: 'effect', payload: { mp: 10 } } } 
                                ] 
                              }
                          ]
                      }
                    },
                    { 
                        text: '“妈，我想回趟老家。”', 
                        conditions: [{ type: 'variable', varId: 'q_visit_grandma', comparison: '!=', value: 1 }],
                        followUp: {
                            dialogueText: '对，正好给你姥姥带两条咸鱼\n她唠叨好久了。',
                            options: [
                                { text: '“好嘞！” (获得咸鱼x2，接取任务)', 
                                  actionBlock: [
                                    { action: { type: 'add_item', payload: { itemId: 'item_salted_fish', quantity: 2 } } },
                                    { action: { type: 'acceptJob', payload: { jobId: 'job_visit_grandma' } } }
                                  ]
                                }
                            ]
                        }
                    },
                    { text: '“妈，我饿了。”', actionBlock: [] }
                ]
            }}},
            { 
                label: "测试战斗", x: 50, y: 20, 
                interaction: { 
                    type: 'combat', 
                    payload: {
                        enemies: [ { id: 'thug', quantity: 2 }, { id: 'thug_leader', quantity: 1 } ],
                        fleeable: false,
                        victoryPrompt: '你干净利落地解决了麻烦！',
                        defeatPrompt: '双拳难敌众手...',
                        victoryActionBlock: [
                            { action: { type: 'log', payload: { text: '你击败了这伙恶棍，感觉自己变强了！', color: 'var(--primary-color)' } } },
                            { action: { type: 'set_flag', payload: { flagId: 'defeated_test_thugs', value: true } } },
                            { action: { type: 'effect', payload: { gold: 150 } } },
                            { action: { type: 'add_item', payload: { itemId: 'item_energy_drink', quantity: 1 } } }
                        ],
                        defeatActionBlock: [
                            { action: { type: 'log', payload: { text: '你被狠狠地教训了一顿，混混们搜走了你身上一些财物。', color: 'var(--error-color)' } } },
                            { action: { type: 'effect', payload: { gold: -100 } } },
                            { action: { type: 'remove_item', payload: { itemId: 'item_energy_drink', quantity: 1, log: '你被抢走了一罐功能饮料。', logColor: 'var(--text-muted-color)' } } },
                            { action: { type: 'modify_variable', payload: { varId: 'thug_defeat_count', operation: 'add', value: 1, log: '（你感觉更了解街头生存的残酷了。）', logColor: 'var(--skill-color)' } } }
                        ]
                    } 
                } 
            }
        ] },
    "location_community": { name: "小区门口", description: "熟悉的小区，门口就是公交站。", imageUrl: "images/location_community.png", hotspots: [
            { label: "回家", x: 20, y: 85, interaction: { type: 'interactive_dialogue', payload: {
                title: "回家",
                options: [
                    { text: "返回房间", actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_home' } } } ] },
                    { text: "算了", actionBlock: [] }
                ]
            } } },
            { label: "查看大地图", x: 50, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '出行方式',
                textAlign: 'center',
                options: [
                    { text: '查看城市地图', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '还是算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } }
        ] },
    "location_downtown": { 
        name: "市中心广场", 
        description: "人来人往的市中心广场，杭城的心脏。", 
        imageUrl: "images/location_downtown.png", 
        hotspots: [
            { label: "返回大地图", x: 80, y: 85, interaction: { type: 'interactive_dialogue', payload: {
                title: '返回大地图',
                options: [
                    { text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } },
            { label: "地上的钱包", x: 40, y: 60, interaction: { type: 'interactive_dialogue', payload: {
                imageUrl: 'images/item_wallet.png', 
                title: '地上的钱包',
                text: '你发现地上有一个鼓鼓囊囊的钱包。\n你会怎么做？',
                options: [
                    { text: '【拾金不昧】交到失物招领处', actionBlock: [
                        { action: { type: 'log', payload: { text: '你捡起钱包，送到了旁边的失物招领处。感觉心里很踏实。' } } },
                        { action: { type: 'destroy_hotspot' } }
                    ]},
                    { text: '【收入囊中】这下发财了！', actionBlock: [
                        { action: { type: 'log', payload: { text: '你迅速捡起钱包塞进了口袋，心脏怦怦直跳。' } } },
                        { action: { type: 'effect', payload: { gold: 500 } } },
                         { action: { type: 'destroy_hotspot' } }
                    ]}
                ]
            }}},
            { 
                label: "公告栏", x: 65, y: 30, 
                interaction: { 
                    type: 'interactive_dialogue', 
                    payload: {
                        imageUrl: 'images/location_board.png',
                        title: '公告栏',
                        dialogueText: '这里有很多兼职信息可以接取。',
                        options: [
                            { 
                                text: '看看有什么兼职',
                                subDialogue: {
                                    type: 'job_board',
                                    payload: {
                                        title: '兼职公告栏',
                                        jobs: [
                                            { id: 'job_flyer' },
                                            { id: 'job_waiter' },
                                            { id: 'job_tutor' },
                                        ]
                                    }
                                }
                            },
                            {
                                text: '汇报传单派发工作',
                                conditions: [{ type: 'variable', varId: 'q_job_flyer', comparison: '==', value: 1 }],
                                actionBlock: [
                                    { action: { type: 'complete_quest', payload: { questId: 'quest_job_flyer' } } }
                                ]
                            },
                            {
                                text: '汇报家教工作',
                                conditions: [{ type: 'variable', varId: 'q_job_tutor', comparison: '==', value: 1 }],
                                actionBlock: [
                                    { action: { type: 'complete_quest', payload: { questId: 'quest_job_tutor' } } }
                                ]
                            },
                            { text: '下次再说', actionBlock: [] }
                        ]
                    }
                }
            }
        ] 
    },
    "location_old_home": { name: "老家的房子", description: "充满回忆的旧屋，院子里有棵大槐树。", imageUrl: "images/location_old_home.png", hotspots: [
            { label: "返回地图", x: 50, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '返回地图',
                options: [
                    { text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } }
        ] },
	"location_grandma_home": { name: "姥姥家的房子", description: "姥姥就住在老家隔壁，你小时候经常在这里玩。", imageUrl: "images/location_grandma_home.png", hotspots: [
            { label: "返回地图", x: 60, y: 60, 
				interaction: { 
					type: 'interactive_dialogue', 
					payload: {
						title: '返回地图',
						options: [
							{ text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
							{ text: '算了', actionBlock: [], class: 'secondary-action' }
						]
            } } },
			
			{ label: "姥姥", x: 60, y: 40, interaction: { type: 'interactive_dialogue', payload: {
                title: '姥姥', 
                imageUrl: 'images/grandma.png',
                dialogueText: [
                    '哎呦，外孙来啦！快让姥姥看看！',
                    '乖孙想吃什么？\n姥姥给你做。'
                ],
                options: [
                    { text: '“姥姥身体健康。”', 
						actionBlock: [],
                        followUp: {
                          dialogueText: '姥姥笑得很灿烂：“乖孙，来，给你零花钱。”',
                          options: [
                              { text: '“谢谢姥姥。”', actionBlock: [ 
                                  { action: { type: 'log', payload: { text: '姥姥往你手里塞了200块。' } } },
								  { action: { type: 'log', payload: { text: '你获得了<strong><span style="color:var(--error-color)">200</span></strong>元' } } },
                                  { action: { type: 'effect', payload: { gold: 200 } } },
                                ] 
                              }
                          ]
                      }
                    },
                    { text: '“姥姥，这是我妈让我给您带的咸鱼。”',
					  conditions: [
                                    { type: 'variable', varId: 'q_visit_grandma', comparison: '==', value: 1 }
                                ],
                      actionBlock: [
								  { action: { type: 'remove_item', payload: { itemId: 'item_salted_fish', quantity: 2 } } },
								  { action: { type: 'complete_quest', payload: { questId: 'quest_visit_grandma' } } },
                                ],
					  followUp: {
						  dialogueText: '姥姥接过咸鱼：“有心了。”',
						  options: [
                              { text: '“嘿嘿。”', 
							    actionBlock: [ 
                                ] 
                              }
                          ]
                      }
                    },
                    
                ]
            }}},
			
        ] },
};



