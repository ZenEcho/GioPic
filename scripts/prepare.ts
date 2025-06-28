// 开发与构建时调用的脚本

// 引入 fs-extra 模块，用于文件操作
import { execSync } from 'node:child_process'
import fsExtra from 'fs-extra';
const { ensureDir, readFile, writeFile } = fsExtra;
// 引入 chokidar 模块，用于监听文件变化
import chokidar from 'chokidar';
// 从 utils.js 文件中引入 isDev, port 和 r 方法
import { isDev, port, r } from './utils.js';


// 输出 index.html 文件
async function indexOut() {
    await ensureDir(`dist`);
    let data = await readFile(`index.html`, 'utf-8');
    data = data
        .replace('"/src/main.ts"', `"http://localhost:${port}/src/main.ts"`)
        .replace('<div id="app"></div>', `<div id="app">启动中...</div>`);
    await writeFile(`dist/index.html`, data, 'utf-8');

}
// 输出 manifest.json 文件
async function writeManifest() {
    await ensureDir(`dist`); // 确保 dist 目录存在
    execSync('pnpm esno ./scripts/manifest.ts', { stdio: 'inherit' })
}

writeManifest()


// 输出 文件夹
async function Out() {
    await fsExtra.copy(`src/assets/icons`, `dist/assets/icons`);
}

// 如果是开发环境
console.log(`当前环境：${isDev ? '开发' + isDev : '生产' + isDev}`);

if (isDev) {
    indexOut();
}
Out()
chokidar.watch([r('src/manifest.ts'), r('package.json')])
    .on('change', () => {
        writeManifest()
    })