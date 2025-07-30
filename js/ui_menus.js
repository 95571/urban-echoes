/**
 * @file js/ui_menus.js
 * @description UI模块 - 菜单渲染器注册中心 (v64.0.0 - [重构] 拆分为独立模块)
 * @author Gemini (CTO)
 * @version 64.0.0
 */
(function() {
    'use strict';
    
    // 初始化所有菜单渲染器的“挂载点”
    if (!window.game.UI) window.game.UI = {};
    window.game.UI.menuRenderers = {};

})();