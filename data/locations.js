/**
 * @file data/locations.js
 * @description 游戏内容 - 统一世界地图与地点数据 (v67.0.0)
 * @author Gemini (CTO)
 * @version 67.0.0
 */

// [重构] 初始化唯一的地图和地点挂载点
window.gameData.maps = {};
window.gameData.locations = {};

// --- [世界地图] 定义我们游戏中唯一的地图 ---
window.gameData.maps.world = {
    name: "世界地图",
    nodes: {
        // 杭城区域
        "map_node_home":      { name: "家",      icon: gameData.icons.home, x: 20, y: 25, interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_community' } } } ] } },
        "map_node_downtown":  { name: "市中心",  icon: gameData.icons.work, x: 40, y: 40, interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_downtown' } } } ] } },
        "map_node_bus_station": { name: "汽车客运站", icon: gameData.icons.bus, x: 60, y: 55, interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_NODE_BUS_STATION" } } },
        // 老家区域
        "map_node_hometown_station": { name: "老家客运站", icon: gameData.icons.bus, x: 80, y: 70, interaction: { type: 'action_block', payload: [{ action: { type: 'log', payload: {text: '你走出了老家的客运站。'}}}]}},
        "map_node_old_home": { name: "老家", icon: gameData.icons.home, x: 85, y: 50, interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_old_home' } } } ] } },
        "map_node_grandma_home": { name: "姥姥家", icon: '👵', x: 90, y: 40, interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_grandma_home' } } } ] } },
        "map_node_market": { name: "菜市场", icon: gameData.icons.market, x: 78, y: 35, interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_NODE_MARKET" } } },
    },
    // [修改] 更新连接关系以反映统一地图
    connections: [ 
        ["map_node_home", "map_node_downtown"], 
        ["map_node_downtown", "map_node_bus_station"],
        ["map_node_bus_station", "map_node_hometown_station"], // 关键连接
        ["map_node_hometown_station", "map_node_old_home"],
        ["map_node_old_home", "map_node_grandma_home"],
        ["map_node_old_home", "map_node_market"]
    ]
};


// --- [地点] 将所有地点数据整合到此文件 ---
Object.assign(window.gameData.locations, {
    "start_creation": { name: "命运的十字路口", description: "回忆如潮水般涌来...", imageUrl: null, hotspots: [] },
    // 杭城地点
    "location_living_room": {
        name: "客厅",
        description: "一个温馨的小客厅，妈妈正坐在沙发上看电视。",
        imageUrl: "images/location_home.png",
        hotspots: [
            { label: "出门", icon: "🚪", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_community' } } }] } },
            { label: "妈妈", interaction: { type: 'start_dialogue', payload: { dialogueId: 'DIALOGUE_MOM_GREETING' } } },
            { label: "电视", icon: "📺", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_TV_NEWS" } } },
            { label: "厨房", icon: "🍳", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_kitchen' } } }] } },
            { label: "卫生间", icon: "🚻", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_restroom' } } }] } },
            { label: "我的房间", icon: "👤", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_my_room' } } }] } },
            { label: "妈妈的房间", icon: "👩", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_moms_room' } } }] } }
        ],
        discoveries: [
            { x: 85, y: 30, interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_PHOTO_ALBUM" } }, animation: { fadeInDuration: '0.8s', period: '3s', scaleMin: 0.8, scaleMax: 1.1, color: 'var(--sparkle-color)' } },
            { x: 20, y: 70, activationConditions: [ { type: 'variable', varId: VARS.A_LETTER_APPEARED, comparison: '==', value: 1 } ], deactivationConditions: [ { type: 'variable', varId: VARS.LETTER_READ, comparison: '==', value: 1 } ], interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_MYSTERY_LETTER" } }, animation: { fadeInDuration: '1.5s', period: '2s', scaleMin: 0.9, scaleMax: 1.3, color: '#2980b9' } },
            { x: 50, y: 50, interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_MYSTERY_SWITCH" } } }
        ]
    },
    "location_my_room": {
        name: "你的房间",
        description: "一个温馨的小房间，是你休憩的港湾。",
        imageUrl: "images/location_my_room.png",
        hotspots: [
            { label: "返回客厅", icon: "🚪", interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } } ] } },
            { label: "床", icon: "🛏️", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_BED_OPTIONS" } } },
            { 
                label: "电脑", 
                icon: "💻", 
                interaction: { 
                    type: 'start_dialogue', 
                    payload: { dialogueId: 'DIALOGUE_COMPUTER_CHOICE' }
                } 
            },
            { label: "沙袋", icon: "🥊", interaction: { type: 'combat', payload: { enemies: [ { id: 'thug', quantity: 2 }, { id: 'thug_leader', quantity: 1 } ], fleeable: false, victoryPrompt: '你干净利落地解决了麻烦！', defeatPrompt: '双拳难敌众手...', victoryActionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.DEFEATED_TEST_THUGS, operation: 'set', value: 1 } } }, { action: { type: 'effect', payload: { gold: 150 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 1 } } } ], defeatActionBlock: [ { action: { type: 'log', payload: { text: '你被狠狠地教训了一顿，混混们搜走了你身上一些财物。', color: 'var(--error-color)' } } }, { action: { type: 'effect', payload: { gold: -100 } } }, { action: { type: 'remove_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 1 } } }, { action: { type: 'modify_variable', payload: { varId: VARS.THUG_DEFEAT_COUNT, operation: 'add', value: 1, log: '（你感觉更了解街头生存的残酷了。）', logColor: 'var(--skill-color)' } } } ] } } }
        ]
    },
    "location_moms_room": { name: "妈妈的房间", description: "房间收拾得很整洁。", imageUrl: "images/location_moms_room.png", hotspots: [ { label: "返回客厅", icon: "🚪", interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } } ] } } ] },
    "location_kitchen": { name: "厨房", description: "干净的厨房，冰箱里塞满了食材。", imageUrl: "images/location_kitchen.png", hotspots: [ { label: "返回客厅", icon: "🚪", interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } } ] } } ] },
    "location_restroom": { name: "卫生间", description: "空间不大，但很干净。", imageUrl: "images/location_restroom.png", hotspots: [ { label: "返回客厅", icon: "🚪", interaction: { type: 'action_block', payload: [ { action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } } ] } } ] },
    "location_community": { 
        name: "小区门口", 
        description: "熟悉的小区，门口就是公交站。", 
        imageUrl: "images/location_community.png", 
        hotspots: [
            { label: "回家", icon: "🏠", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] } },
            { label: "3号楼", icon: "🏢", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_lobby_3' } } }] } },
            { label: "查看大地图", icon: "🗺️", interaction: { type: 'action_block', payload: [{ action: { type: 'showMap' } }] } }
        ] 
    },
    "location_lobby_3": {
        name: "3号楼大堂",
        description: "明亮的大堂，左手边是信箱，正前方是电梯。",
        imageUrl: "images/location_lobby.png",
        hotspots: [
            { label: "走出大楼", icon: "🚪", interaction: { type: 'action_block', payload: [{ action: { type: 'enter_location', payload: { locationId: 'location_community' } } }] } },
            { label: "电梯", icon: "↕️", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_ELEVATOR_CHOICE" } } }
        ]
    },
    "location_downtown": {
        name: "市中心广场",
        description: "人来人往的市中心广场，杭城的心脏。",
        imageUrl: "images/location_downtown.png",
        hotspots: [
            { label: "返回大地图", icon: "🗺️", interaction: { type: 'action_block', payload: [{ action: { type: 'showMap' } }] } },
            { label: "地上的钱包", icon: "💰", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_WALLET_CHOICE" } } },
            { label: "公告栏", icon: "📋", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_JOB_BOARD" } } }
        ]
    },
    // 老家地点
    "location_old_home": { name: "老家的房子", description: "充满回忆的旧屋。", imageUrl: "images/location_old_home.png", hotspots: [ { label: "返回地图", icon: "🗺️", interaction: { type: 'action_block', payload: [{ action: { type: 'showMap' } }] } } ] },
	"location_grandma_home": { name: "姥姥家的房子", description: "姥姥就住在老家隔壁。", imageUrl: "images/location_grandma_home.png", hotspots: [
            { label: "返回地图", icon: "🗺️", interaction: { type: 'action_block', payload: [{ action: { type: 'showMap' } }] } },
			{ label: "姥姥", icon: "👵", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_GRANDMA_GREETING" } } }
        ] },
    "location_market": {
        name: "老家菜市场",
        description: "一个充满烟火气的地方。",
        imageUrl: "images/location_market.png",
        hotspots: [
            { label: "返回地图", icon: "🗺️", interaction: { type: 'action_block', payload: [{ action: { type: 'showMap' } }] } },
            { label: "肉摊", icon: "🍖", interaction: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_BUTCHER_GREETING" } } }
        ]
    }
});