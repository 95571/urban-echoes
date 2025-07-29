/**
 * @file data/items.js
 * @description 游戏内容 - 物品与装备 (v57.0.0 - [优化] 区分装备基础属性与Buff)
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
            { action: { type: 'add_effect', payload: { effectId: 'eff_energy_boost' } } }
        ]
    },
    "item_healing_agent_long": {
        name: "长效治疗剂", type: "consumable",
        description: "一支缓释型治疗针剂，能在一段时间内持续促进身体恢复，并激发潜能。",
        droppable: true,
        imageUrl: 'images/item_healing_agent.png',
        useDescription: "使用后，在接下来的一段时间里持续恢复你的健康，并获得多种增益效果。",
        onUseActionBlock: [
            { action: { type: 'add_effect', payload: { effectId: 'eff_regeneration' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_courage' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_focus' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_fortitude' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_agility' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_insight' } } }
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
        useDescription: "装备后能提升你的攻击能力和行动力。",
        // [新增] effect 属性代表装备的【基础属性】，不可移除
        effect: { attack: 2 }, 
        // onEquipActionBlock 代表装备的【附加/附魔属性】，可通过移除Buff来改变
        onEquipActionBlock: [
            { action: { type: 'add_effect', payload: { effectId: 'eff_precision_mastery' } } },
			{ action: { type: 'add_effect', payload: { effectId: 'eff_sharpness' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_swiftness' } } }
        ],
        onUnequipActionBlock: [
            { action: { type: 'remove_effect', payload: { effectId: 'eff_precision_mastery' } } },
			{ action: { type: 'remove_effect', payload: { effectId: 'eff_sharpness' } } },
            { action: { type: 'remove_effect', payload: { effectId: 'eff_swiftness' } } }
        ]
    },
	"equip_iron_sword": {
        name: "铁剑", type: "equipment", slot: "mainHand",
        description: "一把平平无奇的铁剑！",
        droppable: true,
        imageUrl: 'images/equip_iron_sword.png',
        useDescription: "装备后能提升你的攻击能力和行动力。",
        effect: { attack: 5 }, 
        onEquipActionBlock: [
            { action: { type: 'add_effect', payload: { effectId: 'eff_precision_mastery' } } },
			{ action: { type: 'add_effect', payload: { effectId: 'eff_sharpness' } } },
            { action: { type: 'add_effect', payload: { effectId: 'eff_swiftness' } } }
        ],
        onUnequipActionBlock: [
            { action: { type: 'remove_effect', payload: { effectId: 'eff_precision_mastery' } } },
			{ action: { type: 'remove_effect', payload: { effectId: 'eff_sharpness' } } },
            { action: { type: 'remove_effect', payload: { effectId: 'eff_swiftness' } } }
        ]
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
        effect: { con: 1 },
		onEquipActionBlock: [
            { action: { type: 'add_effect', payload: { effectId: 'eff_scholars_blessing' } } },
        ],
        onUnequipActionBlock: [
            { action: { type: 'remove_effect', payload: { effectId: 'eff_scholars_blessing' } } },
        ]
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