<script setup lang="ts">
import { useConfigStore } from '@/stores/config'
import { useThemeStore, themeColors } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import { useDialog, useMessage } from 'naive-ui'
import type { DriveConfig } from '@/types'
import { ref, computed } from 'vue'

const props = defineProps<{
    selectedIds: string[]
}>()

const emit = defineEmits<{
    (e: 'update:selectedIds', value: string[]): void
    (e: 'add'): void
    (e: 'edit', config: DriveConfig): void
    (e: 'openSettings'): void
}>()

const { t } = useI18n()
const dialog = useDialog()
const message = useMessage()
const configStore = useConfigStore()
const themeStore = useThemeStore()
const isHovered = ref(false)

const showImportModal = ref(false)
const importJson = ref('')

const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')
const primaryColorSuppl = computed(() => themeStore.themeOverrides?.common?.primaryColorSuppl || '#ecf5ff')
const primaryColorHover = computed(() => themeStore.themeOverrides?.common?.primaryColorHover || '#66b1ff')

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

function handleShare(config: DriveConfig) {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    message.success(t('common.copied'))
}

function handleShareAll() {
    navigator.clipboard.writeText(JSON.stringify(configStore.configs, null, 2))
    message.success(t('common.copied'))
}

async function handleRefresh() {
    await configStore.reload()
    message.success(t('common.success'))
}

function handleImport() {
    showImportModal.value = true
    importJson.value = ''
}

function confirmImport() {
    try {
        const parsed = JSON.parse(importJson.value)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        let count = 0
        list.forEach(item => {
            if (item && item.type && item.name) {
                // Generate new ID
                const newConfig = {
                    ...item,
                    id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
                }
                configStore.addConfig(newConfig)
                count++
            }
        })
        if (count > 0) {
            message.success(t('home.importSuccess', { count }))
            showImportModal.value = false
        } else {
            message.warning(t('home.importNoData'))
        }
    } catch (e) {
        message.error(t('home.importFailed'))
    }
}
</script>

