import browser from 'webextension-polyfill'
import type { Runtime } from 'webextension-polyfill'
import { db } from '@/utils/storage'
import { updateActionBehavior } from './actionManager'
import { updateContextMenuLocale } from './contextMenu'
import i18n from '@/i18n'
import type { DriveConfig } from '@/types'

type DesktopLinkStatusType = 'disabled' | 'disconnected' | 'connecting' | 'connected' | 'error'

interface DesktopLinkStatusPayload {
    enabled: boolean
    status: DesktopLinkStatusType
    lastError?: string
}

const DESKTOP_LINK_ENABLED_KEY = 'giopic-desktop-link-enabled'
const DESKTOP_WS_URL = 'ws://127.0.0.1:26725/giopic'

let desktopWs: WebSocket | null = null
let desktopEnabled = false
let desktopStatus: DesktopLinkStatusType = 'disabled'
let desktopLastError: string | undefined

export async function handleMessage(message: any, sender: Runtime.MessageSender) {
    if (message.type === 'UPDATE_OPEN_MODE') {
        await updateActionBehavior()
    } else if (message.type === 'UPDATE_LOCALE') {
        if (message.lang && (message.lang === 'zh-CN' || message.lang === 'en-US')) {
            i18n.global.locale.value = message.lang
            updateContextMenuLocale()
        }
    } else if (message.type === 'RELAY_UPLOAD_SUCCESS') {
        await relayUploadSuccess(message, sender)
    } else if (message.getXsrfToken === 'getXsrfToken' || message.type === 'GET_XSRF_TOKEN') {
        await handleGetXsrfToken(message, sender)
    } else if (message.type === 'ADD_CONFIG') {
        await handleAddConfig(message, sender)
    } else if (message.type === 'FETCH_IMAGE_BLOB') {
        return await handleFetchImageBlob(message)
    } else if (message.type === 'REGISTER_CONTENT') {
        await handleRegisterContent(sender)
    } else if (message.type === 'DESKTOP_LINK_GET_STATUS') {
        return getDesktopLinkStatus()
    } else if (message.type === 'DESKTOP_LINK_SET_ENABLED') {
        await setDesktopLinkEnabled(Boolean(message.enabled))
    }
}

async function handleFetchImageBlob(message: any) {
    const url = message.url
    if (!url) return null

    // Add dynamic rule for Referer
    if (url.includes('i.111666.best')) {
        try {
            const ruleId = 111666
            await browser.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [ruleId],
                addRules: [{
                    id: ruleId,
                    priority: 1,
                    action: {
                        type: 'modifyHeaders' as any,
                        requestHeaders: [{
                            header: 'Referer',
                            operation: 'set' as any,
                            value: url
                        }]
                    },
                    condition: {
                        urlFilter: url,
                        resourceTypes: ['xmlhttprequest', 'other', 'image'] as any
                    }
                }]
            })
        } catch (e) {
            console.error('Failed to set DNR rules', e)
        }
    }

    try {
        const response = await fetch(url)
        const blob = await response.blob()
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch (e) {
        console.error('Fetch failed', e)
        return null
    }
}

async function relayUploadSuccess(message: any, sender: Runtime.MessageSender) {
    const senderTabId = sender.tab?.id
    if (senderTabId) {
        await browser.tabs.sendMessage(senderTabId, {
            type: 'UPLOAD_EVENT',
            data: {
                event: 'success',
                id: message.id || 'relay',
                payload: message.payload
            }
        })
        return
    }
    try {
        const store = await browser.storage.local.get('giopic-last-content-tab')
        const lastTabId = store['giopic-last-content-tab'] as number | undefined
        if (lastTabId) {
            await browser.tabs.sendMessage(lastTabId, {
                type: 'UPLOAD_EVENT',
                data: {
                    event: 'success',
                    id: message.id || 'relay',
                    payload: message.payload
                }
            })
            return
        }
    } catch {}
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs && tabs.length > 0 && tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id!, {
            type: 'UPLOAD_EVENT',
            data: {
                event: 'success',
                id: message.id || 'relay',
                payload: message.payload
            }
        })
    }
}

async function injectUrlToContent(url: string) {
    try {
        const store = await browser.storage.local.get('giopic-last-content-tab')
        const lastTabId = store['giopic-last-content-tab'] as number | undefined
        if (lastTabId) {
            await browser.tabs.sendMessage(lastTabId, {
                type: 'MANUAL_INJECT',
                payload: { url }
            })
            return
        }
    } catch {}
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs && tabs.length > 0 && tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id!, {
            type: 'MANUAL_INJECT',
            payload: { url }
        })
    }
}

async function handleGetXsrfToken(message: any, sender: Runtime.MessageSender) {
    const url = message.url as string
    let token = ''
    try {
        const c1 = await browser.cookies.get({ url, name: 'XSRF-TOKEN' })
        const c2 = token ? null : await browser.cookies.get({ url, name: 'XSRF_TOKEN' })
        const raw = c1?.value || c2?.value || ''
        token = raw ? decodeURIComponent(raw) : ''
    } catch {
        token = ''
    }
    if (sender.tab?.id) {
        browser.tabs.sendMessage(sender.tab.id, { XSRF_TOKEN: token })
    }
}

