import jwt from 'jsonwebtoken';
import { MinifluxClient } from '../miniflux.js';
import { MinifluxConfigStore } from '../utils/miniflux-config-store.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '7d';

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set in environment variables. Using a random secret. Sessions will be invalidated on server restart.');
}

// 缓存 MinifluxClient 单例实例
let minifluxClientInstance = null;
let lastConfigHash = null;

function getConfigHash(config) {
    if (!config) return null;
    return `${config.url}:${config.username}:${config.password}:${config.apiKey}`;
}

/**
 * 异步获取 MinifluxClient
 */
export async function getMinifluxClient() {
    const config = await MinifluxConfigStore.getConfig();
    const currentHash = getConfigHash(config);

    // 如果配置变化了，需要重新创建实例
    if (currentHash !== lastConfigHash) {
        minifluxClientInstance = null;
        lastConfigHash = currentHash;
    }

    if (!minifluxClientInstance && config) {
        minifluxClientInstance = new MinifluxClient(
            config.url,
            config.username,
            config.password,
            config.apiKey
        );
    }
    return minifluxClientInstance;
}

// 清除缓存的客户端实例（配置更新时调用）
export function clearMinifluxClientCache() {
    minifluxClientInstance = null;
    lastConfigHash = null;
}

/**
 * 身份验证中间件
 */
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未登录' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;

        // 异步获取 MinifluxClient 并挂载到 request 对象
        req.miniflux = await getMinifluxClient();
        if (!req.miniflux) {
            console.warn('Miniflux service is not configured!');
        }

        next();
    } catch (err) {
        console.error('JWT verify error:', err.message);
        return res.status(403).json({ error: '登录已过期' });
    }
}

/**
 * 生成 JWT Token
 */
export function generateToken(payload) {
    return jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION }
    );
}

export { JWT_SECRET };
