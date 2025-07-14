import { createApp, h } from 'vue'
import { NNotificationProvider } from 'naive-ui'
import notificationView from './components/notification.vue'
import stickerView from './components/sticker.vue'
import sidebarView from './components/webSidebar.vue'
import { checkImageBed } from './getToken'
import 'virtual:uno.css'

import { useLocalStorage } from '@/stores/useLocalStorage';

// 组件加载状态机
let notificationLoaded = false
let stickerLoaded = false

// 加载notification组件函数
function loadNotificationComponent() {
    if (notificationLoaded) return
    const container = document.createElement('div')
    const root = document.createElement('div')
    const styleEl = document.createElement('link')
    const shadowDOM = container.attachShadow({ mode: "closed" })
    styleEl.setAttribute('rel', 'stylesheet')
    styleEl.setAttribute('href', chrome.runtime.getURL('content/content.css'))
    shadowDOM.appendChild(styleEl)
    shadowDOM.appendChild(root)
    document.body.appendChild(container)

    // 使用 h 函数创建包装组件
    const NotificationWrapper = {
        render: () => h(NNotificationProvider, null, {
            default: () => h(notificationView)
        })
    }

    const app = createApp(NotificationWrapper)
    app.mount(root);
    notificationLoaded = true
}

// 加载sticker组件函数保持不变
function loadStickerComponent() {
    const container = document.createElement('div')
    const root = document.createElement('div')
    const styleEl = document.createElement('link')
    const shadowDOM = container.attachShadow({ mode: "closed" })
    styleEl.setAttribute('rel', 'stylesheet')
    styleEl.setAttribute('href', chrome.runtime.getURL('content/content.css'))
    shadowDOM.appendChild(styleEl)
    shadowDOM.appendChild(root)
    document.body.appendChild(container)
    const app = createApp(stickerView)
    app.mount(root);
    stickerLoaded = true
}
// 加载sidebar组件函数
function loadSidebarComponent() {
    useLocalStorage.get("uploadArea").then((uploadAreaDat) => {
        if (!uploadAreaDat.status) {
            return;
        }
        const container = document.createElement('div')
        const root = document.createElement('div')
        const styleEl = document.createElement('link')
        const shadowDOM = container.attachShadow({ mode: "closed" })
        styleEl.setAttribute('rel', 'stylesheet')
        styleEl.setAttribute('href', chrome.runtime.getURL('content/content.css'))
        shadowDOM.appendChild(styleEl)
        shadowDOM.appendChild(root)
        document.body.appendChild(container)
        const app = createApp(sidebarView)
        app.mount(root);
    })
}
// 初始化，初始化并加载组件,全部加载完毕后返回真
function init() {
    return new Promise((resolve) => {
        if (notificationLoaded && stickerLoaded) {
            resolve(true)
            return
        }
        loadSidebarComponent()
        loadNotificationComponent()
        loadStickerComponent()
        resolve(true)
    })
}


// 注入js函数,注入js到页面中
function injectScript(src: string) {
    const script = document.createElement('script')
    script.src = chrome.runtime.getURL(src)
    script.type = 'module'
    document.head?.appendChild(script) || document.documentElement.appendChild(script)
}

// 注入css函数,注入css到页面中
function injectStyle(src: string) {
    const link = document.createElement('link')
    link.href = chrome.runtime.getURL(src)
    link.type = 'text/css'
    link.rel = 'stylesheet'
    document.head?.appendChild(link) || document.documentElement.appendChild(link)
}

function handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    if (request.AutoInsert) {
        window.postMessage({ type: 'giopic_textInsert', data: request.AutoInsert }, '*');
    }
    return true; // 表示异步响应
}
init().then(() => {
    console.log('all components loaded')
    checkImageBed()
    // 注入js和css到页面中
    injectScript('fullDOM/dom.js')
    injectStyle('fullDOM/dom.css')
    
    useLocalStorage.get("uploadFunctionSettings").then((uploadFunctionSettings) => {
        if (uploadFunctionSettings.autoInsert) {
            chrome.runtime.onMessage.addListener(handleMessage);
        }
    })
})
