import './polyfill'
import browser from 'webextension-polyfill'
import { setupContextMenus } from './services/contextMenu'
import { getOpenMode, updateActionBehavior } from './services/actionManager'
import { handleMessage } from './services/messageService'
import { initDesktopLinkOnStartup } from './services/desktopLink'

const POPUP_URL = 'index.html'

console.log('GioPic background script started')

// 初始化
updateActionBehavior()
setupContextMenus()
initDesktopLinkOnStartup()

browser.runtime.onMessage.addListener(handleMessage)

// 处理非弹窗模式下的点击事件
browser.action.onClicked.addListener(async (tab) => {
    const mode = await getOpenMode()
    if (mode === 'tab') {
        browser.tabs.create({ url: POPUP_URL })
    } else if (mode === 'window') {
        browser.windows.create({
            type: "popup",
            url: POPUP_URL,
            width: 1200,
            height: 750
        })
    }
})

// 安装事件处理
browser.runtime.onInstalled.addListener(() => {
    console.log('GioPic installed')
    setupContextMenus()
})

browser.runtime.onStartup.addListener(() => {
    setupContextMenus()
})
