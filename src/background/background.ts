/// <reference types="chrome" />

import { activateBedConfig } from '@/utils/storage';
import { generateUniqueId } from '@/utils/generate';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useLocalStorage } from '@/stores/useLocalStorage';
import type { UploadAreaType, UploadFunctionSettingsType, backgroundSendFileType } from '@/type/index'
import { t } from '@/utils/i18n';

//默认设置-安装时调用存储
const DEFAULT_SETTINGS = {
    uploadArea: <UploadAreaType>{
        status: true,
        width: 32,
        height: 30,
        location: 34,
        opacity: 30,
        closeTime: 2,
        position: "Right"
    },
    uploadFunctionSettings: <UploadFunctionSettingsType>{
        dragUpload: true,
        autoInsert: true,
        autoCopy: false,
        rightClickUpload: true,
        imageProxy: 'false',
        editBoxPaste: false,
        openInTab: 1,
        i18n: "zh-CN",
    },
    StickerOptional: false,
    StickerCodeSelect: "URL",
    StickerURL: "https://plextension-sticker.pnglog.com/sticker.json"
};

const FIREFOX_USER_AGENT = 'Firefox';
const POPUP_URL = '/index.html#/popup';
const OPTIONS_URL = '/index.html#/options';
const ICON_URL = '/assets/icons/logo32.png';

/**
 * 显示通知
 * @param {string} title - 通知的标题
 * @param {string} message - 通知的消息内容
 * @param {function} onClickCallback - 点击通知时的回调函数
 */
function showNotification(title: string, message: string, onClickCallback: () => void) {
    const notificationTitle = title || t("app_name");
    chrome.notifications.create({
        type: 'basic',
        title: notificationTitle,
        message: message,
        iconUrl: ICON_URL
    }, () => { });
    if (onClickCallback) {
        chrome.notifications.onClicked.addListener(onClickCallback);
    }
}

/**
 * 处理扩展安装事件
 * 设置浏览器打开方式，初始化设置，并显示安装完成通知
 */
function handleInstall() {
    const currentVersion = chrome.runtime.getManifest().version;
    useLocalStorage.set('extensionVersion', currentVersion); //存储版本号

    useLocalStorage.set(DEFAULT_SETTINGS);
    createContextMenu();
    useLocalStorage.get("uploadFunctionSettings").then((result) => {
        if (result) {
            showNotification('', t("Installation and initialization completed, complete the configuration to start uploading"), () => {
                chrome.tabs.create({ 'url': OPTIONS_URL });
            });
        }
    });
}

/**
 * 升级设置
 * @param {object} result - 本地存储中的设置对象
 */
function upgradeSettings() {
    useLocalStorage.get().then((result) => {
        const keyMappings = {
            FuncDomain: {
                "AutoCopy": "autoCopy",
                "GlobalUpload": "dragUpload",
                "AutoInsert": "autoInsert",
                "Right_click_menu_upload": "rightClickUpload",
                "ImageProxy": "imageProxy",
                "EditPasteUpload": "editBoxPaste"
            },
            uploadArea: {
                "uploadArea_width": "width",
                "uploadArea_height": "height",
                "uploadArea_Location": "location",
                "uploadArea_opacity": "opacity",
                "uploadArea_auto_close_time": "closeTime",
                "uploadArea_Left_or_Right": "position"
            }
        };

        const upgradeDomain = (domain: string, mappings: { [key: string]: string }, newDomain: string = domain) => {
            if (result[domain]) {
                const updatedDomain: { [key: string]: any } = {};
                for (const key in result[domain]) {
                    const newKey = mappings[key] || key;
                    updatedDomain[newKey] = result[domain][key] === "on" ? true : result[domain][key] === "off" ? false : result[domain][key];
                }
                useLocalStorage.set(newDomain, updatedDomain).then(() => {
                    console.log(`${newDomain} 设置已升级:`, updatedDomain);
                });
            }
        };

        // 升级旧版本的 FuncDomain 为新版本的 uploadFunctionSettings
        upgradeDomain("FuncDomain", keyMappings.FuncDomain, "uploadFunctionSettings");

        // 升级 uploadArea
        upgradeDomain("uploadArea", keyMappings.uploadArea);
    });
}

/**
 * 处理扩展更新事件
 * 检查并记录扩展版本更新
 */
