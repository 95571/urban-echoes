/**
 * @file data/monsters.js
 * @description 游戏内容 - 怪物数据 (v84.0.0 - [原型] 新增野外怪物)
 * @author Gemini (CTO)
 * @version 84.0.0
 */
window.gameData.monsters = { 
    "thug": { id: "thug", name: "小混混", stats: { str: 8, dex: 4, int: 2, con: 8, lck: 3 }, fleeable: true },
    "thug_leader": { id: "thug_leader", name: "混混头目", stats: { str: 12, dex: 6, int: 4, con: 10, lck: 5 }, fleeable: false },

    // [新增] 第一个野外怪物
    "mutated_rat": {
        id: "mutated_rat",
        name: "变异鼠",
        stats: { str: 6, dex: 8, int: 1, con: 5, lck: 2 },
        fleeable: true
    }
};