/**
 * 工具函数模块 - Tidyflux
 * @module utils
 */

const pad = (n) => String(n).padStart(2, '0');

export function formatShortDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function safeIdForFilename(id) {
    if (!id) return '';
    return String(id).replace(/[^a-zA-Z0-9-_]/g, '_');
}