function handleUpdate() {
    console.log("程序函数被调用...");
    useLocalStorage.get().then((result) => {
        const previousVersion = result.extensionVersion;
        const currentVersion = chrome.runtime.getManifest().version;
        if (previousVersion !== currentVersion) {
            console.log("升级..");
            upgradeSettings();
        }
    });
}

/**
 * 处理扩展图标点击事件
 * 根据设置打开相应的页面
 */
function handleActionClick() {
    useLocalStorage.get('uploadFunctionSettings').then((result) => {
        const browserOpenWith: 1 | 2 | 3 | 'default' = result?.openInTab || 1;
        useLocalStorage.set('uploadFunctionSettings', result);

        const openActions = {
            1: () => chrome.tabs.create({ 'url': POPUP_URL }),
            2: () => chrome.windows.create({
                type: "popup",
                url: POPUP_URL,
                width: 1200,
                height: 750
            }),
            3: () => {
                chrome.action.setPopup({ popup: POPUP_URL });
            },
            default: () => chrome.tabs.create({ 'url': POPUP_URL })
        };

        (openActions[browserOpenWith] ?? openActions.default)();
    });
}

/**
 * 创建右键菜单项
 */
function createContextMenu() {
    // 首先移除所有已存在的菜单项
    chrome.contextMenus.removeAll(() => {
        useLocalStorage.get().then(async (result) => {
            const { SelectedUploadConfig } = result;
            if (result.uploadFunctionSettings?.rightClickUpload) {
                // 创建主菜单项
                chrome.contextMenus.create({
                    title: t("Upload image"),
                    contexts: ["image"],
                    id: "upload_image"
                });

                // 如果有选中的上传配置，则获取具体配置信息并创建子菜单
                if (SelectedUploadConfig && SelectedUploadConfig.length > 0) {
                    const BedConfigStore = await useIndexedDB.BedConfigStore.getAllSortedByIndex();
                    const config = BedConfigStore.filter(item =>
                        SelectedUploadConfig.includes(item.id as string)
                    );

                    // 如果有多个配置，创建"上传到所有"选项和单个配置选项
                    if (config.length >= 2) {
                        chrome.contextMenus.create({
                            title: `🤖 ` + t("Upload Everywhere") + ` 🤖`,
                            parentId: "upload_image",
                            contexts: ["image"],
                            id: "upload_all"
                        });
                    }

                    // 为每个选中的配置创建子菜单项
                    config.forEach((item) => {
                        chrome.contextMenus.create({
                            title: item.ConfigName,
                            parentId: "upload_image",
                            contexts: ["image"],
                            id: item.id as string
                        });
                    });
                }
            }
        }).catch(error => {
            console.error("Error creating context menu:", error);
        });
    });
}


/**
 * 处理右键菜单点击事件
 * @param {object} info - 右键菜单点击信息
 */
function handleContextMenuClick(info: chrome.contextMenus.OnClickData) {
    if (info.menuItemId === "upload_image") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
            if (tabs[0].id !== undefined) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    diffuseNotification: {
                        "injectPage": {
                            title: t("app_name"),
                            type: "error",
                            content: `请先配置` + t("app_name"),
                            duration: 0,
                            saved: false,
                        }
                    }
                });
            }
        });
    } else if (info.menuItemId === "upload_all") {
        // 处理"上传到所有"菜单项
        const url = info.srcUrl;
        if (url) {
            fetchImageBlob(url)
                .then(blob => {
                    useLocalStorage.get().then(async (result) => {
                        const { SelectedUploadConfig } = result;
                        fetchUpload({
                            imgUrl: url,
                            blob: blob,
                            uploadID: SelectedUploadConfig
                        })
                    });

                })
                .catch(error => {
                    console.error('Failed to fetch image blob:', error);
                });
        } else {
            console.error('Image URL is undefined');
        }

    } else if (typeof info.menuItemId === "string" && info.srcUrl) {
        const url = info.srcUrl;
        if (url) {
            fetchImageBlob(url)
                .then(blob => {
                    fetchUpload({
                        imgUrl: url,
                        blob: blob,
                        uploadID: [info.menuItemId as string]
                    })
                })
                .catch(error => {
                    console.error('Failed to fetch image blob:', error);
                });
        } else {
            console.error('Image URL is undefined');
        }
    }
}
/**
   * 判断两个数据对象的所有属性值是否相同，排除 'ConfigName' 属性。
   *
   * @param {Object} data1 - 第一个数据对象。
   * @param {Object} data2 - 第二个数据对象。
   * @returns {boolean} - 如果数据对象的所有属性值（排除 'ConfigName'）相同，则返回 true，否则返回 false。
   */
