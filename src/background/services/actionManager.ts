import browser from 'webextension-polyfill'

const POPUP_URL = 'index.html'

export async function getOpenMode() {
    const res = await browser.storage.local.get('open-mode')
    return res['open-mode'] || 'tab'
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
