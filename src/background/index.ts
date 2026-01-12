import './polyfill'
import browser from 'webextension-polyfill'
import { db } from '@/utils/storage'
import { setupContextMenus, updateContextMenuLocale } from './services/contextMenu'
import i18n from '@/i18n'

const POPUP_URL = 'index.html'

console.log('GioPic background script started')

// Open Mode Logic
async function getOpenMode() {
    return (await db.get('open-mode')) || 'tab'
}

async function updateActionBehavior() {
    const mode = await getOpenMode()
    console.log('Updating action behavior to:', mode)
    if (mode === 'action') {
        browser.action.setPopup({ popup: POPUP_URL })
    } else {
        browser.action.setPopup({ popup: '' })
    }
}

// Initialize
updateActionBehavior()
setupContextMenus()

// Listen for updates from settings
browser.runtime.onMessage.addListener((message: any) => {
    if (message.type === 'UPDATE_OPEN_MODE') {
        updateActionBehavior()
    } else if (message.type === 'UPDATE_LOCALE') {
        if (message.lang && (message.lang === 'zh-CN' || message.lang === 'en-US')) {
            i18n.global.locale.value = message.lang
            updateContextMenuLocale()
        }
    } else if (message.type === 'RELAY_UPLOAD_SUCCESS') {
        // Relay upload success message to the active tab
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
            if (tabs && tabs.length > 0 && tabs[0] && tabs[0].id) {
                browser.tabs.sendMessage(tabs[0].id, {
                    type: 'UPLOAD_EVENT',
                    data: {
                        event: 'success',
                        id: message.id || 'relay',
                        payload: message.payload
                    }
                })
            }
        })
    }
})

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
