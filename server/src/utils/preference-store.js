import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { encrypt, decrypt } from './encryption.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取数据目录路径
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
const PREFERENCES_DIR = path.join(DATA_DIR, 'preferences');

// 保证目录存在的同步辅助函数（仅在初始化或路径获取时使用）
function ensureDirSync(dir) {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

// 获取用户偏好设置文件路径
function getUserPrefsPath(userId) {
    ensureDirSync(PREFERENCES_DIR);
    return path.join(PREFERENCES_DIR, `${userId}.json`);
}

/**
 * 结构化克隆对象（替代 JSON.parse/stringify 方案以支持更复杂的数据结构且性能更佳）
 */
function structuredCloneCompat(obj) {
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    // 回退方案：对于纯 JSON 对象，JSON 方案依然是最快的
    return JSON.parse(JSON.stringify(obj));
}

export const PreferenceStore = {
    /**
     * 异步读取用户偏好设置
     */
    async get(userId) {
        const filePath = getUserPrefsPath(userId);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const prefs = JSON.parse(data);

            // 解密 AI API Key
            if (prefs.ai_config?.encryptedApiKey) {
                const decryptedKey = decrypt(prefs.ai_config.encryptedApiKey);
                if (decryptedKey) {
                    prefs.ai_config.apiKey = decryptedKey;
                }
                delete prefs.ai_config.encryptedApiKey;
            }

            return prefs;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Error loading preferences for ${userId}:`, error);
            }
        }
        return {};
    },

    /**
     * 异步保存用户偏好设置
     */
    async save(userId, prefs) {
        const filePath = getUserPrefsPath(userId);
        try {
            const prefsToSave = structuredCloneCompat(prefs);

            // 加密 AI API Key
            if (prefsToSave.ai_config?.apiKey) {
                const encrypted = encrypt(prefsToSave.ai_config.apiKey);
                if (encrypted) {
                    prefsToSave.ai_config.encryptedApiKey = encrypted;
                    delete prefsToSave.ai_config.apiKey;
                }
            }

            await fs.writeFile(filePath, JSON.stringify(prefsToSave, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving preferences for ${userId}:`, error);
            return false;
        }
    },

    /**
     * 异步获取所有用户的 ID 列表
     */
    async getAllUserIds() {
        try {
            ensureDirSync(PREFERENCES_DIR);
            const files = await fs.readdir(PREFERENCES_DIR);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
        } catch (error) {
            console.error('Error getting all user IDs:', error);
            return [];
        }
    },

    /**
     * 生成用户唯一 ID
     */
    getUserId(user) {
        if (!user) return 'default';
        const username = user.miniflux_username || user.username || 'default';
        return Buffer.from(username).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    }
};
