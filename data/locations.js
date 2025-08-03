/**
 * @file data/locations.js
 * @description 游戏内容 - 统一世界地图与地点数据 (v84.3.0 - [优化] 统一沦陷区入口交互)
 * @author Gemini (CTO)
 * @version 84.3.0
 */

window.gameData.maps = {};
window.gameData.locations = {};

// --- 世界地图 ---
window.gameData.maps.nation = {
    name: "全国地图",
    nodes: {
        "map_nation_hangcheng": {
            name: "杭城", icon: '🏙️', x: 35, y: 45,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_hangcheng_gate', nodeId: 'map_nation_hangcheng' } } }]
        },
        "map_nation_yuhang": {
            name: "余杭镇", icon: '🏞️', x: 65, y: 60,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_yuhang_exit', nodeId: 'map_nation_yuhang' } } }]
        }
    },
    connections: [
        ["map_nation_hangcheng", "map_nation_yuhang"]
    ]
};


// --- 区域地图 ---
window.gameData.maps.hangcheng = {
    name: "杭城基地市",
    nodes: {
        "map_hangcheng_home":       { name: "家", icon: gameData.icons.home, x: 20, y: 25,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_community', nodeId: 'map_hangcheng_home' } } }]
        },
        "map_hangcheng_downtown":   { name: "市中心", icon: gameData.icons.work, x: 40, y: 40,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_downtown', nodeId: 'map_hangcheng_downtown' } } }]
        },
        "map_hangcheng_bus_station":{ name: "汽车客运站", icon: gameData.icons.bus,  x: 60, y: 55,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_bus_station', nodeId: 'map_hangcheng_bus_station' }} }]
        },
        "map_hangcheng_gate":       { name: "基地市大门", icon: '⛩️', x: 80, y: 75,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_hangcheng_gate', nodeId: 'map_hangcheng_gate' } } }]
        },
        // [核心修改] 沦陷区入口现在也使用标准的 enter_location 动作，并传入自定义文本
        "map_hangcheng_fallen_zone_entry": { name: "沦陷区入口", icon: '☣️', x: 90, y: 50,
            interactions: [{
                action: {
                    type: 'enter_location',
                    payload: {
                        locationId: 'location_fallen_highway',
                        nodeId: 'map_hangcheng_fallen_zone_entry',
                        confirmationTitle: '区域警告',
                        confirmationText: '前方是未经净化的沦陷区，充满了危险的怪物。你确定要外出探索吗？'
                    }
                }
            }]
        }
    },
    connections: [
        ["map_hangcheng_home", "map_hangcheng_downtown"],
        ["map_hangcheng_downtown", "map_hangcheng_bus_station"],
        ["map_hangcheng_bus_station", "map_hangcheng_gate"],
        ["map_hangcheng_gate", "map_hangcheng_fallen_zone_entry"]
    ]
};

window.gameData.maps.yuhang = {
    name: "余杭镇",
    nodes: {
        "map_yuhang_bus_station": { name: "老家客运站", icon: gameData.icons.bus,  x: 80, y: 70,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_yuhang_bus_station', nodeId: 'map_yuhang_bus_station' }} }]
        },
        "map_yuhang_home":        { name: "老家", icon: gameData.icons.home, x: 85, y: 50,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_old_home', nodeId: 'map_yuhang_home' } } }]
        },
        "map_yuhang_grandma_home":{ name: "姥姥家", icon: '👵', x: 90, y: 40,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_grandma_home', nodeId: 'map_yuhang_grandma_home' } } }]
        },
        "map_yuhang_market": {
            name: "菜市场", icon: gameData.icons.market, x: 78, y: 35,
            interactions: [
                {
                    conditions: [{ type: 'time', allowedPhases: [0, 1, 2, 3] }],
                    action: { type: 'enter_location', payload: { locationId: 'location_market', nodeId: 'map_yuhang_market' } }
                },
                {
                    action: { type: 'enter_location', payload: { locationId: 'location_market_night', nodeId: 'map_yuhang_market' } }
                }
            ]
        },
        "map_yuhang_gate":        { name: "镇出口", icon: '🚧', x: 60, y: 85,
            interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_yuhang_exit', nodeId: 'map_yuhang_gate' } } }]
        },
        "map_yuhang_secret_garden": {
            name: "秘密花园", icon: '🌸', x: 90, y: 85,
            interactions: [
                {
                    conditions: [{ type: 'variable', varId: VARS.FOUND_SECRET_GARDEN, comparison: '==', value: 1 }],
                    action: { type: 'enter_location', payload: { locationId: 'location_secret_garden', nodeId: 'map_yuhang_secret_garden' } }
                }
            ]
        }
    },
    connections: [
        ["map_yuhang_bus_station", "map_yuhang_home"],
        ["map_yuhang_home", "map_yuhang_grandma_home"],
        ["map_yuhang_home", "map_yuhang_market"],
        ["map_yuhang_bus_station", "map_yuhang_gate"]
    ]
};


