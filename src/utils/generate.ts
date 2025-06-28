
// import WorkerURL from '@/utils/imageProcessorWorker?worker&url'
const WorkerURL = new URL('@/utils/imageProcessorWorker.ts', import.meta.url).href;

// ================================================
// 【生成缩略图】
// ================================================
export function generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve('');
            return;
        }
        const worker = new Worker(WorkerURL, { type: 'module' });
        worker.postMessage({ file, maxWidth: 512, maxHeight: 512, "type": "thumbnail" });

        worker.onmessage = (event) => {
            resolve(event.data);
            worker.terminate();
        };

        worker.onerror = () => {
            resolve('');
            worker.terminate();
        };
    });
}
// ================================================
// 【生成 Base64】
// ================================================
export function generateBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
        const href = window.location.href;
        const isExtensionURL = href.startsWith("chrome-extension://") ||
            href.startsWith("moz-extension://") ||
            href.startsWith("ms-browser-extension://");
        if (!isExtensionURL) {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                resolve('');
            };
            reader.readAsDataURL(file);
        } else {
            // 是浏览器扩展环境时 Web Worker
            const worker = new Worker(WorkerURL, { type: 'module' });
            worker.postMessage({ file, type: "base64" });
            worker.onmessage = (event) => {
                resolve(event.data);
                worker.terminate();
            };
            worker.onerror = () => {
                resolve('');
                worker.terminate();
            };
        }

    });
}

// ================================================
// 【生成 理论唯一id】
// ================================================
export function generateUniqueId(): string {
    return crypto.randomUUID();
}
// ================================================
// 【生成指定长度的随机数字】
// ================================================
export function generateRandomNumber(length: number): string {
    const charSet = '0123456789';
    let result = '';
    const charSetLength = charSet.length;
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSetLength));
    }
    return result;
}
// ================================================
// 【生成指定长度的随机字符串】
// ================================================
export function generateRandomString(length: number): string {
    const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charSetLength = charSet.length;
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSetLength));
    }
    return result;
}