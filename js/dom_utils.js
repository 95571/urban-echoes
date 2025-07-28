/**
 * @file js/dom_utils.js
 * @description UI模块 - DOM元素创建与操作工具 (v54.2.0 - [重构] 新增 makeListDraggable)
 * @description [新增] 为解决HTML字符串拼接问题，引入组件化思想的基石。
 * @author Gemini (CTO)
 * @version 54.2.0
 */
(function() {
    'use strict';

    /**
     * 创建一个DOM元素并设置其属性和子元素。
     * @param {string} tag - HTML标签名 (例如, 'div', 'button').
     * @param {object} [options={}] - 元素的属性和配置。
     * - className: 元素的CSS类名 (字符串)。
     * - id: 元素的ID。
     * - textContent: 元素的文本内容。
     * - innerHTML: 元素的内部HTML。
     * - style: 一个包含CSS属性的对象 (例如, { color: 'red', '--custom-color': '#fff' })。
     * - dataset: 一个包含data-*属性的对象 (例如, { action: 'save', slot: '1' })。
     * - attributes: 一个包含其他HTML属性的对象 (例如, { type: 'text', disabled: true })。
     * - eventListeners: 一个包含事件监听器的对象 (例如, { click: (e) => console.log('clicked') })。
     * @param {Array<HTMLElement|string>} [children=[]] - 要追加的子元素或文本节点数组。
     * @returns {HTMLElement} 创建的DOM元素。
     */
    function createElement(tag, options = {}, children = []) {
        const el = document.createElement(tag);

        if (options.className) el.className = options.className;
        if (options.id) el.id = options.id;
        if (options.textContent) el.textContent = options.textContent;
        if (options.innerHTML) el.innerHTML = options.innerHTML;

        if (options.style) {
            // [修复] 迭代样式对象以正确设置标准属性和自定义属性
            for (const prop in options.style) {
                if (prop.startsWith('--')) {
                    el.style.setProperty(prop, options.style[prop]);
                } else {
                    el.style[prop] = options.style[prop];
                }
            }
        }

        if (options.dataset) {
            for (const key in options.dataset) {
                el.dataset[key] = options.dataset[key];
            }
        }

        if (options.attributes) {
            for (const key in options.attributes) {
                el.setAttribute(key, options.attributes[key]);
            }
        }
        
        if (options.eventListeners) {
            for (const event in options.eventListeners) {
                el.addEventListener(event, options.eventListeners[event]);
            }
        }

        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });

        return el;
    }
    
    /**
     * [新增] 使一个元素支持点击/触摸拖拽滚动。
     * @param {HTMLElement} element - 目标元素。
     */
    function makeListDraggable(element) {
        if (!element || element.scrollHeight <= element.clientHeight) { 
            element.classList.remove('is-scrollable'); 
            return; 
        }
        element.classList.add('is-scrollable');
        let isDown = false, startY, scrollTop;
        const start = e => { isDown = true; element.style.cursor = 'grabbing'; startY = (e.pageY || e.touches[0].pageY) - element.offsetTop; scrollTop = element.scrollTop; e.preventDefault(); };
        const end = () => { isDown = false; element.style.cursor = 'grab'; };
        const move = e => { if (!isDown) return; e.preventDefault(); const y = (e.pageY || e.touches[0].pageY) - element.offsetTop; element.scrollTop = scrollTop - (y - startY); };
        element.addEventListener('mousedown', start);
        element.addEventListener('mouseleave', end);
        element.addEventListener('mouseup', end);
        element.addEventListener('mousemove', move);
        element.addEventListener('touchstart', start, { passive: false });
        element.addEventListener('touchend', end);
        element.addEventListener('touchmove', move, { passive: false });
    }


    if (!window.game) window.game = {};
    if (!window.game.UI) window.game.UI = {};
    
    // 将工具函数挂载到UI命名空间下
    window.game.UI.createElement = createElement;
    window.game.UI.makeListDraggable = makeListDraggable;

})();