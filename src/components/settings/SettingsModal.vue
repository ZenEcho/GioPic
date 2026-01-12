<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useThemeStore, themeColors } from '@/stores/theme'
import { computed, ref, onMounted } from 'vue'
import { db } from '@/utils/storage'
import browser from 'webextension-polyfill'
import SetSidebar from './SetSidebar.vue'

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
}>()

const { t, locale } = useI18n()
const themeStore = useThemeStore()

const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')
const openMode = ref('tab')
const autoInject = ref(false)
const showSidebarSettings = ref(false)

onMounted(async () => {
    const mode = await db.get('open-mode')
    if (mode) {
        openMode.value = mode
    }
    const inject = await browser.storage.local.get('giopic-auto-inject')
    autoInject.value = !!inject['giopic-auto-inject']
})

async function setAutoInject(val: boolean) {
    autoInject.value = val
    await browser.storage.local.set({ 'giopic-auto-inject': val })
}

async function setOpenMode(mode: string) {
    openMode.value = mode
    await db.set('open-mode', mode)
    try {
        await browser.runtime.sendMessage({ type: 'UPDATE_OPEN_MODE', mode })
    } catch (e) {
        console.log('Failed to notify background script', e)
    }
}

async function changeLocale(lang: string) {
    locale.value = lang
    // Use storage.local for locale to share with content scripts
    await browser.storage.local.set({ 'giopic-locale': lang })
    try {
        await browser.runtime.sendMessage({ type: 'UPDATE_LOCALE', lang })
    } catch (e) {
        console.log('Failed to notify background script', e)
    }
}
</script>

<template>
    <n-modal :show="show" @update:show="(val: boolean) => emit('update:show', val)" preset="card" :title="t('settings.title')"
        class="w-full max-w-sm rounded-2xl" :segmented="false">
        <div class="space-y-6">
            <!-- 外观设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.appearance') }}</div>
                <div class="flex gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <button
                        class="flex-1 py-1.5 rounded-md transition-all font-medium text-xs flex items-center justify-center gap-2"
                       :class="!themeStore.isDark ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                        :style="!themeStore.isDark ? { backgroundColor: primaryColor} : {}"
                        @click="themeStore.isDark = false">
                        <div class="i-carbon-sun" /> {{ t('settings.lightMode') }}
                    </button>
                    <button
                        class="flex-1 py-1.5 rounded-md transition-all font-medium text-xs flex items-center justify-center gap-2"
                        :class="themeStore.isDark ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                        :style="themeStore.isDark ? { backgroundColor: primaryColor } : {}"
                        @click="themeStore.isDark = true">
                        <div class="i-carbon-moon" /> {{ t('settings.darkMode') }}
                    </button>
                </div>
            </div>

            <!-- 语言设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.language') }}</div>
                <div class="flex gap-2">
                    <button class="flex-1 py-2 rounded-lg border transition-all font-medium text-sm"
                        :class="locale === 'zh-CN' ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                        :style="locale === 'zh-CN' ? { backgroundColor: primaryColor} : {}"
                        @click="changeLocale('zh-CN')">
                        中文
                    </button>
                    <button class="flex-1 py-2 rounded-lg border transition-all font-medium text-sm"
                        :class="locale === 'en-US' ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                        :style="locale === 'en-US' ? { backgroundColor: primaryColor } : {}"
                        @click="changeLocale('en-US')">
                        English
                    </button>
                </div>
            </div>

            <!-- 自动化设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.automation') }}</div>
                <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('settings.autoInject') }}</span>
                    <n-switch v-model:value="autoInject" @update:value="setAutoInject" />
                </div>
            </div>

            <!-- 打开方式设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.openMode') }}</div>
                <div class="flex gap-2">
                    <button v-for="mode in ['tab', 'window', 'action']" :key="mode"
                        class="flex-1 py-2 rounded-lg border transition-all font-medium text-sm"
                        :class="openMode === mode ? 'text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                        :style="openMode === mode ? { backgroundColor: primaryColor } : {}"
                        @click="setOpenMode(mode)">
                        {{ t(`settings.openModes.${mode}`) }}
                    </button>
                </div>
            </div>

            <!-- 侧边栏设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.sidebar') }}</div>
                <button
                    class="w-full py-2 rounded-lg border transition-all font-medium text-sm flex items-center justify-center gap-2"
                    :class="'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                    @click="showSidebarSettings = true">
                    <div class="i-carbon-settings-adjust" /> {{ t('settings.sidebar') }}
                </button>
            </div>

            <!-- 主题色设置 -->
            <div>
                <div class="text-sm font-bold text-gray-500 mb-2">{{ t('settings.theme') }}</div>
                <div class="grid grid-cols-5 gap-2">
                    <button v-for="(color, key) in themeColors" :key="key"
                        class="w-full aspect-square rounded-full transition-all flex items-center justify-center hover:scale-110"
                        :style="{ backgroundColor: color.primary }" @click="themeStore.setThemeColor(key)">
                        <div v-if="themeStore.currentColor === key"
                            class="i-carbon-checkmark text-white text-lg font-bold" />
                    </button>
                </div>
            </div>
        </div>
    </n-modal>
    <SetSidebar v-model:show="showSidebarSettings" />
</template>
