/**
 * @file data/items.js
 * @description 游戏内容 - 物品与装备 (v52.1.0 - Bug修复)
 */
window.gameData.items = {
    "item_phone": { 
        name: "智能手机", type: "key_item",
        description: "现代人的必需品，记录着你的点点滴滴。", 
        droppable: false,
        imageUrl: 'images/item_phone.png',
        useDescription: "提供各种便利功能，是都市生活的必需品。<br>似乎可以用来打电话。"
    },
    "item_newbie_pack": {
        name: "新手大礼包", type: "consumable",
        description: "一个看起来很普通的包裹，上面写着“祝你在杭城一帆风顺”。",
        droppable: false,
        imageUrl: 'images/item_newbie_pack.png',
        useDescription: "一个为新人准备的神秘礼包。",
        // [修复] 将旧的show_dialogue改为标准的start_dialogue动作
        onUseActionBlock: [
            { action: { type: 'start_dialogue', payload: { dialogueId: "DIALOGUE_NEWBIE_PACK_OPEN" } } }
        ]
    },
    "item_energy_drink": { 
        name: "功能饮料", type: "consumable", 
        description: "一罐能让你瞬间精神抖擞的神奇液体，但似乎对健康没什么好处。", 
        droppable: true,
        imageUrl: 'images/item_energy_drink.png',
        useDescription: "饮用后，能快速补充大量精力，但会稍微损害健康。",
        onUseActionBlock: [
            { action: { type: 'log', payload: { text: '你喝下功能饮料，感觉精力充沛，但心脏有些不舒服。', color: 'var(--primary-color)' } } },
            { action: { type: 'effect', payload: { mp: 40, hp: -5 } } }
        ]
    },
    "item_salted_fish": {
        name: "咸鱼", type: "material", 
        description: "妈妈让你带给姥姥的咸鱼，闻起来很香。",
        droppable: true,
        imageUrl: 'images/item_salted_fish.png',
        useDescription: "一条平平无奇的咸鱼，也许可以直接吃，也许有别的用途。"
    },
    "item_ribs": {
        name: "新鲜的排骨", type: "material", 
        description: "从菜市场买来的新鲜排骨，很重。",
        droppable: true,
        imageUrl: 'images/item_ribs.png',
        useDescription: "新鲜的食材，烹饪后应该会很美味。"
    },
    "equip_wood_sword": {
        name: "练习用木剑", type: "equipment", slot: "mainHand",
        description: "少年，来挥洒青春的汗水吧！",
        droppable: true,
        imageUrl: 'images/equip_wood_sword.png',
        useDescription: "装备后能提升你的攻击能力。",
        effect: { attack: 2 }
    },
    "equip_baseball_cap": {
        name: "棒球帽", type: "equipment", slot: "head",
        description: "一顶普通的棒球帽，能带来些许好运。",
        droppable: true,
        imageUrl: 'images/equip_baseball_cap.png',
        useDescription: "装备后能提升你的机运。",
        effect: { lck: 1 }
    },
    "equip_tshirt": {
        name: "旧T恤", type: "equipment", slot: "body",
        description: "一件宽松舒适的旧T恤，让你感觉很安心。",
        droppable: true,
        imageUrl: 'images/equip_tshirt.png',
        useDescription: "装备后能提升你的体质，增加健康上限。",
        effect: { con: 1 }
    },
    "equip_jeans": {
        name: "牛仔裤", type: "equipment", slot: "legs",
        description: "耐磨的牛仔裤，方便活动。",
        droppable: true,
        imageUrl: 'images/equip_jeans.png',
        useDescription: "装备后能提升你的灵巧。",
        effect: { dex: 1 }
    },
    "equip_runners": {
        name: "跑鞋", type: "equipment", slot: "feet",
        description: "一双轻便的跑鞋，跑起来虎虎生风。",
        droppable: true,
        imageUrl: 'images/equip_runners.png',
        useDescription: "装备后能提升你的行动力。",
        effect: { spd: 2 }
    },
    "equip_clover": {
        name: "幸运四叶草", type: "equipment", slot: "accessory",
        description: "一枚精心塑封的四叶草标本，似乎真的能带来好运。",
        droppable: true,
        imageUrl: 'images/equip_clover.png',
        useDescription: "装备后能大幅提升你的机运，并带来一些学识。",
        effect: { lck: 2, int: 1 }
    }
};