function isSameData(data1: Record<string, any>, data2: Record<string, any>) {
    const excludedProps = ['ConfigName'];
    for (const key of Object.keys(data2)) {
        if (!excludedProps.includes(key) && data1[key] !== data2[key]) {
            return false;
        }
    }
    return true;
}
/**
 * 处理消息事件
 * @param {object} request - 请求对象
 * @param {object} sender - 发送者对象
 * @param {function} sendResponse - 响应回调函数
 */

let TabId: number | undefined;
function handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    if (request.action === "getStorage") {
        useLocalStorage.get().then(storage => {
            sendResponse(storage);
        })
        return true;  // 表示将异步发送响应
    }
    if (request.indexedDB) {
        const { name, method, params } = request.indexedDB as { name: keyof typeof useIndexedDB, method: string, params: any[] };
        // 检查是否存在对应的数据库和方法
        if (useIndexedDB[name] && typeof (useIndexedDB[name] as any)[method] === 'function') {
            // 动态调用方法并传递参数
            (useIndexedDB[name] as any)[method](...params)
                .then((result: any) => sendResponse({ success: true, data: result }))
                .catch((error: any) => sendResponse({ success: false, error: error.message }));

            // 表示异步响应
            return true;
        } else {
            sendResponse({ success: false, error: `Invalid method '${method}' or store '${name}'` });
        }
    }
    if (request.uploadMessage) {

        // 收到上传信息
        const { data, uploadMode, type } = request.uploadMessage;

        if (type == "link") {
            fetchImageBlob(data)
                .then(blob => {
                    // fetchUpload(data, blob)
                })
        } else {
            let base64Files = data
            let files = base64Files.map((base64File: { data: string; name: string; type: string }) => {
                let byteString = atob(base64File.data.split(',')[1]);
                let mimeString = base64File.data.split(',')[0].split(':')[1].split(';')[0];
                let ab = new ArrayBuffer(byteString.length);
                let ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                return { blob: new Blob([ab], { type: mimeString }), name: base64File.name, type: base64File.type };
            });
            // 调用逐个上传函数
            uploadFilesSequentially(files);
        }
    }
    if (request.notification) {
        // diffuseNotification 扩散通知
        const { system, injectPage, progressBar } = request.notification;
        if (system) {
            showNotification(system.title, system.content, () => { });
        }
        if (injectPage) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                if (tabs[0].id !== undefined) {
                    chrome.tabs.sendMessage(tabs[0].id, { diffuseNotification: { "injectPage": injectPage } });
                }
            });
        }
        if (progressBar) {
            if (progressBar.status == 1) {
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                    TabId = tabs[0].id;
                    if (TabId !== undefined) {
                        chrome.tabs.sendMessage(TabId,
                            {
                                diffuseNotification:
                                {
                                    progressBar: { "filename": progressBar.filename, "status": progressBar.status, "isCurrentTabId": true }
                                }
                            }
                        )
                    }
                });
            }
            if (progressBar.status == 2 || progressBar.status == 0) {
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                    let currentTabId = tabs[0].id;
                    if (TabId == currentTabId) { //如果是提示状态初始页
                        if (currentTabId !== undefined) {
                            chrome.tabs.sendMessage(currentTabId,
                                {
                                    diffuseNotification: {
                                        progressBar:
                                            { "filename": progressBar.filename, "status": progressBar.status, "isCurrentTabId": true }
                                    }
                                })
                        }
                    } else {
                        // 新页面更新状态
                        if (currentTabId !== undefined) {
                            chrome.tabs.sendMessage(currentTabId,
                                {
                                    diffuseNotification: {
                                        progressBar:
                                            { "filename": progressBar.filename, "status": progressBar.status, "isCurrentTabId": false }
                                    }
                                })
                        }
                        if (TabId) {
                            // 初始页更新状态
                            chrome.tabs.sendMessage(TabId, { diffuseNotification: { progressBar: { "filename": progressBar.filename, "status": progressBar.status, "isCurrentTabId": true } } })
                        }
                    }
                });
            }
        }
    }
    if (request.loadConfig) {
        const { external } = request.loadConfig;
        activateBedConfig(external).then(() => {
            useIndexedDB.BedConfigStore.getAll().then(BedConfig => {
                if (!BedConfig.some(existingData => isSameData(existingData.data, external.data))) {
                    external.id = generateUniqueId()
                    external.index = 1000 + BedConfig.length + 1
                    BedConfig.push(external);
                    useIndexedDB.BedConfigStore.put(external).then(() => {
                        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                            if (tabs[0].id !== undefined) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    diffuseNotification: {
                                        "injectPage": {
                                            title: "导入成功",
                                            type: "success",
                                            content: "外部数据导入成功,使用时请刷新一次页面以便扩展完成初始化",
                                            duration: 10,
                                        }
                                    }
                                }).then(() => {
                                });
                            }
                        });
                    });
                }
            }).catch(error => {
                console.error("Error opening useIndexedDB:", error);
            });
        });

    }
    if (request.webtitle) {
        if (request.webtitle) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                if (tabs[0].id !== undefined) {
                    chrome.tabs.sendMessage(tabs[0].id, { webTitleNotice: request.webtitle });
                }
            });
        }

    }
    if (request.getXsrfToken) {
        getXsrfToken(request.url);
    }
    //自动插入
    if (request.AutoInsert) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
            TabId = tabs[0].id;
            try {
                if (TabId !== undefined) {
                    chrome.tabs.sendMessage(TabId, { AutoInsert: request.AutoInsert }, function (response) {
                        if (chrome.runtime.lastError) {
                            return;
                        }
                    });
                }
            } catch (error) {
                console.log(error);
            }
        });
    }
    if (request.autoCopy) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
            TabId = tabs[0].id;
            try {
                if (TabId !== undefined) {
                    chrome.tabs.sendMessage(TabId, { autoCopy: request.autoCopy }, function (response) {
                        if (chrome.runtime.lastError) {
                            return;
                        }
                    });
                }
            } catch (error) {
                console.log(error);
            }
        });
    }

}
async function uploadFilesSequentially(files: { blob: Blob; name: string; type: string }[]) {
    for (let file of files) {
        try {
            // await fetchUpload(file.name, file.blob);
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    }
}
async function fetchUpload(data: { imgUrl: string, blob: Blob, uploadID: string[] }) {
    const { imgUrl, blob, uploadID } = data
    const d = new Date();
    const storage = await useLocalStorage.get();
    const { ProgramConfiguration, uploadFunctionSettings } = storage;

    // 设置 CORS 代理
    const corsProxy = ProgramConfiguration.CorsProxyState ? ProgramConfiguration.CorsProxy : "";

    // 显示上传提示通知
    showNotification('', t('Image retrieval completed, uploading in progress'), () => { });

    // 获取图片文件扩展名
    const imageExtension = await getImageFileExtension(imgUrl, blob);
    const lastModified = d.getTime();
    const fileName = `${ProgramConfiguration.Program}_${lastModified}.${imageExtension}`;

    const BedConfigStore = await useIndexedDB.BedConfigStore.getAllSortedByIndex()
    const selectedUploadConfig = BedConfigStore.filter(item => uploadID.includes(item.id as string))

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const fileArray = Array.from(uint8Array);
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found");
            return;
        }
        const tabId = tabs[0].id;
        if (tabId !== undefined) {
            chrome.tabs.sendMessage(tabId, {
                readFileInfo: {
                    lastModified: lastModified,
                    name: fileName,
                    type: imageExtension,
                    uploadConfig: selectedUploadConfig,
                    file: fileArray,
                } as backgroundSendFileType
            }, function (response) {
                if (chrome.runtime.lastError) { return; }
            });
        } else {
            console.error("Tab ID is undefined");
        }
    });

}

