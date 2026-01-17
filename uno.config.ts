import { defineConfig, presetUno, presetIcons, presetAttributify, presetTypography } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(), // 中文：UnoCSS 默认预设
        presetAttributify(),
        presetTypography(), // 中文：排版预设
        presetIcons({
            // 自动加载已安装的图标库 (@iconify-json/ph)
        }),
    ],
    shortcuts: {
        'accent-text': 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500',
    },
    safelist: [
        'i-ph-image',
        'i-ph-cloud',
        'i-ph-amazon-logo',
        'i-ph-github-logo',
        'i-ph-hard-drive',
    ]
})