// --- [场景] 定义游戏中的所有具体地点 ---
Object.assign(window.gameData.locations, {
    "start_creation": { name: "命运的十字路口", description: "回忆如潮水般涌来...", imageUrl: null, hotspots: [] },

    "location_fallen_highway": {
        name: "废弃公路",
        description: "曾经繁忙的国道如今一片死寂，生锈的汽车残骸随处可见，风中传来不知名生物的低吼。",
        imageUrl: "images/location_fallen_highway.png",
        hotspots: [
            { label: "返回基地市大门", icon: "⛩️", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_hangcheng_gate' } } }] },
            {
                label: "调查汽车残骸",
                icon: "🚗",
                interactions: [{
                    action: {
                        type: 'combat',
                        payload: {
                            enemies: [ { id: 'mutated_rat', quantity: 2 } ],
                            fleeable: true,
                            victoryPrompt: '你解决了躲在车里的怪物！',
                            victoryActionBlock: [
                                { action: { type: 'log', payload: { text: '你在车里找到了一些有用的物资。', color: 'var(--log-color-success)' } } },
                                { action: { type: 'effect', payload: { gold: 50 } } },
                                { action: { type: 'add_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 1 } } },
                                { action: { type: 'destroy_scene_element' } }
                            ]
                        }
                    }
                }]
            }
        ]
    },
    "location_bus_station": {
        name: "杭城汽车客运站",
        description: "宽敞的候车大厅，电子屏幕上滚动着班次信息。",
        imageUrl: "images/location_bus_station.png",
        hotspots: [
            { label: "前往余杭镇", icon: "🏞️", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_TRAVEL_TO_YUHANG" } } }] },
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'hangcheng', nodeId: 'map_hangcheng_bus_station' } } }] },
        ]
    },
    "location_yuhang_bus_station": {
        name: "余杭镇客运站",
        description: "一个有些陈旧但很干净的小镇车站。",
        imageUrl: "images/location_bus_station_small.png",
        hotspots: [
            { label: "返回杭城", icon: "🏙️", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_TRAVEL_TO_HANGCHENG" } } }] },
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang', nodeId: 'map_yuhang_bus_station' } } }] },
        ]
    },
    "location_hangcheng_gate": {
        name: "杭城基地市大门",
        description: "高大的合金闸门是基地市的唯一屏障，墙外的世界已被怪物占据。",
        imageUrl: "images/location_gate.png",
        hotspots: [
            { label: "返回市内地图", icon: "🏙️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'hangcheng', nodeId: 'map_hangcheng_gate' } } }] },
            { label: "离开基地市", icon: "🌍", interactions: [{ action: { type: 'action_block', payload: [
                { action: { type: 'log', payload: { text: "你离开了杭城基地市，准备前往其他地区。" } } },
                { action: { type: 'change_map', payload: { mapId: 'nation', nodeId: 'map_nation_hangcheng' } } }
            ] } }] }
        ]
    },
    "location_yuhang_exit": {
        name: "余杭镇出口",
        description: "一条尘土飞扬的小路延伸向远方，路边立着一块褪色的路牌。",
        imageUrl: "images/location_exit.png",
        hotspots: [
            { label: "进入余杭镇", icon: "🏞️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang', nodeId: 'map_yuhang_gate' } } }] },
            { label: "离开余杭镇", icon: "🌍", interactions: [{ action: { type: 'action_block', payload: [
                { action: { type: 'log', payload: { text: "你告别了宁静的小镇，准备返回喧嚣的都市。" } } },
                { action: { type: 'change_map', payload: { mapId: 'nation', nodeId: 'map_nation_yuhang' } } }
            ] } }] }
        ]
    },
    "location_living_room": {
        name: "客厅",
        description: "一个温馨的小客厅，妈妈正坐在沙发上看电视。",
        imageUrl: "images/location_home.png",
        hotspots: [
            { label: "出门", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_community' } } }] },
            { label: "妈妈", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: 'DIALOGUE_MOM_GREETING' } } }] },
            { label: "电视", icon: "📺", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_TV_NEWS" } } }] },
            { label: "厨房", icon: "🍳", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_kitchen' } } }] },
            { label: "卫生间", icon: "🚻", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_restroom' } } }] },
            { label: "我的房间", icon: "👤", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_my_room' } } }] },
            { label: "妈妈的房间", icon: "👩", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_moms_room' } } }] }
        ],
        discoveries: [
            { x: 85, y: 30, interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_PHOTO_ALBUM" } } }], animation: { fadeInDuration: '0.8s', period: '3s', scaleMin: 0.8, scaleMax: 1.1, color: 'var(--sparkle-color)' } },
            {
              x: 20, y: 70,
              interactions: [
                {
                    conditions: [
                        { type: 'variable', varId: VARS.A_LETTER_APPEARED, comparison: '==', value: 1 },
                        { type: 'variable', varId: VARS.LETTER_READ, comparison: '!=', value: 1 }
                    ],
                    action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_MYSTERY_LETTER" } }
                }
              ],
              animation: { fadeInDuration: '1.5s', period: '2s', scaleMin: 0.9, scaleMax: 1.3, color: '#2980b9' }
            },
            { x: 50, y: 50, interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_MYSTERY_SWITCH" } } }] }
        ]
    },
    "location_my_room": {
        name: "你的房间",
        description: "一个温馨的小房间，是你休憩的港湾。",
        imageUrl: "images/location_my_room.png",
        hotspots: [
            { label: "返回客厅", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] },
            { label: "床", icon: "🛏️", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_BED_OPTIONS" } } }] },
            { label: "电脑", icon: "💻", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: 'DIALOGUE_COMPUTER_CHOICE' } } }] },
            { label: "沙袋", icon: "🥊", interactions: [{ action: { type: 'combat', payload: { enemies: [ { id: 'thug', quantity: 2 }, { id: 'thug_leader', quantity: 1 } ], fleeable: false, victoryPrompt: '你干净利落地解决了麻烦！', defeatPrompt: '双拳难敌众手...', victoryActionBlock: [ { action: { type: 'modify_variable', payload: { varId: VARS.DEFEATED_TEST_THUGS, operation: 'set', value: 1 } } }, { action: { type: 'effect', payload: { gold: 150 } } }, { action: { type: 'add_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 1 } } } ], defeatActionBlock: [ { action: { type: 'log', payload: { text: '你被狠狠地教训了一顿，混混们搜走了你身上一些财物。', color: 'var(--error-color)' } } }, { action: { type: 'effect', payload: { gold: -100 } } }, { action: { type: 'remove_item', payload: { itemId: ITEMS.ENERGY_DRINK, quantity: 1 } } }, { action: { type: 'modify_variable', payload: { varId: VARS.THUG_DEFEAT_COUNT, operation: 'add', value: 1, log: '（你感觉更了解街头生存的残酷了。）', logColor: 'var(--skill-color)' } } } ] } } }] }
        ]
    },
    "location_moms_room": { name: "妈妈的房间", description: "房间收拾得很整洁。", imageUrl: "images/location_moms_room.png", hotspots: [ { label: "返回客厅", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] } ] },
    "location_kitchen": { name: "厨房", description: "干净的厨房，冰箱里塞满了食材。", imageUrl: "images/location_kitchen.png", hotspots: [ { label: "返回客厅", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] } ] },
    "location_restroom": { name: "卫生间", description: "空间不大，但很干净。", imageUrl: "images/location_restroom.png", hotspots: [ { label: "返回客厅", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] } ] },
    "location_community": {
        name: "小区门口",
        description: "熟悉的小区，门口就是公交站。",
        imageUrl: "images/location_community.png",
        hotspots: [
            { label: "回家", icon: "🏠", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_living_room' } } }] },
            { label: "3号楼", icon: "🏢", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_lobby_3' } } }] },
            { label: "查看区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'hangcheng' } } }] }
        ]
    },
    "location_lobby_3": {
        name: "3号楼大堂",
        description: "明亮的大堂，左手边是信箱，正前方是电梯。",
        imageUrl: "images/location_lobby.png",
        hotspots: [
            { label: "走出大楼", icon: "🚪", interactions: [{ action: { type: 'enter_location', payload: { locationId: 'location_community' } } }] },
            { label: "电梯", icon: "↕️", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_ELEVATOR_CHOICE" } } }] }
        ]
    },
    "location_downtown": {
        name: "市中心广场",
        description: "人来人往的市中心广场，杭城的心脏。",
        imageUrl: "images/location_downtown.png",
        hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'hangcheng' } } }] },
            { label: "地上的钱包", icon: "💰", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_WALLET_CHOICE" } } }] },
            { label: "公告栏", icon: "📋", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_JOB_BOARD" } } }] }
        ]
    },
    "location_old_home": {
        name: "老家的房子",
        description: "充满回忆的旧屋。",
        imageUrl: "images/location_old_home.png",
        hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang' } } }] }
        ]
    },
	"location_grandma_home": { name: "姥姥家的房子", description: "姥姥就住在老家隔壁。", imageUrl: "images/location_grandma_home.png", hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang' } } }] },
			{ label: "姥姥", icon: "👵", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_GRANDMA_GREETING" } } }] }
        ] },
    "location_market": {
        name: "老家菜市场",
        description: "一个充满烟火气的地方。",
        imageUrl: "images/location_market.png",
        hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang' } } }] },
            { label: "肉摊", icon: "🍖", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_BUTCHER_GREETING" } } }] }
        ]
    },
    "location_market_night": {
        name: "夜晚的菜市场",
        description: "摊位都已收起，只剩下几盏昏暗的路灯，巷子深处似乎有些动静。",
        imageUrl: "images/location_market_night.png",
        hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang' } } }] },
            { label: "阴暗的巷子", icon: "🦇", interactions: [{ action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_DARK_ALLEY" } } }] }
        ]
    },
    "location_secret_garden": {
        name: "秘密花园",
        description: "一个被遗忘的美丽花园，空气中弥漫着花香。",
        imageUrl: "images/location_park.png",
        hotspots: [
            { label: "返回区域地图", icon: "🗺️", interactions: [{ action: { type: 'change_map', payload: { mapId: 'yuhang' } } }] }
        ]
    },
    "location_cheat_room": {
        name: "随身空间",
        description: "一个绝对安全的私人空间，你可以在这里整理思绪。",
        imageUrl: "images/location_study.png",
        hotspots: [
            {
                label: "离开",
                icon: "🚪",
                interactions: [{
                    action: {
                        type: "action_block",
                        payload: [
                            { action: { type: 'exit_pocket_dimension' } }
                        ]
                    }
                }]
            }
        ]
    }
});