/**
 * 获取图片文件扩展名
 * @param {string} imgUrl - 图片 URL
 * @param {Blob} file - 图片文件 Blob
 * @returns {string} - 图片文件扩展名
 */
async function getImageFileExtension(imgUrl: string, file: Blob): Promise<string> {
    // 精准的图片扩展名白名单（移除文档类格式）
    const imageExtensions = new Set([
        'png', 'jpg', 'jpeg', 'gif', 'bmp',
        'webp', 'svg', 'ico', 'avif', 'tiff',
        'apng', 'heic', 'heif'
    ]);

    // 阶段1：从URL中精准提取扩展名
    if (imgUrl) {
        // 强化版正则：匹配最后一个点后的扩展名，忽略查询参数和哈希
        const extensionMatch = imgUrl.match(/\.([a-z0-9]+)(?=[?#]|$)/i);
        if (extensionMatch) {
            const candidate = extensionMatch[1].toLowerCase();
            if (imageExtensions.has(candidate)) {
                return candidate; // 优先返回URL中的有效扩展名
            }
        }
    }

    // 阶段2：从MIME类型推断（针对无扩展名URL的现代格式）
    if (file.type) {
        // MIME类型到扩展名的精准映射
        const mimeMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/svg+xml': 'svg',
            'image/heic': 'heic',
            'image/heif': 'heif',
            'image/avif': 'avif'
        };

        // 优先检查特殊映射
        if (mimeMap[file.type]) {
            return mimeMap[file.type];
        }

        // 通用类型处理（如 image/png -> png）
        const genericExtension = file.type.split('/').pop()?.toLowerCase();
        if (genericExtension && imageExtensions.has(genericExtension)) {
            return genericExtension;
        }
    }

    // 阶段3：回退策略
    return defaultFallbackExtension(file);
}

// 智能回退策略
function defaultFallbackExtension(file: Blob): string {
    // 根据常见场景优化默认值
    if (file.type.startsWith('image/')) {
        return file.type.includes('jpeg') ? 'jpg' : 'png';
    }
    return 'png'; // 完全无法识别时回退
}

async function fetchImageBlob(url: string) {

    const { CorsProxyState, CorsProxy = "" } = await useLocalStorage.get("ProgramConfiguration") || {};
    const finalUrl = CorsProxyState ? `${CorsProxy}${url}` : url;
    return await fetch(finalUrl)
        .then(response => response.blob())
        .catch(error => {
            console.error(error);
            throw new Error('Failed to fetch image blob');
        });
}


function getXsrfToken(url: string) {
    chrome.cookies.get({ url: url, name: 'XSRF-TOKEN' }, function (cookie) {
        if (cookie) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                TabId = tabs[0].id;
                if (TabId !== undefined) {
                    chrome.tabs.sendMessage(TabId, { XSRF_TOKEN: decodeURIComponent(cookie.value) }, function (response) {
                        if (chrome.runtime.lastError) {
                            return;
                        }
                    });
                }
            });
        }
    });
}

