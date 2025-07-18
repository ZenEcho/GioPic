import fs from 'fs-extra'
import type PkgType from '../package.json'
import type { Manifest } from 'webextension-polyfill'
import { isDev, isFirefox, port, r } from '../scripts/utils'

export async function getManifest() {
    const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

    const manifest: Manifest.WebExtensionManifest = {
        manifest_version: 3,
        name: pkg.displayName || pkg.name,
        version: pkg.version,
        description: pkg.description,
        homepage_url: "https://fileup.dev/",
        background: isFirefox ? {
            scripts: [
                "background.js"
            ],
            type: "module"
        } : {
            service_worker: 'background.js',
            "type": "module"
        },
        content_scripts: [
            {
                matches: [
                    "<all_urls>"
                ],
                js: [
                    "content/content.js",
                    "content/upload.js",
                ],
                css: [
                    "content/content.css",
                ],
            }
        ],
        web_accessible_resources: [
            {
                "resources": [
                    "*.html",
                    "assets/icons/*.png",
                    "content/content.css",
                    "fullDOM/*.js",
                    "fullDOM/*.css",
                ],
                "matches": [
                    "<all_urls>"
                ]
            }
        ],
        action: {
            default_popup: '',
            default_icon: "assets/icons/logo64.png",
        },
        icons: {
            "16": "assets/icons/logo16.png",
            "32": "assets/icons/logo32.png",
            "64": "assets/icons/logo64.png",
            "128": "assets/icons/logo128.png"
        },
        permissions: [
            "storage",
            "contextMenus",
            "notifications",
            "cookies",
            "declarativeNetRequestWithHostAccess",
            "declarativeNetRequestFeedback"
        ],
        host_permissions: [
            "*://*/*",
            "*://111666.best/*"
        ],
        content_security_policy: {
            extension_pages: isDev
                ? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
                : 'script-src \'self\'; object-src \'self\'',
        },
    }

    // 添加火狐浏览器特定设置
    if (isFirefox) {
        // manifest.browser_specific_settings = {
        //     gecko: {
        //         id: "your-extension-id@mozilla.org",
        //         strict_min_version: "42.0"
        //     }
        // }
    }

    return manifest
}
