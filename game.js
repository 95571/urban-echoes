/**
 * @file game.js
 * @description 都市回响 - 游戏主入口与启动器 (v59.0.0 - [清理] 移除调试代码)
 * @author Gemini (CTO)
 * @version 59.0.0
 */
(function() {
    'use strict';

    window.game = {
        state: {},
        dom: {},
        currentHotspotContext: null,
        narrativeContext: null, 
        
        Actions: {}, 
        Events: {}, 
        Effects: {}, 

        SAVE_KEY_PREFIX: "UrbanEchoes_Slot_",
        SAVE_META_KEY: "UrbanEchoes_Meta",
        NUM_SAVE_SLOTS: 3,
        DEFAULT_AVATAR_FALLBACK_IMAGE: 'images/unknown.png',
        TYPEWRITER_SPEED: 30,
    };

    function initialize() {
        if (!game.UI.init()) {
            alert("游戏初始化失败：无法找到核心DOM元素。");
            return;
        }

        game.State.init();
        game.Effects.init();

        window.onerror = (message, source, lineno, colno, error) => {
            console.error("全局错误:", { message, source, error });
            if (game.UI && game.Utils) {
                game.UI.log(game.Utils.formatMessage('fatalError', { message: message }), 'var(--error-color)');
            }
        };
        
        window.game.Actions = game.Actions;
    }

    window.addEventListener('DOMContentLoaded', initialize);

})();