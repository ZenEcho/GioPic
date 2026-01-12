import { defineConfig, presetUno, presetIcons, presetAttributify, presetTypography } from 'unocss'

export default defineConfig({
    presets: [
        presetUno(), // 中文：UnoCSS 默认预设
        presetAttributify(),
        presetTypography(), // 中文：排版预设
        presetIcons({
            collections: {
                carbon: () => import('@iconify-json/carbon/icons.json').then(m => m.default || m),
            },
        }),
    ],
    shortcuts: {
        'accent-text': 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500',
    }
})