/**
 * @file js/events.js
 * @description 事件总线模块 (v52.0.0)
 * @description [新增] 实现发布/订阅模式，解耦游戏模块。
 * @author Gemini (CTO)
 * @version 52.0.0
 */
(function() {
    'use strict';

    const Events = {
        listeners: {},

        /**
         * 订阅一个事件
         * @param {string} eventName - 事件名称 (来自 a/constants.js)
         * @param {function} callback - 事件触发时执行的回调函数
         */
        subscribe(eventName, callback) {
            if (!this.listeners[eventName]) {
                this.listeners[eventName] = [];
            }
            this.listeners[eventName].push(callback);
        },

        /**
         * 取消订阅一个事件
         * @param {string} eventName - 事件名称
         * @param {function} callback - 要移除的回调函数
         */
        unsubscribe(eventName, callback) {
            if (!this.listeners[eventName]) return;

            this.listeners[eventName] = this.listeners[eventName].filter(
                listener => listener !== callback
            );
        },

        /**
         * 发布一个事件
         * @param {string} eventName - 事件名称
         * @param {*} [data] - 传递给回调函数的数据
         */
        publish(eventName, data) {
            if (!this.listeners[eventName]) return;

            this.listeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for '${eventName}':`, error);
                }
            });
        }
    };

    // 挂载到全局 game 对象
    if (!window.game) window.game = {};
    window.game.Events = Events;

})();