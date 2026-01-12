import browser from 'webextension-polyfill'

// Helper: Send notification to active tab or fallback to system notification
export async function notify(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true })
        if (tabs.length > 0 && tabs[0]?.id) {
            await browser.tabs.sendMessage(tabs[0]?.id, {
                type: 'SHOW_TOAST',
                data: { title, message, type }
            })
        } else {
            // Fallback to native notification
            browser.notifications.create({
                type: 'basic',
                iconUrl: browser.runtime.getURL('assets/icons/logo64.png'),
                title,
                message
            })
        }
    } catch (e) {
        // Fallback to native notification if content script not available
        browser.notifications.create({
            type: 'basic',
            iconUrl: browser.runtime.getURL('assets/icons/logo64.png'),
            title,
            message
        })
    }
}
