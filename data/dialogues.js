/**
 * @file data/dialogues.js
 * @description 游戏内容 - 扁平化对话节点 (v55.2.1 - [新增] 电脑对话)
 */
window.gameData.dialogues = {
    // --- [新增] 电脑交互 ---
    "DIALOGUE_COMPUTER_CHOICE": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '电脑屏幕上显示着一个“公司福利”活动页面。' }],
        options: [
            { 
                text: '领取“功能饮料”赞助 (x10)', 
                actionBlock: [{ action: { type: 'add_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 10 } } }] 
            },
            { 
                text: '领取“长效治疗剂”样品 (x5)', 
                actionBlock: [{ action: { type: 'add_item', payload: { itemId: 'item_healing_agent_long', quantity: 5 } } }] 
            },
            { text: '关闭页面' }
        ]
    },

    // --- 妈妈的对话 ---
    "DIALOGUE_MOM_GREETING": {
        dialogueText: [ { avatar: 'images/mother_normal.png', name: '妈妈', text: '回来了啊，孩子。今天过得怎么样？' }, { avatar: 'images/mother_normal.png', name: '妈妈', text: '工作不着急找，先玩一段时间。' } ],
        options: [ { text: '“还行，投了几份简历。”', actionBlock: [{ action: { type: 'log', payload: { text: '妈妈欣慰地点点头：“不着急，慢慢来，总能找到合适的。”' } } }] }, { text: '“别提了，有点不顺利...”', transitionTo: "DIALOGUE_MOM_COMFORT" }, { text: '“妈，我想回趟老家。”', conditions: [{ type: 'variable', varId: VARS.Q_VISIT_GRANDMA, comparison: '!=', value: 1 }], transitionTo: "DIALOGUE_MOM_GIVE_FISH_QUEST" }, { text: '“妈，我饿了。”', transitionTo: "DIALOGUE_MOM_IM_HUNGRY" } ]
    },
    "DIALOGUE_MOM_COMFORT": {
        dialogueText: [ { avatar: 'images/mother_smile.png', name: '妈妈', text: '没关系，刚毕业都这样。' }, { avatar: 'images/mother_smile.png', name: '妈妈', text: '先吃饭，吃饱了才有力气想别的。' } ],
        options: [ { text: '“嗯...谢谢妈。”', actionBlock: [ { action: { type: 'log', payload: { text: '你感到一阵暖心。' } } }, { action: { type: 'effect', payload: { mp: 10 } } } ] } ]
    },
    "DIALOGUE_MOM_GIVE_FISH_QUEST": {
        dialogueText: [ { avatar: 'images/mother_normal.png', name: '妈妈', text: '对，正好给你姥姥带两条咸鱼，她唠叨好久了。' } ],
        options: [ { text: '“好嘞！” (获得咸鱼x2，接取任务)', actionBlock: [ { action: { type: 'add_item', payload: { itemId: ITEMS.SALTED_FISH, quantity: 2 } } }, { action: { type: 'acceptJob', payload: { jobId: JOBS.VISIT_GRANDMA } } } ] } ]
    },
    "DIALOGUE_MOM_IM_HUNGRY": {
        dialogueText: [ { avatar: 'images/mother_smile.png', name: '妈妈', text: '厨房里有饭菜，自己去热热吃吧。' } ],
        options: [ { text: '“好的，谢谢妈。”' } ]
    },

    // --- 新手礼包 ---
    "DIALOGUE_NEWBIE_PACK_OPEN": {
        dialogueText: [{ avatar: 'images/item_newbie_pack.png', text: '这是一个新手大礼包，打开它吧！' }],
        options: [ { text: '打开', actionBlock: [ { action: { type: 'log', payload: { text: '你打开了新手大礼包，获得了一整套新手装备！', color: 'var(--log-color-success)' } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.WOOD_SWORD, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.IRON_SWORD, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.BASEBALL_CAP, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.TSHIRT, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.JEANS, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.RUNNERS, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.CLOVER, quantity: 1 } } } ] } ]
    },

    // --- 电梯 ---
    "DIALOGUE_ELEVATOR_CHOICE": {
        dialogueText: [{ avatar: 'images/elevator.png', text: '电梯来了，你要去几楼？' }],
        options: [ { text: '6楼 (晓雨家)', actionBlock: [ { action: { type: 'log', payload: { text: '你按下了6楼的按钮，电梯缓缓上升...' } } } ] }, { text: '9楼 (阿明家)', actionBlock: [ { action: { type: 'log', payload: { text: '你按下了9楼的按钮，电梯缓缓上升...' } } } ] }, { text: '离开电梯' } ]
    },

    // --- 地图节点对话 ---
    "DIALOGUE_NODE_DOWNTOWN": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '要去市中心广场看看吗？' }],
        options: [ { text: '进入广场 (消耗1时间段)', actionBlock: [ { action: { type: 'advanceTime', payload: { phases: 1 } } }, { action: { type: 'enter_location', payload: { locationId: 'location_downtown' } } } ]}, { text: `[作弊] ${gameData.icons.cheat} 属性+1`, conditions: [{ type: 'variable', varId: VARS.CHEAT_UNLOCKED, comparison: '==', value: 1 }], actionBlock: [ { action: { type: 'effect', payload: { stats: { str: 1, dex: 1, int: 1, con: 1, lck: 1 } } } }, { action: { type: 'log', payload: { text: '一道光芒闪过，你感觉自己变强了！', color: 'var(--skill-color)' } } } ]}, { text: '还是算了' } ]
    },
    "DIALOGUE_NODE_BUS_STATION": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', name: '售票员', text: '你要去哪里？' }],
        options: [ { text: `回老家 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [ { action: { type: 'log', payload: { text: '你坐上了长途汽车...' } } }, { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } }, { action: { type: 'map_transition', payload: { targetMapId: "hometown", targetStartNode: "map_node_hometown_station" } } }, { action: { type: 'log', payload: { text: '经过一路奔波，你抵达了新的地方。', color: 'var(--log-color-primary)' } } } ]}, { text: '我再想想' } ]
    },
    "DIALOGUE_NODE_HOMETOWN_STATION": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '准备回杭城吗？' }],
        options: [ { text: `返回杭城 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [ { action: { type: 'log', payload: { text: '你坐上了返回杭城的汽车...' } } }, { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } }, { action: { type: 'map_transition', payload: { targetMapId: "hangcheng", targetStartNode: "map_node_bus_station" } } }, { action: { type: 'log', payload: { text: '经过一路奔波，你回到了杭城。', color: 'var(--log-color-primary)' } } } ]}, { text: '在老家再待会儿' } ]
    },
    "DIALOGUE_NODE_MARKET": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '老家的菜市场，充满了烟火气。' }],
        options: [ { text: '进去逛逛', conditions: [{ type: 'time', allowedPhases: [0, 1, 2, 3] }], actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_market' } } } ] }, { text: '菜市场已关门 (06:00-18:00)', conditions: [{ type: 'time', allowedPhases: [4, 5] }], transitionTo: "DIALOGUE_NODE_MARKET_CLOSED" }, { text: '算了' } ]
    },
    "DIALOGUE_NODE_MARKET_CLOSED": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: "菜市场已经打烊了，明天再来吧。" }],
        options: [{text: "好吧"}]
    },

    // --- 场景交互对话 ---
    "DIALOGUE_TV_NEWS": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '电视正在播放新闻：“……近日，我市警方成功打掉一个在市中心活动的诈骗团伙，提醒广大市民注意防范……”' }],
        options: [ { text: "继续观看", transitionTo: "DIALOGUE_TV_NEWS_CONTINUE" }, { text: "关掉电视" } ]
    },
    "DIALOGUE_TV_NEWS_CONTINUE": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '你觉得有点无聊，关掉了电视。'}],
        options: [{ text: "关闭" }]
    },
    "DIALOGUE_PHOTO_ALBUM": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '一本落满灰尘的旧相册，里面是满满的童年回忆。' }],
        options: [{ text: "默默放回" }]
    },
    "DIALOGUE_MYSTERY_LETTER": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '窗台上放着一封未署名的信，信封是蓝色的。你要打开它吗？' }],
        options: [ { text: "打开看看", actionBlock: [ { action: { type: 'log', payload: { text: "信里只有一句话：'我在市中心广场等你。'" } } }, { action: { type: 'modify_variable', payload: { varId: VARS.LETTER_READ, operation: 'set', value: 1 } } } ] }, { text: "暂时不看" } ]
    },
    "DIALOGUE_MYSTERY_SWITCH": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '一个神秘的开关。' }],
        options: [ { text: "按下开关 (开启蓝点)", actionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.A_LETTER_APPEARED, operation: 'set', value: 1 } } } ] }, { text: "再次按下 (关闭蓝点)", actionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.A_LETTER_APPEARED, operation: 'set', value: 0 } } } ] } ]
    },
    "DIALOGUE_BED_OPTIONS": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '你要休息一下吗？' }],
        options: [ { text: "小睡一会儿 (推进1个时间段)", actionBlock: [ { action: { type: 'log', payload: { text: "你躺在床上小睡了一会儿..." } } }, { action: { type: 'advanceTime', payload: { phases: 1 } } }, { action: { type: 'effect', payload: { mp: 50, hp: 10 } } } ] }, { text: "睡到第二天早上", actionBlock: [ { action: { type: 'log', payload: { text: "你决定好好睡一觉，迎接新的一天。" } } }, { action: { type: 'advanceTime', payload: { until: 'next_morning' } } }, { action: { type: 'action', payload: { id: 'fullHeal' } } } ] }, { text: "还是算了" } ]
    },
    "DIALOGUE_WALLET_CHOICE": {
        dialogueText: [{ avatar: 'images/item_wallet.png', text: '你发现地上有一个鼓鼓囊囊的钱包。\n你会怎么做？' }],
        options: [ { text: '【拾金不昧】交到失物招领处', actionBlock: [ { action: { type: 'log', payload: { text: '你捡起钱包，送到了旁边的失物招领处。感觉心里很踏实。' } } }, { action: { type: 'destroy_scene_element' } } ]}, { text: '【收入囊中】这下发财了！', actionBlock: [ { action: { type: 'log', payload: { text: '你迅速捡起钱包塞进了口袋，心脏怦怦直跳。' } } }, { action: { type: 'effect', payload: { gold: 500 } } }, { action: { type: 'destroy_scene_element' } } ]} ]
    },
    "DIALOGUE_JOB_BOARD": {
        dialogueText: [{ avatar: 'images/location_board.png', text: '这里有很多兼职信息可以接取。' }],
        options: [ { text: '看看有什么兼职', subDialogue: { type: 'job_board', payload: { title: '兼职公告栏', jobs: [ { id: JOBS.FLYER }, { id: JOBS.WAITER }, { id: JOBS.TUTOR } ] } } }, { text: '汇报传单派发工作', conditions: [{ type: 'variable', varId: VARS.Q_JOB_FLYER, comparison: '==', value: 1 }], actionBlock: [ { action: { type: 'complete_quest', payload: { questId: QUESTS.JOB_FLYER } } } ] }, { text: '汇报家教工作', conditions: [{ type: 'variable', varId: VARS.Q_JOB_TUTOR, comparison: '==', value: 1 }], actionBlock: [ { action: { type: 'complete_quest', payload: { questId: QUESTS.JOB_TUTOR } } } ] }, { text: '下次再说' } ]
    },
    "DIALOGUE_GRANDMA_GREETING": {
        dialogueText: [ { avatar: 'images/grandma.png', name: '姥姥', text: '哎呦，外孙来啦！快让姥姥看看！' }, { avatar: 'images/grandma.png', name: '姥姥', text: '乖孙想吃什么？姥姥给你做。' } ],
        options: [ { text: '“姥姥身体健康。”', transitionTo: "DIALOGUE_GRANDMA_GIVE_MONEY" }, { text: '“姥姥，这是我妈让我给您带的咸鱼。”', conditions: [ { type: 'variable', varId: VARS.Q_VISIT_GRANDMA, comparison: '==', value: 1 }, { type: 'has_item', itemId: ITEMS.SALTED_FISH, quantity: 2 } ], actionBlock: [ { action: { type: 'remove_item', payload: { itemId: ITEMS.SALTED_FISH, quantity: 2 } } }, { action: { type: 'complete_quest', payload: { questId: QUESTS.VISIT_GRANDMA } } } ], transitionTo: "DIALOGUE_GRANDMA_AFTER_FISH" }, { text: '“姥姥，排骨买回来啦！”', conditions: [ { type: 'variable', varId: VARS.Q_BUY_RIBS, comparison: '==', value: 1 }, { type: 'has_item', itemId: ITEMS.RIBS, quantity: 2 } ], actionBlock: [ { action: { type: 'remove_item', payload: { itemId: ITEMS.RIBS, quantity: 2 } } }, { action: { type: 'complete_quest', payload: { questId: QUESTS.BUY_RIBS } } } ] } ]
    },
    "DIALOGUE_GRANDMA_GIVE_MONEY": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '姥姥笑得很灿烂：“乖孙，来，给你零花钱。”' }],
        options: [ { text: '“谢谢姥姥。”', actionBlock: [ { action: { type: 'log', payload: { text: '姥姥往你手里塞了200块。' } } }, { action: { type: 'effect', payload: { gold: 200 } } } ] } ]
    },
    "DIALOGUE_GRANDMA_AFTER_FISH": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '姥姥接过咸鱼：“有心了。”'}],
        options: [ { text: '“嘿嘿，姥姥喜欢吃咸鱼吗？”', transitionTo: "DIALOGUE_GRANDMA_LOVE_FISH" }, { text: '“咸鱼有什么好吃的？我喜欢吃排骨。”', conditions: [{ type: 'variable', varId: VARS.Q_BUY_RIBS, comparison: '!=', value: 1 }], transitionTo: "DIALOGUE_GRANDMA_GIVE_RIBS_QUEST" } ]
    },
    "DIALOGUE_GRANDMA_LOVE_FISH": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '“那可太喜欢了，每周必吃！”' }],
        options: [ { text: '（结束对话）' } ]
    },
    "DIALOGUE_GRANDMA_GIVE_RIBS_QUEST": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '“你喜欢吃排骨？那给你个任务。\n去菜市场买2斤排骨，姥姥中午给你做排骨吃。”' }],
        options: [ { text: '“好的！”', actionBlock: [ { action: { type: 'log', payload: { text: '姥姥给了你100元买排骨。' } } }, { action: { type: 'effect', payload: { gold: 100 } } }, { action: { type: 'acceptJob', payload: { jobId: JOBS.BUY_RIBS } } } ] } ]
    },
    "DIALOGUE_BUTCHER_GREETING": {
        dialogueText: [{ avatar: 'images/butcher.png', name: '肉摊贩子', text: '“小伙子，买点什么？肉都新鲜得很！”' }],
        options: [ { text: '“老板，来1斤排骨。” (30金)', conditions: [ { type: 'stat', stat: 'gold', comparison: '>=', value: 30 } ], actionBlock: [ { action: { type: 'effect', payload: { gold: -30 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.RIBS, quantity: 1 } } } ], transitionTo: "DIALOGUE_BUTCHER_BOUGHT_RIBS" }, { text: '（钱不够买排骨）', conditions: [ { type: 'stat', stat: 'gold', comparison: '<', value: 30 } ] }, { text: '“随便看看。”' } ]
    },
    "DIALOGUE_BUTCHER_BOUGHT_RIBS": {
        dialogueText: [{ avatar: 'images/butcher.png', name: '肉摊贩子', text: '“好嘞！给你挑最好的！拿好！”' }],
        options: [ { text: '“谢谢老板。”' } ]
    }
};