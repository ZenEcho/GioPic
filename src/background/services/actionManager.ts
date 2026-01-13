import browser from 'webextension-polyfill'
import { db } from '@/utils/storage'

const POPUP_URL = 'index.html'

export async function getOpenMode() {
    return (await db.get('open-mode')) || 'tab'
}

export async function updateActionBehavior() {
    const mode = await getOpenMode()
    console.log('Updating action behavior to:', mode)
    if (mode === 'action') {
        browser.action.setPopup({ popup: POPUP_URL })
    } else {
        browser.action.setPopup({ popup: '' })
    }
}