// 16图床Referer设定
chrome.runtime.onInstalled.addListener(async () => {
    const rules = [{
        id: 1,
        action: {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [{
                header: 'Referer',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: 'https://i.111666.best',
            }],
        },
        condition: {
            domains: [chrome.runtime.id],
            urlFilter: '|https://i.111666.best/',
            resourceTypes: ['xmlhttprequest'] as chrome.declarativeNetRequest.ResourceType[],
        },
    }];

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules,
    });
});
// 16图床获取图片信息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchBlob' && request.url) {
        fetch(request.url, {
            headers: {
                'Referer': 'https://i.111666.best'
            }
        })
            .then(response => response.blob())
            .then(blob => {
                // 生成并发送base64
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result;
                    sendResponse({ blobUrl: base64 });
                };
                reader.readAsDataURL(blob);

            })
            .catch(error => {
                console.error('Failed to fetch blob:', error);
                sendResponse({ blobUrl: '' });
            });
        return true; // 表示将异步发送响应
    }
    // ...existing code...
});

// 1.监听扩展安装和更新事件
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        handleInstall();
    } else if (details.reason === 'update') {
        handleUpdate();
    }
});

// 2.监听扩展图标点击事件
chrome.action.onClicked.addListener(handleActionClick);

// 3.创建右键菜单项
createContextMenu();

// 4.监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// 99.监听消息事件
chrome.runtime.onMessage.addListener(handleMessage);

// 监听chrome.storage.local变化
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        for (const key in changes) {
            if (key === 'SelectedUploadConfig') {
                createContextMenu();
            }
        }
    }
});