
import { useLocalStorage } from '@/stores/useLocalStorage';
// 声明 t 函数类型
import { t } from '@/utils/i18n'; // 直接导入
const Storage = useLocalStorage
const dataWithFunctions = {
    "lsky": {
        "url": "/user/tokens",
        "element": "#token-create",
        "function": function () {
            let pathname = localStorage.getItem(getCurrentDomain())
            if (pathname !== "true") {
                window.createNotification({
                    title: `发现：` + t("app_name") + `可配置图床`,
                    type: "警告",
                    content: `点击【创建 Token】按钮，在【创建成功】页点击【添加到` + t("app_name") + `】按钮，可加载到` + t("app_name") + `扩展。`,
                    duration: 0,
                    buttons: [
                        {
                            text: "添加到" + t("app_name"),
                            style: "",
                            init: function () {
                                try {
                                    let token = document.querySelector("#token-create-success p:nth-child(2)")?.textContent;
                                    let data = {
                                        "data": {
                                            "Album_id": "",
                                            "Program": "Lsky",
                                            "Host": getCurrentDomain(),
                                            "Permission": "0",
                                            "Source": "2",
                                            "Token": "Bearer " + token
                                        },
                                        "ConfigName": getCurrentDomain() + t("Config")
                                    }
                                    if (token) {
                                        chrome.runtime.sendMessage({ loadConfig: { external: data } });
                                        window.postMessage({ type: "showIframe", show: true }, "*");
                                        (this as unknown as HTMLButtonElement).disabled = true
                                    } else {
                                        alert("获取 Token 失败，请点击【创建 Token】按钮创建Token")
                                        // 延迟1秒
                                        setTimeout(function () {
                                            window.createNotification({
                                                title: `权限调用询问`,
                                                type: "警告",
                                                content: `是否允许【` + t("app_name") + "】调用本站的 cookie,用于一键获取token？<br>注意：本次调用将涉及您的隐私,如果您不同意调用请无视。",
                                                duration: 0,
                                                buttons: [
                                                    {
                                                        text: "允许并获取token",
                                                        style: "",
                                                        init: function () {
                                                            let button = this as unknown as HTMLButtonElement
                                                            chrome.runtime.sendMessage({ getXsrfToken: 'getXsrfToken', url: window.location.href });
                                                            xsrfTOKEN(button)
                                                        }
                                                    },
                                                    {
                                                        text: "滚",
                                                        style: "",
                                                        init: function (close) {
                                                            close();
                                                        }
                                                    }
                                                ]
                                            });
                                        }, 700)
                                    }

                                } catch (error) {
                                    alert("获取失败请联系开发者")
                                }
                            }
                        },
                        {
                            text: "本站不再提示",
                            style: "",
                            init: function (close) {
                                localStorage.setItem(getCurrentDomain(), "true");
                                close();
                            }
                        }
                    ]
                });
            }
        }
    },
    "lskyOpen": {
        "url": "/dashboard",
        "element": "#capacity-progress",
        "function": function () {
            function checkContentInFirstDiv(element: Element) {
                // 获取当前元素的父元素
                let parent = element.parentElement as HTMLElement;

                // 在父元素中查找第一个 div
                let firstDiv = parent.querySelector('div') as HTMLElement;
                if (firstDiv) {
                    return firstDiv?.textContent?.includes('仪表盘') && firstDiv.textContent.includes('上传图片') && firstDiv.textContent.includes('画廊') && firstDiv.textContent.includes('接口');
                }

                return false;
            }
            let isLsky = checkContentInFirstDiv(document.querySelector("#capacity-progress") as Element)
            if (isLsky) {
                let pathname = localStorage.getItem(getCurrentDomain())
                if (pathname !== "true") {
                    window.createNotification({
                        title: `发现：` + t("app_name") + `可配置图床`,
                        type: "警告",
                        content: `
                    <div style=" margin: 0 0 10px 0; ">
                        <label for="email">邮箱:</label>
                        <input type="text" id="email" name="email" style=" height: 30px; ">
                    </div>
                    <div style=" margin: 0 0 10px 0; ">
                        <label for="password">密码:</label>
                        <input type="password" id="password" name="password" style=" height: 30px; ">
                    </div>
                    填入邮箱和密码后，点击【添加到` + t("app_name") + `】按钮，可一键配置扩展`,
                        duration: 0,
                        buttons: [
                            {
                                text: "添加到" + t("app_name"),
                                style: "",
                                init: function () {
                                    let button = this
                                    let email = (document.querySelector(".window.createNotification-content #email") as HTMLInputElement)?.value
                                    let password = (document.querySelector(".window.createNotification-content #password") as HTMLInputElement)?.value
                                    let Body = new FormData();
                                    Body.append("email", email);
                                    Body.append("password", password);
                                    fetch(window.location.origin + "/api/v1/tokens", {
                                        "headers": {
                                            "Accept": "application/json",
                                        },
                                        "body": Body,
                                        "method": "POST",
                                    }).then(response => response.json())
                                        .then((data) => {
                                            console.log(data);
                                            if (data.data) {
                                                let config = {
                                                    "data": {
                                                        "Album_id": "",
                                                        "Program": "Lsky",
                                                        "Host": getCurrentDomain(),
                                                        "Permission": "0",
                                                        "Source": "1",
                                                        "Token": "Bearer " + data.data.token
                                                    },
                                                    "ConfigName": getCurrentDomain() + t("Config")
                                                }
                                                chrome.runtime.sendMessage({ loadConfig: { external: config } });
                                                window.postMessage({ type: "showIframe", show: true }, "*");
                                                (button as unknown as HTMLButtonElement).disabled = true

                                            } else {
                                                console.log(data);
                                                window.createNotification({
                                                    title: "添加失败",
                                                    type: "error",
                                                    content: "详细报错请打开,开发者控制台(F12)查看",
                                                    duration: 15,
                                                });
                                            }

                                        })
                                        .catch((error) => {
                                            console.error('Error:', error)
                                            window.createNotification({
                                                title: "添加失败",
                                                type: "error",
                                                content: "详细报错请打开,开发者控制台(F12)查看",
                                                duration: 15,
                                            });
                                        });
                                }
                            },
                            {
                                text: "本站不再提示",
                                style: "",
                                init: function (close) {
                                    localStorage.setItem(getCurrentDomain(), "true");
                                    close();
                                }
                            }
                        ]
                    });
                }
            }


        }
    },
    "EasyImage": {
        "url": "/admin/admin.inc.php",
        "element": "#myDataGrid", // 假设这是一个类选择器
        "function": function () {
            let pathname = localStorage.getItem(getCurrentDomain())
            if (pathname !== "true") {
                window.createNotification({
                    title: "发现：简单图床",
                    type: "success",
                    content: `在【API 设置】页刷新,可加载【添加到` + t("app_name") + `】按钮。<br>或者点击【一键创建token】按钮,创建token.`,
                    duration: 0,
                    buttons: [
                        {
                            text: "一键创建token",
                            style: "",
                            init: function () {
                                let button = this
                                let data = new URLSearchParams();
                                let token = crypto.randomUUID().replace(/-/g, '');
                                data.append("add_token", token);
                                data.append("add_token_expired", "1000");
                                data.append("add_token_id", Date.now().toString());
                                fetch(window.location.href, {
                                    "headers": {
                                        "accept": "application/json, text/plain, */*",
                                        "content-type": "application/x-www-form-urlencoded",
                                    },
                                    body: data,
                                    method: "POST",
                                })
                                    .then(response => {
                                        if (response.status === 200) {
                                            let data = {
                                                "data": {
                                                    "Program": "EasyImages",
                                                    "Host": getCurrentDomain(),
                                                    "Token": token
                                                },
                                                "ConfigName": getCurrentDomain() + t("Config")
                                            }
                                            chrome.runtime.sendMessage({ loadConfig: { external: data } });
                                            window.postMessage({ type: "showIframe", show: true }, "*");
                                            (button as unknown as HTMLButtonElement).disabled = true;
                                        }
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        window.createNotification({
                                            title: "一键创建token请求失败",
                                            type: "error",
                                            content: "详细报错请打开,开发者控制台(F12)查看",
                                            duration: 15,
                                        });
                                    });
                            }
                        },
                        {
                            text: "本站不再提示",
                            style: "",
                            init: function (close) {
                                localStorage.setItem(getCurrentDomain(), "true");
                                close();
                            }
                        }
                    ]
                });
            }

            if (document.querySelector('#myDataGrid')) {
                // 在 #myDataGrid 中查找所有符合条件的 <a> 标签
                const myDataGrid = document.querySelector('#myDataGrid') as HTMLElement;
                const links = myDataGrid.querySelectorAll('a[href*="admin.inc.php?delDir"]') as NodeListOf<HTMLAnchorElement>;
                // 为每个找到的 <a> 标签添加一个新元素
                links.forEach((link) => {
                    const newElement = document.createElement('div');
                    newElement.textContent = '添加到' + t("app_name");
                    newElement.classList.add("btn btn-mini btn-primary")
                    link?.parentNode?.insertBefore(newElement, link.nextSibling);
                    newElement.addEventListener('click', function () {
                        const inputElement = this.parentNode?.parentNode?.querySelector('div input') as HTMLInputElement;
                        let token = inputElement?.value || '';
                        let data = {
                            "data": {
                                "Program": "EasyImages",
                                "Host": getCurrentDomain(),
                                "Token": token
                            },
                            "ConfigName": getCurrentDomain() + t("Config")
                        }
                        chrome.runtime.sendMessage({ loadConfig: { external: data } });
                        window.postMessage({ type: "showIframe", show: true }, "*");
                    });
                    link.remove()
                });
            }
        }
    },
    "Chevereto": {
        "url": "/settings/api",
        "element": `meta[name="generator"][content^="Chevereto"]`, // 假设这是一个类选择器
        "function": function () {
            let pathname = localStorage.getItem(getCurrentDomain())
            if (pathname !== "true") {
                window.createNotification({
                    title: "发现：Chevereto图床",
                    type: "警告",
                    content: `点击【重新生成密钥】按钮，创建成功后点击【添加到` + t("app_name") + `】按钮，可加载【添加到` + t("app_name") + `】按钮。`,
                    duration: 0,
                    buttons: [
                        {
                            text: "添加到" + t("app_name"),
                            style: "",
                            init: function () {
                                try {
                                    let tokenElement = document.querySelector("#api_v1_key") as HTMLInputElement;
                                    if (!tokenElement) {
                                        throw new Error("Token element not found");
                                    }
                                    let token = tokenElement.value;
                                    let data = {
                                        "data": {
                                            "UploadPath": "",
                                            "Album_id": "",
                                            "Program": "Chevereto",
                                            "Expiration": "NODEL",
                                            "Host": getCurrentDomain(),
                                            "Nsfw": "0",
                                            "Token": token
                                        },
                                        "ConfigName": getCurrentDomain() + t("Config")
                                    }

                                    chrome.runtime.sendMessage({ loadConfig: { external: data } });
                                    window.postMessage({ type: "showIframe", show: true }, "*");
                                    (this as unknown as HTMLButtonElement).disabled = true
                                } catch (error) {
                                    alert("获取 Token 失败，请点击【重新生成密钥】按钮")
                                }
                            }
                        },
                        {
                            text: "本站不再提示",
                            style: "",
                            init: function (close) {
                                localStorage.setItem(getCurrentDomain(), "true");
                                close();
                            }
                        }
                    ]
                });
            }
        }
    },
    "16best": {
        "url": "111666.best",
        "element": "#root",
        "function": function () {
            function openDatabase(dbName: string, storeName: string, upgradeCallback: (db: IDBDatabase, storeName: string) => void): Promise<IDBDatabase> {
                return new Promise((resolve, reject) => {
                    let request = indexedDB.open(dbName);

                    request.onerror = function (event) {
                        const target = event.target as IDBRequest;
                        console.error("Database error: " + target?.error?.message);
                        reject(target?.error);
                    };

                    request.onsuccess = function (event) {
                        const target = event.target as IDBRequest;
                        resolve(target.result as IDBDatabase);
                    };

                    request.onupgradeneeded = function (event) {
                        const target = event.target as IDBRequest;
                        let db = target.result as IDBDatabase;
                        upgradeCallback(db, storeName);
                    };
                });
            }

            async function getAllDataFromIndexedDB(dbName: string, storeName: string): Promise<any[]> {
                const db = await openDatabase(dbName, storeName, (db: IDBDatabase, storeName: string) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });

                return new Promise((resolve, reject) => {
                    let transaction = db.transaction(storeName, "readonly");
                    let store = transaction.objectStore(storeName);
                    let getAllRequest = store.getAll();

                    getAllRequest.onerror = function () {
                        const target = getAllRequest as IDBRequest;
                        console.error("Get all request error: " + target?.error?.message);
                        reject(target?.error);
                    };

                    getAllRequest.onsuccess = function () {
                        resolve(getAllRequest.result);
                    };
                });
            }

            function addMultipleDataToIndexedDB(dbName: string, storeName: string, dataArray: any[]): Promise<any[]> {
                return new Promise((resolve, reject) => {
                    // 打开数据库
                    openDatabase(dbName, storeName, (db: IDBDatabase, storeName: string) => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            let objectStore = db.createObjectStore(storeName, { keyPath: 'id' }); // 指定 id 作为 keyPath
                            objectStore.createIndex('url', 'url', { unique: false });
                            objectStore.createIndex('token', 'token', { unique: false });
                            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                        }
                    }).then(db => {
                        // 创建一个包含所有添加操作的 Promise 数组
                        const addPromises = dataArray.map((data: any) => {
                            return new Promise((resolve, reject) => {
                                let transaction = db.transaction(storeName, "readwrite");
                                let store = transaction.objectStore(storeName);

                                let addRequest = store.put(data);

                                addRequest.onerror = function () {
                                    const target = addRequest as IDBRequest;
                                    console.error("Add request error: " + target?.error?.message);
                                    reject(target?.error);
                                };

                                addRequest.onsuccess = function () {
                                    resolve(addRequest.result);
                                };
                            });
                        });

                        // 使用 Promise.all 等待所有添加操作完成
                        Promise.all(addPromises)
                            .then(results => resolve(results))
                            .catch(error => reject(error));
                    }).catch(error => reject(error));
                });
            }
            // 清空对象存储的函数
            async function clearObjectStore(dbName: string, storeName: string): Promise<any> {
                const db = await openDatabase(dbName, storeName, (db: IDBDatabase, storeName: string) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id' }); // 如果对象存储不存在，则创建
                    }
                });

                return new Promise((resolve, reject) => {
                    let transaction = db.transaction(storeName, "readwrite");
                    let store = transaction.objectStore(storeName);

                    let clearRequest = store.clear();

                    clearRequest.onerror = function () {
                        const target = clearRequest as IDBRequest;
                        console.error("Clear request error: " + target?.error?.message);
                        reject(target?.error);
                    };

                    clearRequest.onsuccess = function () {
                        resolve(clearRequest.result);
                    };
                });
            }

            let pathname = localStorage.getItem(getCurrentDomain())
            if (pathname !== "true") {

                getAllDataFromIndexedDB('image-hosting', 'config')
                    .then(data => {
                        data.forEach(item => {
                            if (item.key == 'token') {
                                window.createNotification({
                                    title: "发现：16图床",
                                    type: "警告",
                                    content: `点击【添加到` + t("app_name") + `】按钮，可在` + t("app_name") + "中使用。",
                                    duration: 0,
                                    buttons: [
                                        {
                                            text: "添加到" + t("app_name"),
                                            style: "",
                                            init: function () {
                                                try {
                                                    let data = {
                                                        "data": {
                                                            "Program": "Custom",
                                                            "Url": "https://i.111666.best/image",
                                                            "authApiKey": "",
                                                            "authPassword": "",
                                                            "authToken": "",
                                                            "authType": "none",
                                                            "authUsername": "",
                                                            "body": [
                                                                {
                                                                    "key": "image",
                                                                    "value": "$file$"
                                                                }
                                                            ],
                                                            "bodyType": "form-data",
                                                            "headers": [
                                                                {
                                                                    "key": "Auth-Token",
                                                                    "value": item.value
                                                                }
                                                            ],
                                                            "keyReplace": {},
                                                            "method": "POST",
                                                            "params": [],
                                                            "responseAppend": "https://i.111666.best",
                                                            "responsePath": "src",
                                                            "responsePrefix": "",
                                                            "responseType": "json"
                                                        },
                                                        "ConfigName": getCurrentDomain() + t("Config")
                                                    }
                                                    chrome.runtime.sendMessage({ loadConfig: { external: data } });
                                                    window.postMessage({ type: "showIframe", show: true }, "*");
                                                    (this as unknown as HTMLButtonElement).disabled = true
                                                } catch (error) {
                                                    alert("获取 Token 失败，请点击【重新生成密钥】按钮")
                                                }
                                            }
                                        },
                                        {
                                            text: "本站不再提示",
                                            style: "",
                                            init: function (close) {
                                                localStorage.setItem(getCurrentDomain(), "true");
                                                close();
                                            }
                                        }
                                    ]
                                });
                            }
                        });
                    })
                    .catch(error => {

                    });
            }
            function convertTimestampToDate(timestamp: number): string {
                const date = new Date(timestamp);
                return date.toLocaleString();
            }
            function convertDateToTimestamp(dateString: string): number {
                const timestamp = Date.parse(dateString);
                if (!isNaN(timestamp)) {
                    return timestamp;
                } else {
                    return Date.now()
                }
            }
            if (document.querySelector(".navbar-end") !== null) {
                let button = document.createElement("button");
                button.className = "button is-primary is-small";
                button.style.cssText = "margin-left: 10px;";
                button.innerHTML = "与" + t("app_name") + "同步历史";
                button.addEventListener("click", function () {
                    window.createNotification({
                        title: "数据同步",
                        type: "警告",
                        content: `选择你要同步的对象`,
                        duration: 0,
                        buttons: [
                            {
                                text: getCurrentDomain() + "同步到" + t("app_name"),
                                style: "",
                                init: function () {
                                    chrome.storage.local.get('UploadLog', function (result) {
                                        let UploadLog = result.UploadLog || [];
                                        if (!Array.isArray(UploadLog)) {
                                            UploadLog = [];
                                        }
                                        getAllDataFromIndexedDB('image-hosting', 'images')
                                            .then(data => {
                                                data.forEach(item => {
                                                    UploadLog.push({
                                                        key: item.id,
                                                        url: "https://i.111666.best" + item.url,
                                                        uploadExe: "Custom-normal",
                                                        upload_domain_name: getCurrentDomain(),
                                                        original_file_name: item.url,
                                                        file_size: 0,
                                                        img_file_size: "宽:不支持,高:不支持",
                                                        uploadTime: convertTimestampToDate(item.timestramp),
                                                        token: item.token,
                                                    });
                                                });
                                                chrome.storage.local.set({ 'UploadLog': UploadLog }, function () {
                                                    window.createNotification({
                                                        title: "数据同步成功",
                                                        type: "成功",
                                                        content: "数据同步成功啦！",
                                                        duration: 0,
                                                    });
                                                    window.postMessage({ type: "showIframe", show: true }, "*");
                                                })
                                            })
                                    });
                                }
                            },
                            {
                                text: t("app_name") + "同步到" + getCurrentDomain(),
                                style: "",
                                init: function () {
                                    chrome.runtime.sendMessage({ indexedDB: { "name": 'Uploads', "method": 'getAll' } }, async (res) => {
                                        let response;
                                        const ProgramConfiguration = await Storage.get('ProgramConfiguration')
                                        if (res.data) {
                                            response = res.data;
                                        } else {
                                            return;
                                        }

                                        if (response) {
                                            const filteredData = response.filter((data: any) => {
                                                return data.uploadExe.includes("Custom") && data.url.includes("111666.best")
                                            }
                                            ).map((data: any) => ({
                                                "id": data.key,
                                                "url": data.url.replace(ProgramConfiguration.responseAppend || "https://i.111666.best", ""),
                                                "token": data.token || "pl" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                                                "timestramp": convertDateToTimestamp(data.uploadTime)
                                            }));
                                            addMultipleDataToIndexedDB('image-hosting', 'images', filteredData)
                                                .then(() => {
                                                    window.createNotification({
                                                        title: "数据同步成功",
                                                        type: "成功",
                                                        content: "数据同步成功啦！",
                                                        duration: 0,
                                                    });
                                                    // 刷新当前页面
                                                    window.location.reload();
                                                })
                                                .catch(error => {
                                                    console.error('Error adding data:', error);
                                                    window.createNotification({
                                                        title: "数据同步失败",
                                                        type: "失败",
                                                        content: "详细错误信息，查看控制台！",
                                                        duration: 0,
                                                    });
                                                });


                                        } else {
                                            console.error('No data received');
                                        }
                                    });
                                }
                            },
                            {
                                text: "清空" + getCurrentDomain() + "数据",
                                style: "",
                                init: function () {
                                    clearObjectStore('image-hosting', 'images')
                                        .then(result => {
                                            window.createNotification({
                                                title: "数据删除成功",
                                                type: "成功",
                                                content: "数据删除成功！",
                                                duration: 0,
                                            });
                                            window.location.reload();
                                        })
                                        .catch(error => {
                                            console.error('Error clearing object store:', error);
                                        });
                                }
                            }
                        ]
                    });
                });
                document.querySelector(".navbar-end")?.appendChild(button);


                // document.querySelector(".navbar-end .btn-ghost").addEventListener("click", function () {
                //     const spanElements = this.querySelectorAll('span');
                //     spanElements.forEach(span => {
                //         if (span.textContent.trim() === "历史图片") {
                //             // 延迟1秒
                //             setTimeout(() => {
                //                 let DeleteButton = document.querySelectorAll(".card-actions.justify-end");

                //                 DeleteButton.forEach(element => {
                //                     let figureElement = element.parentNode.parentNode.querySelector("figure > div");
                //                     if (figureElement) {
                //                         let backgroundImage = figureElement.style.backgroundImage;
                //                         let url = backgroundImage.match(/url\("(.*?)"\)/)[1];
                //                         let cleanedUrl = url.replace('blob:', '');
                //                         console.log('Cleaned URL:', cleanedUrl);
                //                     }
                //                     let button = document.createElement('button');
                //                     button.className = 'btn btn-outline btn-error btn-xs';
                //                     button.textContent = '强制删除';
                //                     element.appendChild(button);
                //                 });
                //             }, 1000);

                //         }
                //     });
                // });
            }

        }
    }
};

