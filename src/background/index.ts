import './polyfill'
import browser from 'webextension-polyfill'
import { setupContextMenus } from './services/contextMenu'
import { getOpenMode, updateActionBehavior } from './services/actionManager'
import { handleMessage } from './services/messageService'

const POPUP_URL = 'index.html'

console.log('GioPic background script started')

// Initialize
updateActionBehavior()
setupContextMenus()

browser.runtime.onMessage.addListener(handleMessage)

// Handle clicks for non-popup modes
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

// Install Handler
browser.runtime.onInstalled.addListener(() => {
    console.log('GioPic installed')
    setupContextMenus()
})

browser.runtime.onStartup.addListener(() => {
    setupContextMenus()
})
