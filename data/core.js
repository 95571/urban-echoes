/**
 * @file data/core.js
 * @description 游戏内容 - 核心设定 (v84.0.0 - [原型] 实现市内移动零成本)
 * @author Gemini (CTO)
 * @version 84.0.0
 */
window.gameData.icons = { 
    str: '💪', dex: '🤸', int: '🧠', con: '❤️', lck: '🍀', 
    health: '❤️', energy: '⚡', gold: '💰',
    attack:'⚔️', defense:'🛡️', spd: '🏃',
    location: '📍', unknown: '❓', quest: '📜', time: '🕒',
    home: '🏠', work: '🏢', study: '📚', shop: '🛍️', park: '🌳', bus: '🚌',
    market: '🛒',
    cheat: '🛠️',
    save: '💾', load: '📂', export: '📤', import: '📥'
};
window.gameData.statNames = {
    str: '体魄', dex: '灵巧', int: '学识', con: '健康', lck: '机运'
};
window.gameData.settings = {
    timePhases: ['清晨', '上午', '中午', '下午', '晚上', '深夜'],
    weekDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    travelTime: {
        'bus_long_distance': 4,
        'bus_short_distance': 1
    },
    narrativeUiSceneBlur: false,
    // [核心改造] 将标准移动成本清零，实现基地市（安全区）内的自由移动
    STANDARD_MOVE_COST: {
        time: 0,
        energy: 0
    }
};
window.gameData.screenTitles = {
    "TITLE": "都市回响", 
    "STATUS": "状态详情", "INVENTORY": "持有物品", "QUESTS": "任务日志",
    "PARTY": "人际关系", "SYSTEM": "杭城旧梦", "MAP": "地图" ,
    "SEQUENCE": "人生的选择"
};
window.gameData.formulas_primary = {
    maxHp: 'con * 10 + 50', maxMp: 'int * 5 + con * 5 + 50',
    attack: 'str * 2', defense: 'con * 1', spd: '10 + dex',
};
window.gameData.systemMessages = {
    achievementsContent: {
        title: "成就殿堂",
        html: "<p>此功能正在开发中，敬请期待您在杭城中的每一个高光时刻被铭记。</p>",
    },
    aboutContent: {
        title: "关于《都市回响》",
        html: "<p><strong>创意总监:</strong> [您的名字]<br><strong>首席产品/技术:</strong> Gemini</p><p>这是一款我们共同构筑的，关于在现代都市中探索、成长与生活的故事模拟器。</p><p>特别鸣谢每一位体验这个世界的玩家。</p>",
    },
    systemConfirm: {
        title: "系统提示"
    },
    overwriteSave: {
        title: "覆盖存档",
        html: "此操作将覆盖当前存档槽中的数据，是否继续？"
    },
    loadConfirm: {
        title: "读取游戏",
        html: "加载新存档将覆盖当前未保存的进度，确定要继续吗？"
    },
    resetConfirm: {
        title: "重置游戏",
        html: "【危险操作】此操作将删除所有本地存档和游戏设置，且无法恢复。您确定要彻底重置游戏吗？"
    },
    dropItemConfirm: {
        title: "丢弃物品",
        html: "你确定要丢弃这个物品吗？"
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
    getItemLoot: "获得了 [${itemName}] x${quantity}。",
    equipItem: "装备了 [${itemName}]。",
    unequipItem: "卸下了 [${itemName}]。",
    itemDropped: "你丢弃了 ${itemName} x${quantity}。",
    fullHeal: "你好好休息了一下，健康和精力都完全恢复了！",
    jobAccepted: "新任务：【${jobName}】已添加到你的任务日志。",
    jobAlreadyActive: "你已经接取了任务：【${jobName}】。",
    jobRequirementsNotMet: "由于不满足条件，你无法接受【${jobName}】这份工作。<br><small>要求：${requirementsText}</small>",
    questCompleted: "任务完成：【${questName}】！",
};