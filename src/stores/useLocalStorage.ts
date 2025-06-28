// chrome本地存储API 获取数据
type StorageData = { [key: string]: any };

// Declare chrome and browser as global variables
declare const chrome: any;
declare const browser: any;

/**
 * 一个用于与本地存储或浏览器存储（Chrome或Firefox）交互的实用对象。
 */
const useLocalStorage = {
    /**
     * 获取存储的数据。
     * 
     * @param {string} [key] - 要获取的数据的键。如果未提供，将获取所有数据。
     * @returns {Promise<any>} 一个Promise对象，解析为获取到的数据或拒绝并带有错误。
     */
    get(key?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.get(key ? [key] : null, (result: any) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(key ? result[key] : result);
                        }
                    });
                } else if (typeof browser !== 'undefined' && browser.storage) {
                    browser.storage.local.get(key ? [key] : null).then((result: any) => {
                        resolve(key ? result[key] : result);
                    }).catch((error: any) => {
                        reject(error);
                    });
                } else {
                    const data = key ? localStorage.getItem(key) : localStorage;
                    resolve(key ? JSON.parse(data as string) : data);
                }
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * 存储数据。
     * 
     * @param {string | StorageData} keyOrObject - 要存储的数据的键或包含多个键值对的对象。
     * @param {any} [value] - 如果提供了键，则要存储的值。
     * @returns {Promise<void>} 一个Promise对象，当数据存储完成时解析或拒绝并带有错误。
     */
    set(keyOrObject: string | StorageData, value?: any): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    const data = typeof keyOrObject === 'string' ? { [keyOrObject]: value } : keyOrObject;
                    chrome.storage.local.set(data, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else if (typeof browser !== 'undefined' && browser.storage) {
                    const data = typeof keyOrObject === 'string' ? { [keyOrObject]: value } : keyOrObject;
                    browser.storage.local.set(data).then(() => {
                        resolve();
                    }).catch((error: any) => {
                        reject(error);
                    });
                } else {
                    if (typeof keyOrObject === 'string') {
                        localStorage.setItem(keyOrObject, JSON.stringify(value));
                    } else {
                        for (const key in keyOrObject) {
                            if (keyOrObject.hasOwnProperty(key)) {
                                localStorage.setItem(key, JSON.stringify(keyOrObject[key]));
                            }
                        }
                    }
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    }
};

// 存储上传记录的
interface UploadData {
    key: string;
    url: string;
    uploadExe: string;
    upload_domain_name: string;
    original_file_name: string;
    file_size: number;
    img_file_size: number | string;
    uploadTime: string;
}

/**
 * 将提供的上传数据保存到本地存储，并在当前URL以'http'开头时发送系统信息通知。
 *
 * @param {UploadData} data - 要保存到本地存储的数据。
 * @returns {Promise<boolean>} - 一个Promise对象，如果数据成功保存则解析为true。
 * @throws 如果保存到本地存储时出现问题，将抛出错误。
 *
 * @example
 * const uploadData = {
 *   key: 'unique-key',
 *   url: 'https://example.com/image.jpg',
 *   uploadExe: 'example.exe',
 *   upload_domain_name: 'example.com',
 *   original_file_name: 'image.jpg',
 *   file_size: 12345,
 *   img_file_size: 12345,
 *   uploadTime: new Date().toISOString()
 * };
 * 
 * useLocalStorage(uploadData)
 *   .then(success => console.log('上传数据已保存:', success))
 *   .catch(error => console.error('错误:', error));
 */
async function uploadRecordsStorage(data: UploadData): Promise<boolean> {
    const currentURL = location.href;
    const filename = data.original_file_name;
    const imageUrl = data.url;
    try {
        const existingUploadLog = await useLocalStorage.get('UploadLog');
        const uploadLog = Array.isArray(existingUploadLog) ? existingUploadLog : [];
        const uploadLogEntry = {
            key: data.key,
            url: imageUrl,
            uploadExe: data.uploadExe,
            upload_domain_name: data.upload_domain_name,
            original_file_name: filename,
            file_size: data.file_size,
            img_file_size: data.img_file_size,
            uploadTime: data.uploadTime
        };
        uploadLog.push(uploadLogEntry);
        await useLocalStorage.set('UploadLog', uploadLog);

        if (currentURL.startsWith('http')) {
            const uploadPromptMessage = chrome.i18n.getMessage("Upload_prompt2");
            chrome.runtime.sendMessage({ notification: { system: { content: uploadPromptMessage } } }); //系统信息通知
        }

        return true;
    } catch (error) {
        console.error('Error saving to local storage:', error);
        throw error; 
    }
}

// 导出所以方法
export { useLocalStorage, uploadRecordsStorage };