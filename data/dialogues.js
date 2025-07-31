/**
 * @file data/dialogues.js
 * @description 游戏内容 - 扁平化对话节点 (v79.0.0 - [地图重构] 修复节点点击状态预更新BUG)
 * @version 79.0.0
 */
window.gameData.dialogues = {
    // --- 地图节点移动确认对话 ---
    "DIALOGUE_CONFIRM_ENTER_HANGCHENG": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要进入【杭城】吗？' }],
        options: [
            { text: "进入", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_hangcheng_gate', nodeId: 'map_nation_hangcheng' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_YUHANG": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要进入【余杭镇】吗？' }],
        options: [
            { text: "进入", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_yuhang_exit', nodeId: 'map_nation_yuhang' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_COMMUNITY": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要前往【小区】吗？' }],
        options: [
            { text: "前往", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_community', nodeId: 'map_hangcheng_home' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_DOWNTOWN": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要前往【市中心】吗？' }],
        options: [
            { text: "前往", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_downtown', nodeId: 'map_hangcheng_downtown' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_GATE": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要前往【城门检查站】吗？' }],
        options: [
            { text: "前往", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_hangcheng_gate', nodeId: 'map_hangcheng_gate' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_OLD_HOME": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要进入【老家的房子】吗？' }],
        options: [
            { text: "进入", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_old_home', nodeId: 'map_yuhang_home' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_GRANDMA_HOME": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要前往【姥姥家】吗？' }],
        options: [
            { text: "前往", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_grandma_home', nodeId: 'map_yuhang_grandma_home' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_EXIT": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要前往【镇出口】吗？' }],
        options: [
            { text: "前往", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_yuhang_exit', nodeId: 'map_yuhang_gate' } } }] },
            { text: "取消" }
        ]
    },
    "DIALOGUE_CONFIRM_ENTER_SECRET_GARDEN": {
        dialogueText: [{ avatar: 'images/location_map.png', name: '旅行提示', text: '你确定要进入【秘密花园】吗？' }],
        options: [
            { text: "进入", actionBlock: [{ action: { type: 'enter_location', payload: { locationId: 'location_secret_garden', nodeId: 'map_yuhang_secret_garden' } } }] },
            { text: "取消" }
        ]
    },

    // --- 原有对话 ---
    "DIALOGUE_CHEAT_MENU": {
        dialogueText: [{ avatar: 'images/item_phone.png', text: '一个隐藏的开发者菜单。' }],
        options: [
            {
                text: "进入随身空间",
                conditions: [
                    { type: 'variable', varId: VARS.CHEAT_UNLOCKED, comparison: '==', value: 1 }
                ],
                actionBlock: [
                    { action: { type: 'enter_pocket_dimension', payload: { locationId: 'location_cheat_room' } } }
                ]
            },
            { text: "关闭" }
        ]
    },
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
    "DIALOGUE_NEWBIE_PACK_OPEN": {
        dialogueText: [{ avatar: 'images/item_newbie_pack.png', text: '这是一个新手大礼包，打开它吧！' }],
        options: [ { text: '打开', actionBlock: [ { action: { type: 'log', payload: { text: '你打开了新手大礼包，获得了一整套新手装备！', color: 'var(--log-color-success)' } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.WOOD_SWORD, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.IRON_SWORD, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.BASEBALL_CAP, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.TSHIRT, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.JEANS, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.RUNNERS, quantity: 1 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.CLOVER, quantity: 1 } } } ] } ]
    },
    "DIALOGUE_ELEVATOR_CHOICE": {
        dialogueText: [{ avatar: 'images/elevator.png', text: '电梯来了，你要去几楼？' }],
        options: [ { text: '6楼 (晓雨家)', actionBlock: [ { action: { type: 'log', payload: { text: '你按下了6楼の按钮，电梯缓缓上升...' } } } ] }, { text: '9楼 (阿明家)', actionBlock: [ { action: { type: 'log', payload: { text: '你按下了9楼の按钮，电梯缓缓上升...' } } } ] }, { text: '离开电梯' } ]
    },
    "DIALOGUE_NODE_BUS_STATION": {
        dialogueText: [{ avatar: 'images/bus.png', name: '旅行提示', text: '你要去哪里？' }],
        options: [
            {
                text: `前往余杭镇 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`,
                actionBlock: [
                    { action: { type: 'log', payload: { text: '你坐上了长途汽车...' } } },
                    { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                    { action: { type: 'change_map', payload: { mapId: 'yuhang', nodeId: 'map_yuhang_bus_station' } } },
                    { action: { type: 'log', payload: { text: '经过一路奔波，你抵达了老家。', color: 'var(--log-color-primary)' } } }
                ]
            },
            { text: '我再想想' }
        ]
    },
    "DIALOGUE_NODE_HOMETOWN_STATION": {
        dialogueText: [{ avatar: 'images/bus.png', name: '旅行提示', text: '你走出了老家の客运站，要去哪里？' }],
        options: [
            {
                text: `返回杭城 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`,
                actionBlock: [
                    { action: { type: 'log', payload: { text: '你坐上了返回杭城の长途汽车...' } } },
                    { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                    { action: { type: 'change_map', payload: { mapId: 'hangcheng', nodeId: 'map_hangcheng_bus_station' } } },
                    { action: { type: 'log', payload: { text: '你回到了熟悉の杭城。', color: 'var(--log-color-primary)' } } }
                ]
            },
            {
                text: `在镇上逛逛`,
                 actionBlock: [
                    { action: { type: 'log', payload: {text: '你走出了老家の客运站。'}}}
                 ]
            }
        ]
    },
    "DIALOGUE_NODE_MARKET": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '老家の菜市场，充满了烟火气。' }],
        options: [ { text: '进去逛逛', conditions: [{ type: 'time', allowedPhases: [0, 1, 2, 3] }], actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_market', nodeId: 'map_yuhang_market' } } } ] }, { text: '菜市场已关门 (06:00-18:00)', conditions: [{ type: 'time', allowedPhases: [4, 5] }], transitionTo: "DIALOGUE_NODE_MARKET_CLOSED" }, { text: '算了' } ]
    },
    "DIALOGUE_NODE_MARKET_CLOSED": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: "菜市场已经打烊了，明天再来吧。" }],
        options: [{text: "好吧"}]
    },
    "DIALOGUE_TV_NEWS": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '电视正在播放新闻：“……近日，我市警方成功打掉一个在市中心活动の诈骗团伙，提醒广大市民注意防范……”' }],
        options: [ { text: "继续观看", transitionTo: "DIALOGUE_TV_NEWS_CONTINUE" }, { text: "关掉电视" } ]
    },
    "DIALOGUE_TV_NEWS_CONTINUE": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '你觉得有点无聊，关掉了电视。'}],
        options: [{ text: "关闭" }]
    },
    "DIALOGUE_PHOTO_ALBUM": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '一本落满灰尘の旧相册，里面是满满の童年回忆。' }],
        options: [
            {
                text: "打开相册",
                actionBlock: [
                    { action: { type: 'log', payload: { text: "你发现了记忆深处の秘境。", color: 'var(--log-color-primary)' } } },
                    { action: { type: 'modify_variable', payload: { varId: VARS.FOUND_SECRET_GARDEN, operation: 'set', value: 1 } } }
                ]
            },
            {
                text: "合上相册，尘封记忆",
                conditions: [
                    { type: 'variable', varId: VARS.FOUND_SECRET_GARDEN, comparison: '==', value: 1 }
                ],
                actionBlock: [
                    { action: { type: 'log', payload: { text: "你合上了相册，关于那个地方の记忆也随之模糊...", color: 'var(--text-muted-color)' } } },
                    { action: { type: 'modify_variable', payload: { varId: VARS.FOUND_SECRET_GARDEN, operation: 'set', value: 0 } } }
                ]
            },
            { text: "默默放回" }
        ]
    },
    "DIALOGUE_MYSTERY_LETTER": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '窗台上放着一封未署名の信，信封是蓝色の。你要打开它吗？' }],
        options: [ { text: "打开看看", actionBlock: [ { action: { type: 'log', payload: { text: "信里只有一句话：'我在市中心广场等你。'" } } }, { action: { type: 'modify_variable', payload: { varId: VARS.LETTER_READ, operation: 'set', value: 1 } } } ] }, { text: "暂时不看" } ]
    },
    "DIALOGUE_MYSTERY_SWITCH": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '一个神秘の开关。' }],
        options: [ { text: "按下开关 (开启蓝点)", actionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.A_LETTER_APPEARED, operation: 'set', value: 1 } } } ] }, { text: "再次按下 (关闭蓝点)", actionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.A_LETTER_APPEARED, operation: 'set', value: 0 } } } ] } ]
    },
    "DIALOGUE_BED_OPTIONS": {
        dialogueText: [{ avatar: 'images/player_dialogue.png', text: '你要休息一下吗？' }],
        options: [ { text: "小睡一会儿 (推进1个时间段)", actionBlock: [ { action: { type: 'log', payload: { text: "你躺在床上小睡了一会儿..." } } }, { action: { type: 'advanceTime', payload: { phases: 1 } } }, { action: { type: 'effect', payload: { mp: 50, hp: 10 } } } ] }, { text: "睡到第二天早上", actionBlock: [ { action: { type: 'log', payload: { text: "你决定好好睡一觉，迎接新の一天。" } } }, { action: { type: 'advanceTime', payload: { until: 'next_morning' } } }, { action: { type: 'action', payload: { id: 'fullHeal' } } } ] }, { text: "还是算了" } ]
    },
    "DIALOGUE_WALLET_CHOICE": {
        dialogueText: [{ avatar: 'images/item_wallet.png', text: '你发现地上有一个鼓鼓囊囊の钱包。\n你会怎么做？' }],
        options: [ { text: '【拾金不昧】交到失物招领处', actionBlock: [ { action: { type: 'log', payload: { text: '你捡起钱包，送到了旁边の失物招领处。感觉心里很踏实。' } } }, { action: { type: 'destroy_scene_element' } } ]}, { text: '【收入囊中】这下发财了！', actionBlock: [ { action: { type: 'log', payload: { text: '你迅速捡起钱包塞进了口袋，心脏怦怦直跳。' } } }, { action: { type: 'effect', payload: { gold: 500 } } }, { action: { type: 'destroy_scene_element' } } ]} ]
    },
    "DIALOGUE_JOB_BOARD": {
        dialogueText: [{ avatar: 'images/location_board.png', text: '这里有很多兼职信息可以接取。' }],
        options: [ { text: '看看有什么兼职', subDialogue: { type: 'job_board', payload: { title: '兼职公告栏', jobs: [ { id: JOBS.FLYER }, { id: JOBS.WAITER }, { id: JOBS.TUTOR } ] } } }, { text: '汇报传单派发工作', conditions: [{ type: 'variable', varId: VARS.Q_JOB_FLYER, comparison: '==', value: 1 }], actionBlock: [ { action: { type: 'complete_quest', payload: { questId: QUESTS.JOB_FLYER } } } ] }, { text: '汇报家教工作', conditions: [{ type: 'variable', varId: VARS.Q_JOB_TUTOR, comparison: '==', value: 1 }], actionBlock: [ { action: { type: 'complete_quest', payload: { questId: QUESTS.JOB_TUTOR } } } ] }, { text: '下次再说' } ]
    },
    "DIALOGUE_GRANDMA_GREETING": {
        dialogueText: [ { avatar: 'images/grandma.png', name: '姥姥', text: '哎呦，外孙来啦！快让姥姥看看！' }, { avatar: 'images/grandma.png', name: '姥姥', text: '乖孙想吃什么？姥姥给你做。' } ],
        options: [ { text: '“姥姥身体健康。”', transitionTo: "DIALOGUE_GRANDMA_GIVE_MONEY" }, { text: '“姥姥，这是我妈让我给您带の咸鱼。”', conditions: [ { type: 'variable', varId: VARS.Q_VISIT_GRANDMA, comparison: '==', value: 1 }, { type: 'has_item', itemId: ITEMS.SALTED_FISH, quantity: 2 } ], actionBlock: [ { action: { type: 'remove_item', payload: { itemId: ITEMS.SALTED_FISH, quantity: 2 } } }, { action: { type: 'complete_quest', payload: { questId: QUESTS.VISIT_GRANDMA } } } ], transitionTo: "DIALOGUE_GRANDMA_AFTER_FISH" }, { text: '“姥姥，排骨买回来啦！”', conditions: [ { type: 'variable', varId: VARS.Q_BUY_RIBS, comparison: '==', value: 1 }, { type: 'has_item', itemId: ITEMS.RIBS, quantity: 2 } ], actionBlock: [ { action: { type: 'remove_item', payload: { itemId: ITEMS.RIBS, quantity: 2 } } }, { action: { type: 'complete_quest', payload: { questId: QUESTS.BUY_RIBS } } } ] } ]
    },
    "DIALOGUE_GRANDMA_GIVE_MONEY": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '姥姥笑得很灿烂：“乖孙，来，给你零花钱。”' }],
        options: [ { text: '“谢谢姥姥。”', actionBlock: [ { action: { type: 'log', payload: { text: '姥姥往你手里塞了200块。' } } }, { action: { type: 'effect', payload: { gold: 200 } } } ] } ]
    },
    "DIALOGUE_GRANDMA_AFTER_FISH": {
        dialogueText: [{ avatar: 'images/grandma.png', name: '姥姥', text: '姥姥接过咸鱼：“有心了。”'}],
        options: [ { text: '“嘿嘿，姥姥喜欢吃咸鱼吗？”', transitionTo: "DIALOGUE_GRANDMA_LOVE_FISH" }, { text: '“咸鱼有什么好吃の？我喜欢吃排骨。”', conditions: [{ type: 'variable', varId: VARS.Q_BUY_RIBS, comparison: '!=', value: 1 }], transitionTo: "DIALOGUE_GRANDMA_GIVE_RIBS_QUEST" } ]
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
        dialogueText: [{ avatar: 'images/butcher.png', name: '肉摊贩子', text: '“好嘞！给你挑最好の！拿好！”' }],
        options: [ { text: '“谢谢老板。”' } ]
    }
};