async function handleAddConfig(message: any, sender: Runtime.MessageSender) {
    const data = message.payload as Partial<DriveConfig>
    if (!data) return
    const id = `${(data.type || 'lsky')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const defaultName = (() => {
        try {
            const u = sender.tab?.url ? new URL(sender.tab.url) : null
            return u?.hostname || 'GioPic'
        } catch {
            return 'GioPic'
        }
    })()

    const cfg = {
        ...data,
        id,
        name: data.name || defaultName,
        enabled: true,
        type: data.type || 'lsky'
    } as DriveConfig

    try {
        const list = await db.get<DriveConfig[]>('giopic-configs')
        const configs = list || []
        configs.push(cfg)
        await db.set('giopic-configs', configs)

        const selected = (await db.get<string[]>('giopic-selected-ids')) || []
        if (!selected.includes(id)) {
            selected.push(id)
            await db.set('giopic-selected-ids', selected)
        }
    } catch (e) {
        console.error('Failed to add config', e)
    }
}

async function handleRegisterContent(sender: Runtime.MessageSender) {
    const tabId = sender.tab?.id
    if (!tabId) return
    try {
        await browser.storage.local.set({ 'giopic-last-content-tab': tabId })
    } catch {}
}

function broadcastDesktopLinkStatus() {
    const payload = getDesktopLinkStatus()
    try {
        browser.runtime.sendMessage({
            type: 'DESKTOP_LINK_STATUS',
            payload
        })
    } catch {}
}

function getDesktopLinkStatus(): DesktopLinkStatusPayload {
    return {
        enabled: desktopEnabled,
        status: desktopEnabled ? desktopStatus : 'disabled',
        lastError: desktopLastError
    }
}

async function setDesktopLinkEnabled(enabled: boolean) {
    desktopEnabled = enabled
    if (!enabled) {
        desktopStatus = 'disabled'
        desktopLastError = undefined
        if (desktopWs) {
            try {
                desktopWs.close()
            } catch {}
            desktopWs = null
        }
        try {
            await browser.storage.local.set({ [DESKTOP_LINK_ENABLED_KEY]: false })
        } catch {}
        broadcastDesktopLinkStatus()
        return
    }
    try {
        await browser.storage.local.set({ [DESKTOP_LINK_ENABLED_KEY]: true })
    } catch {}
    connectDesktopWebSocket()
    broadcastDesktopLinkStatus()
}

function connectDesktopWebSocket() {
    if (!desktopEnabled) {
        desktopStatus = 'disabled'
        desktopLastError = undefined
        desktopWs = null
        return
    }
    if (desktopWs && desktopStatus === 'connected') {
        return
    }
    try {
        desktopStatus = 'connecting'
        desktopLastError = undefined
        broadcastDesktopLinkStatus()
        const ws = new WebSocket(DESKTOP_WS_URL)
        desktopWs = ws
        ws.onopen = () => {
            desktopStatus = 'connected'
            desktopLastError = undefined
            broadcastDesktopLinkStatus()
            const hello = {
                type: 'hello',
                client: 'giopic-extension',
                version: browser.runtime.getManifest().version,
                features: ['autoInsert']
            }
            try {
                ws.send(JSON.stringify(hello))
            } catch {}
        }
        ws.onclose = () => {
            desktopWs = null
            desktopStatus = desktopEnabled ? 'disconnected' : 'disabled'
            broadcastDesktopLinkStatus()
        }
        ws.onerror = () => {
            desktopStatus = 'error'
            desktopLastError = 'WebSocket error'
            broadcastDesktopLinkStatus()
        }
        ws.onmessage = async (event) => {
            const raw = event.data
            let data: any
            try {
                if (typeof raw === 'string') {
                    data = JSON.parse(raw)
                } else if (raw instanceof ArrayBuffer) {
                    const text = new TextDecoder().decode(raw)
                    data = JSON.parse(text)
                } else {
                    return
                }
            } catch {
                return
            }
            if (!data || typeof data !== 'object') {
                return
            }
            if (data.type === 'upload_success' && typeof data.url === 'string') {
                await injectUrlToContent(data.url)
            }
        }
    } catch {
        desktopStatus = 'error'
        desktopLastError = 'WebSocket init failed'
        desktopWs = null
        broadcastDesktopLinkStatus()
    }
}

export async function initDesktopLinkOnStartup() {
    try {
        const store = await browser.storage.local.get(DESKTOP_LINK_ENABLED_KEY)
        desktopEnabled = store[DESKTOP_LINK_ENABLED_KEY] === true
    } catch {
        desktopEnabled = false
    }
    if (desktopEnabled) {
        connectDesktopWebSocket()
    } else {
        desktopStatus = 'disabled'
        desktopLastError = undefined
    }
    broadcastDesktopLinkStatus()
}
