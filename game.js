/**
 * @file game.js
 * @description 都市回响 - 游戏主入口与启动器 (v24.10 - 模块化重构)
 * @author Gemini (CTO)
 * @version 24.10.0
 */
(function() {
    'use strict';

    // 初始化全局游戏命名空间
    window.game = {
        // --- 核心变量 ---
        state: {}, // 存放完整的游戏状态对象 (由 state.js 模块管理)
        dom: {},   // 存放所有缓存的DOM元素 (由 ui.js 模块管理)
        currentHotspotContext: null, // 存放当前交互的热点区域上下文

        // --- 核心常量 ---
        SAVE_KEY_PREFIX: "UrbanEchoes_Slot_",
        SAVE_META_KEY: "UrbanEchoes_Meta",
        NUM_SAVE_SLOTS: 3,
        DEFAULT_AVATAR_FALLBACK_IMAGE: 'images/unknown.png',
        TYPEWRITER_SPEED: 30, // ms per character
    };

    /**
     * @function initialize
     * @description 游戏启动函数，在DOM加载完毕后执行
     */
    function initialize() {
        // 1. 初始化UI模块，缓存DOM元素并绑定基础事件
        if (!game.UI.init()) {
            alert("游戏初始化失败：无法找到核心DOM元素。");
            return;
        }

        // 2. 初始化状态模块，这将加载存档或创建新游戏
        game.State.init();

        // 3. 设置全局错误处理器，将未捕获的错误显示在游戏日志中
        window.onerror = (message, source, lineno, colno, error) => {
            console.error("全局错误:", { message, source, error });
            // 确保UI模块已加载，可以显示错误信息
            if (game.UI && game.Utils) {
                game.UI.log(game.Utils.formatMessage('fatalError', { message: message }), 'var(--error-color)');
            }
        };

        // 将核心动作集暴露到全局，方便HTML中的onclick调用
        // 这是为了保持HTML中简洁的 `onclick="game.Actions.someAction()"` 写法
        window.game.Actions = game.Actions;
    }

    // 等待DOM完全加载后，启动游戏
    window.addEventListener('DOMContentLoaded', initialize);

})();