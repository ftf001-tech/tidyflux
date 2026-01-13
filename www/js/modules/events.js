/**
 * 事件处理模块 - Tidyflux
 * @module events
 */


import { DOMElements } from '../dom.js';

const GESTURE_EDGE_THRESHOLD = 30;
const GESTURE_MIN_SWIPE_DISTANCE = 80;
const GESTURE_MAX_VERTICAL_DEVIATION = 100;
const CLASS_ARTICLE_VIEW_ACTIVE = 'article-view-active';

// 下拉刷新
export function setupPullToRefresh() {
    // 简化版本，可以后续扩展
}

// 滑动手势
export function setupSwipeGesture() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);

        // 从左边缘向右滑动返回
        if (touchStartX < GESTURE_EDGE_THRESHOLD && deltaX > GESTURE_MIN_SWIPE_DISTANCE && deltaY < GESTURE_MAX_VERTICAL_DEVIATION) {
            if (DOMElements.body.classList.contains(CLASS_ARTICLE_VIEW_ACTIVE)) {
                history.back();
            }
        }
    }, { passive: true });
}

export function setupListSwipeGesture() {
    // 列表页滑动手势
}



// 全局事件监听
export function setupEventListeners() {
    setupPullToRefresh();
    setupSwipeGesture();
    setupListSwipeGesture();

}
