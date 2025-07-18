/**
 * @file data/player.js
 * @description 游戏内容 - 初始玩家状态
 */
window.gameData.initialPlayerState = {
    id: "player", name: "无名者", gold: 0,
    hp: 100, maxHp: 100, mp: 100,  maxMp: 100,
    stats: { str: 5, dex: 5, int: 5, con: 5, lck: 5 },
    derivedStats: {},
    inventory: [ 
        { id: "item_phone", quantity: 1 },
        { id: "item_newbie_pack", quantity: 1 }
    ],
    equipped: {
        mainHand: { name: "主手", itemId: null },
        head:     { name: "头部", itemId: null },
        body:     { name: "上身", itemId: null },
        legs:     { name: "下身", itemId: null },
        feet:     { name: "脚部", itemId: null },
        accessory: { name: "饰品", itemId: null }
    },
    skillState: { "skill_eloquence": { level: 1, proficiency: 0, unlockedPerks: [] } },
    quests: {}, 
    flags: { cheat_unlocked: false },
    variables: {},
    menu: { current: null, skillDetailView: null, statusViewTargetId: null, inventoryFilter: '全部' },
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