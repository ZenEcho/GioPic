import browser from 'webextension-polyfill'
import type { Runtime } from 'webextension-polyfill'
import { db } from '@/utils/storage'
import { updateActionBehavior } from './actionManager'
import { updateContextMenuLocale } from './contextMenu'
import i18n from '@/i18n'
import type { DriveConfig } from '@/types'

export async function handleMessage(message: any, sender: Runtime.MessageSender) {
    if (message.type === 'UPDATE_OPEN_MODE') {
        await updateActionBehavior()
    } else if (message.type === 'UPDATE_LOCALE') {
        if (message.lang && (message.lang === 'zh-CN' || message.lang === 'en-US')) {
            i18n.global.locale.value = message.lang
            updateContextMenuLocale()
        }
    } else if (message.type === 'RELAY_UPLOAD_SUCCESS') {
        await relayUploadSuccess(message)
    } else if (message.getXsrfToken === 'getXsrfToken' || message.type === 'GET_XSRF_TOKEN') {
        await handleGetXsrfToken(message, sender)
    } else if (message.type === 'ADD_CONFIG') {
        await handleAddConfig(message, sender)
    } else if (message.type === 'FETCH_IMAGE_BLOB') {
        return await handleFetchImageBlob(message)
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

async function relayUploadSuccess(message: any) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
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
