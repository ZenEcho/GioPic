import process from 'node:process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 确保 PORT 存在且可以正确转换为数字
export const port = Number(process.env.PORT) || 30333;

// 通用路径解析函数
export const r = (...args: string[]) => resolve(__dirname, '..', ...args);

// 检查环境变量以判断当前环境
console.log(process.env.NODE_ENV);

export const isDev = process.env.NODE_ENV == 'development';
export const isFirefox = process.env.EXTENSION === 'firefox';