// 获取cookie
function xsrfTOKEN(button: HTMLButtonElement) {
    chrome.runtime.onMessage.addListener(async function (request) {
        if (request.XSRF_TOKEN) {
            try {
                const data = {
                    name: t("app_name"),
                    abilities: [
                        "user:profile", "image:tokens", "image:upload",
                        "image:list", "image:delete", "album:list",
                        "album:delete", "strategy:list"
                    ]
                };
                const response = await fetch(window.location.origin + "/user/tokens", {
                    headers: {
                        "accept": "application/json, text/plain, */*",
                        "content-type": "application/json",
                        "x-xsrf-token": request.XSRF_TOKEN
                    },
                    body: JSON.stringify(data),
                    method: "POST",
                });
                const responseData = await response.json();
                if (responseData.data) {
                    const config = {
                        data: {
                            Album_id: "",
                            Program: "Lsky",
                            Host: getCurrentDomain(),
                            Permission: "0",
                            Source: "2",
                            Token: "Bearer " + responseData.data.token
                        },
                        ConfigName: getCurrentDomain() + t("Config")
                    };
                    chrome.runtime.sendMessage({ loadConfig: { external: config } });
                    button.disabled = true;
                } else {
                    console.log(responseData);
                    window.createNotification({
                        title: "添加失败",
                        type: "error",
                        content: "详细报错请打开,开发者控制台(F12)查看",
                        duration: 15,
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                window.createNotification({
                    title: "添加失败",
                    type: "error",
                    content: "详细报错请打开,开发者控制台(F12)查看",
                    duration: 15,
                });
            }
        }
    });
}

// 检查当前页面的函数
export function checkImageBed() {
    const specialHostnames = ["111666.best"]; // 配置包含所有特殊域名

    let currentPath = specialHostnames.includes(window.location.hostname)
        ? window.location.hostname
        : window.location.pathname;


    for (const [key, info] of Object.entries(dataWithFunctions)) {
        if (currentPath === info.url && document.querySelector(info.element) !== null) {
            info.function();
            return;
        }
    }
}

function getCurrentDomain() {
    return window.location.hostname;
}

// ...existing code...
export default checkImageBed;
// ...existing code...