<template>
    <div class="config-list-container flex flex-col bg-white dark:bg-gray-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0 transition-all duration-300"
        :class="[
            isHovered ? 'mobile-expanded' : 'mobile-collapsed',
            'md:w-[288px] md:h-auto md:static md:translate-y-0 md:m-6'
        ]" @mouseenter="isHovered = true" @mouseleave="isHovered = false" @click="isHovered = true">
        <div class="flex flex-row items-center mb-8 header-section">
            <div class="w-full text-2xl font-black tracking-tighter dark:text-white">{{ t('app.name') }}-<span
                    class="text-primary">{{ t('app.nameSuffix') }}</span></div>

            <div class="flex flex-row items-center gap-1">
                <button class="giopic-icon-btn text-gray-400 hover:text-primary text-xl"
                    @click="themeStore.isDark = !themeStore.isDark">
                    <div :class="themeStore.isDark ? 'i-carbon-moon' : 'i-carbon-sun'" />
                </button>
                <button class="giopic-icon-btn text-gray-400 hover:text-primary text-xl"
                    @click.stop="emit('openSettings')">
                    <div class="i-carbon-settings" />
                </button>
            </div>
        </div>

        <div class="content-section flex flex-col flex-1 overflow-hidden transition-all duration-300">
            <div
                class="mb-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex flex-row justify-between">
                <div class="flex flex-row items-center gap-2">
                   <div>{{ t('home.nodes') }}</div>
                       <div class="flex flex-row items-center">
                        <button v-for="(color, key) in themeColors" :key="key" class="giopic-icon-btn w-3 h-3 mx-[1px]"
                            :style="{ backgroundColor: color.primary }" @click="themeStore.setThemeColor(key)">
                            <div v-if="themeStore.currentColor === key"
                                class="i-carbon-checkmark text-white text-lg font-bold" />
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-row items-center gap-2">
                 
                    <button class="giopic-icon-btn text-gray-400 hover:text-primary text-xl" :title="t('home.refresh')"
                        @click.stop="handleRefresh">
                        <div class="i-carbon-update-now" />
                    </button>
                    <button class="giopic-icon-btn text-gray-400 hover:text-primary text-xl" :title="t('home.shareAll')"
                        @click.stop="handleShareAll">
                        <div class="i-carbon-share" />
                    </button>
                </div>

            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 custom-scrollbar">
                <div v-for="config in configStore.configs" :key="config.id"
                    class="group relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 select-none "
                    :class="props.selectedIds.includes(config.id) ? (themeStore.isDark ? ' bg-gray-700' : 'bg-primary-50') : ' dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    @click="toggleConfigSelection(config.id)">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-gray-800 dark:text-gray-100 truncate pr-4">{{ config.name }}</div>
                        <div v-if="props.selectedIds.includes(config.id)" class="text-primary">
                            <div class="i-carbon-checkmark-filled text-lg" />
                        </div>
                        <div v-else
                            class="text-gray-200 dark:text-gray-600 group-hover:text-gray-300 dark:group-hover:text-gray-500">
                            <div class="i-carbon-radio-button text-lg" />
                        </div>
                    </div>
                    <div class="flex justify-between items-end">
                        <div class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{{ config.type }}
                        </div>
                        <div class="flex gap-3">
                            <div class="text-xs text-gray-400 dark:text-gray-500 hover:text-primary cursor-pointer"
                                @click.stop="handleShare(config)">
                                {{ t('home.share') }}
                            </div>
                            <div class="text-xs text-gray-400 dark:text-gray-500 hover:text-primary cursor-pointer"
                                @click.stop="emit('edit', config)">
                                {{ t('common.edit') }}
                            </div>
                            <div class="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 cursor-pointer"
                                @click.stop="handleDelete(config)">
                                {{ t('common.delete') }}
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="configStore.configs.length === 0"
                    class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl">
                    {{ t('home.noNodes') }}
                </div>
            </div>

            <div class="mt-4 flex gap-3 flex-shrink-0">
                <button @click="handleImport"
                    class="rounded-lg flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:border-primary hover:text-primary   flex items-center justify-center gap-2">
                    <div class="i-carbon-document-import w-4 h-4" />
                    {{ t('home.import') }}
                </button>
                <button @click="emit('add')"
                    class=" rounded-lg flex-[2] py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:border-primary hover:text-primary   flex items-center justify-center gap-2">
                    <div class="i-carbon-add-filled w-4 h-4" />
                    {{ t('home.addNode') }}
                </button>
            </div>
        </div>

        <n-modal v-model:show="showImportModal">
            <n-card style="width: 600px; max-width: 90vw;" :title="t('home.importTitle')" :bordered="false" size="huge"
                role="dialog" aria-modal="true">
                <n-input v-model:value="importJson" type="textarea" :placeholder="t('home.importPlaceholder')"
                    :rows="10" />
                <template #footer>
                    <div class="flex justify-end gap-2">
                        <n-button @click="showImportModal = false">{{ t('common.cancel') }}</n-button>
                        <n-button type="primary" @click="confirmImport">{{ t('common.confirm') }}</n-button>
                    </div>
                </template>
            </n-card>
        </n-modal>
    </div>

</template>

<style scoped>
/* Mobile styles (< 720px) */
@media (max-width: 768px) {
    .config-list-container {
        position: fixed;
        left: 1.2rem;
        right: 1.2rem;
        z-index: 50;
        /* Default collapsed state styles */
        bottom: 4px;
        height: auto;
        max-height: 16px;
        /* Only show header */
        overflow: hidden;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);

    }

    .config-list-container.mobile-expanded {
        bottom: 2px;
        height: 70vh;
        /* Takes up 70% of screen height */
        max-height: none;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

    }

    .config-list-container.mobile-collapsed .content-section {
        opacity: 0;
        pointer-events: none;
    }

    .config-list-container.mobile-expanded .content-section {
        opacity: 1;
        pointer-events: auto;
    }
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 4px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
}

/* Dark mode scrollbar */
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #374151;
}

:global(.dark) .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: #4b5563;
}

.text-primary {
    color: v-bind(primaryColor);
}

.bg-primary-50 {
    background-color: v-bind(primaryColorSuppl);
}

.border-primary {
    border-color: v-bind(primaryColor);
}

.hover\:bg-primary-50:hover {
    background-color: v-bind(primaryColorSuppl);
}

.hover\:text-primary:hover {
    color: v-bind(primaryColorHover);
}

.hover\:border-primary:hover {
    border-color: v-bind(primaryColor);
}
</style>
