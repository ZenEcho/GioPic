<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import type { DriveConfig } from '@/types'
import { useDialog } from 'naive-ui'
import browser from 'webextension-polyfill'

const props = defineProps<{
    selectedIds: string[],
    currentView: string
}>()

const emit = defineEmits<{
    (e: 'update:selectedIds', value: string[]): void
    (e: 'navigate', view: 'upload' | 'history'): void
    (e: 'add'): void
    (e: 'edit', config: DriveConfig): void
    (e: 'openSettings'): void
}>()

const { t } = useI18n()
const configStore = useConfigStore()
const themeStore = useThemeStore()
const dialog = useDialog()

const currentVersion = ref('2.0.0')
const isConfigExpanded = ref(true)
const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')
const primaryColorSuppl = computed(() => themeStore.themeOverrides?.common?.primaryColorSuppl || '#e6f7ff')
function toggleConfigSelection(id: string) {
    let newIds = [...props.selectedIds]
    if (newIds.includes(id)) {
        newIds = newIds.filter(cid => cid !== id)
    } else {
        newIds.push(id)
    }
    emit('update:selectedIds', newIds)
}

function handleDelete(config: DriveConfig) {
    dialog.warning({
        title: t('common.delete'),
        content: t('common.deleteConfirm'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        onPositiveClick: () => {
            configStore.removeConfig(config.id)
            if (props.selectedIds.includes(config.id)) {
                emit('update:selectedIds', props.selectedIds.filter(id => id !== config.id))
            }
        }
    })
}
onMounted(() => {
    try {
        const manifest = browser.runtime.getManifest()
        if (manifest && manifest.version) {
            currentVersion.value = manifest.version
        }
    } catch (e) {
        console.warn('Failed to get manifest version', e)
    }

})
</script>

<template>
    <div
        class="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <!-- 头部 -->
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div class="text-sm font-bold text-gray-500">{{ t('home.myImages') }}</div>
            <button class="giopic-icon-btn text-gray-400 hover:text-primary" @click="emit('openSettings')">
                <div class="i-ph-gear text-xl" />
            </button>
        </div>

        <!-- 导航区 -->
        <div class="p-3 space-y-2">
            <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
                :class="currentView === 'upload' ? 'bg-primary text-white dark:bg-green-900/20 ' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                @click="emit('navigate', 'upload')">
                <div class="i-ph-cloud-arrow-up text-lg" />
                {{ t('home.sidebar.upload') }}
            </button>

            <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
                :class="currentView === 'history' ? 'bg-primary text-white dark:bg-gray-700 ' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'"
                @click="emit('navigate', 'history')">
                <div class="i-ph-image text-lg" />
                {{ t('home.sidebar.history') }}
            </button>
        </div>

        <!-- 分隔线 -->
        <div class="h-px bg-gray-100 dark:bg-gray-700 mx-4 my-2"></div>

        <!-- 存储配置区 -->
        <div class="flex-1 overflow-hidden flex flex-col">
            <div class="px-4 py-2 flex items-center justify-between group">
                <div class="text-sm font-bold text-gray-500">{{ t('home.sidebar.nodes') }}</div>
                <div class="flex items-center gap-1  transition-opacity">
                    <div class="giopic-icon-btn w-6 h-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-primary cursor-pointer flex items-center justify-center"
                        @click="emit('add')" :title="t('home.addNode')">
                        <div class="i-ph-plus text-xl" />
                    </div>
                    <div class="giopic-icon-btn w-6 h-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 cursor-pointer flex items-center justify-center"
                        @click="isConfigExpanded = !isConfigExpanded">
                        <div class="transform transition-transform duration-200 flex items-center justify-center"
                            :class="isConfigExpanded ? 'rotate-180' : ''">
                            <div class="i-ph-caret-up text-xl" />
                        </div>
                    </div>

                </div>
            </div>

            <div class="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar transition-[max-height] duration-300"
                :class="isConfigExpanded ? 'opacity-100' : 'opacity-0 max-h-0 pointer-events-none'">
                <div v-if="configStore.configs.length === 0" class="text-center py-4 text-xs text-gray-400">
                    {{ t('home.noNodes') }}
                </div>

                <div v-for="config in configStore.configs" :key="config.id"
                    class="group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
                    :class="selectedIds.includes(config.id) ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                    @click="toggleConfigSelection(config.id)">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        <div class="text-lg"
                            :class="selectedIds.includes(config.id) ? 'text-primary' : 'text-gray-300 dark:text-gray-600'">
                            <div :class="selectedIds.includes(config.id) ? 'i-ph-check-circle-fill' : 'i-ph-circle'" />
                        </div>
                        <span class="text-sm font-medium truncate"
                            :class="selectedIds.includes(config.id) ? 'text-primary dark:text-primary' : 'text-gray-700 dark:text-gray-300'">
                            {{ config.name }}
                        </span>
                    </div>

                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="p-1 text-gray-400 hover:text-primary transition-colors"
                            @click.stop="emit('edit', config)">
                            <div class="i-ph-pencil-simple text-xs" />
                        </button>
                        <button class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            @click.stop="handleDelete(config)">
                            <div class="i-ph-trash text-xs" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部 -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between text-xs text-gray-400">
                <span>{{ t('app.name') }} v{{ currentVersion }}</span>
                <button class="hover:text-primary dark:text-primary" @click="themeStore.toggleDark()">
                    <div class="text-xl hover:text-primary text-gray-400 "
                        :class="themeStore.isDark ? 'i-ph-moon' : 'i-ph-sun'" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bg-primary {
    background-color: v-bind(primaryColor);
}

.bg-primary-50 {
    background-color: v-bind(primaryColorSuppl);
}

.text-primary {
    color: v-bind(primaryColor);
}

.hover\:text-primary:hover {
    color: v-bind(primaryColor);
}

.bg-primary-50 {
    background-color: color-mix(in srgb, v-bind(primaryColor) 10%, transparent);
}

:global(.dark) .dark\:text-primary {
    color: v-bind(primaryColor);
}

:global(.dark) .dark\:hover\:text-primary:hover {
    color: v-bind(primaryColor);
}

:global(.dark) .dark\:bg-primary-900\/10 {
    background-color: color-mix(in srgb, v-bind(primaryColor) 15%, transparent);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #374151;
}
</style>