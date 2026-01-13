<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import browser from 'webextension-polyfill'
import { useThemeStore } from '@/stores/theme'
import type { UploadRecord } from '@/types'
import { formatLink, copyToClipboard } from '@/utils/common'

const props = defineProps<{
    displayList: UploadRecord[]
    isBatchMode: boolean
    selectedIds: Set<string>
    copyFormat: string
    hasMore: boolean
}>()

const emit = defineEmits<{
    (e: 'toggleSelection', id: string): void
    (e: 'deleteRecord', id: string): void
    (e: 'loadMore'): void
}>()

const { t } = useI18n()
const message = useMessage()
const themeStore = useThemeStore()

const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')
const primaryColorSuppl = computed(() => themeStore.themeOverrides?.common?.primaryColorSuppl || '#ecf5ff')
const primaryColorHover = computed(() => themeStore.themeOverrides?.common?.primaryColorHover || '#66b1ff')

// Special handling for i.111666.best images
const imageBlobs = ref<Record<string, string>>({})

const fetchImageBlob = async (url: string) => {
    try {
        const response = await browser.runtime.sendMessage({
            type: 'FETCH_IMAGE_BLOB',
            url
        })
        if (response) {
            return response // response is dataUrl
        }
        throw new Error('No response')
    } catch (e) {
        console.error('Fetch image failed', e)
        throw e
    }
}

watch(() => props.displayList, (list) => {
    list.forEach(async (record) => {
        if (record.url && record.url.includes('i.111666.best') && !imageBlobs.value[record.id]) {
            try {
                const dataUrl = await fetchImageBlob(record.url)
                if (dataUrl) {
                    if (typeof dataUrl === 'string') {
                        imageBlobs.value[record.id] = dataUrl
                    }
                }
            } catch (e) {
                console.error('Failed to load blob for', record.url, e)
            }
        }
    })
}, { immediate: true, deep: true })

onUnmounted(() => {
    // No need to revoke for dataURL, but if we used createObjectURL on frontend from base64 (to save memory), we would.
    // Since we receive dataURL directly, we just let it be.
    // If memory is concern, we can nullify it.
})


// Infinite scroll logic
const loadTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
    if (observer) observer.disconnect()

    observer = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting && props.hasMore) {
            emit('loadMore')
        }
    }, {
        rootMargin: '100px',
        threshold: 0.1
    })

    if (loadTrigger.value) {
        observer.observe(loadTrigger.value)
    }
}

onMounted(() => {
    setupObserver()
})

onUnmounted(() => {
    if (observer) observer.disconnect()
})

watch(() => loadTrigger.value, () => {
    setupObserver()
})

async function handleCopy(text: string) {
    try {
        await copyToClipboard(text)
        message.success(t('common.copied'))
    } catch {
        message.error(t('common.copyFailed'))
    }
}

async function handleInject(url: string) {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true })
        if (tabs && tabs.length > 0 && tabs[0]?.id) {
            await browser.tabs.sendMessage(tabs[0].id, {
                type: 'MANUAL_INJECT',
                payload: { url }
            })
            message.success(t('common.success') || 'OK')
        }
    } catch (e) {
        console.error('Injection failed', e)
        // message.error(t('common.failed'))
    }
}
</script>

<template>
    <div class="flex-1 bg-white dark:bg-gray-800 rounded-[24px] p-6 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <!-- List -->
        <div v-if="displayList.length > 0" class="overflow-y-auto custom-scrollbar flex-1">
            <n-image-group>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
                    <div v-for="record in displayList" :key="record.id"
                        class="group relative bg-white dark:bg-gray-800 transition-all rounded-xl p-3 flex flex-col"
                        :class="isBatchMode && selectedIds.has(record.id) ? 'card-selected shadow-md' : 'border border-gray-100 dark:border-gray-700 hover:border-primary-200 hover:shadow-md'"
                        @click="isBatchMode ? emit('toggleSelection', record.id) : null">
                        
                        <div class="aspect-video bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600 mb-3 relative group-hover:shadow-sm transition-shadow">
                            <!-- Selection Checkbox -->
                            <div v-if="isBatchMode"
                                class="absolute top-1/2 left-1/2 z-10 transition-all transform -translate-x-1/2 -translate-y-1/2"
                                @click.stop>
                                <n-checkbox size="large" :checked="selectedIds.has(record.id)"
                                    @update:checked="emit('toggleSelection', record.id)"
                                    class="bg-transparent shadow-lg p-1 border border-gray-100 dark:border-gray-600 scale-150" />
                            </div>

                            <n-image :src="imageBlobs[record.id] || record.thumbUrl || record.url" :preview-src="imageBlobs[record.id] || record.url"
                                :preview-disabled="isBatchMode" lazy object-fit="cover"
                                class="w-full h-full flex items-center justify-center"
                                :img-props="{ class: 'w-full h-full object-cover' }">
                                <template #placeholder>
                                    <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-300">
                                        <div class="i-carbon-image text-2xl" />
                                    </div>
                                </template>
                            </n-image>
                            
                            <!-- Delete button -->
                            <button
                                class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 flex items-center justify-center transition-all shadow-md transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 z-10"
                                @click.stop="emit('deleteRecord', record.id)">
                                <div class="i-carbon-trash-can text-sm" />
                            </button>
                        </div>

                        <div class="flex-1 flex flex-col justify-between">
                            <div class="mb-3">
                                <div class="font-bold text-sm text-gray-800 dark:text-gray-200 truncate mb-1"
                                    :title="record.filename">{{ record.filename }}</div>
                                <div class="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
                                    <div class="flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full"
                                            :class="record.status === 'success' ? 'bg-green-500' : 'bg-red-500'"></span>
                                        {{ record.configName }}
                                    </div>
                                    <span class="font-mono opacity-70">{{ new Date(record.createdAt).toLocaleString() }}</span>
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <button
                                    class="px-3 bg-gray-100 dark:bg-primary-900/20 text-primary hover:bg-primary hover:text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                    :title="t('common.inject')"
                                    @click.stop="handleInject(record.url)">
                                    <div class="i-carbon-magic-wand" />
                                </button>
                                <button
                                    class="flex-1 bg-gray-100 dark:bg-primary-900/20 text-primary hover:bg-primary hover:text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                    @click.stop="handleCopy(formatLink(record.url, copyFormat))">
                                    <div class="i-carbon-copy" /> {{ t('common.copy') }}
                                </button>
                                <a :href="record.url" target="_blank"
                                    class="px-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
                                    <div class="i-carbon-launch" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </n-image-group>

            <!-- Load more trigger -->
            <div v-if="hasMore" ref="loadTrigger" class="py-4 flex justify-center">
                <n-spin size="small" />
            </div>
            <div v-else-if="displayList.length > 0" class="py-4 text-center text-xs text-gray-400">
                {{ t('home.history.noMore') }}
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
            <div class="i-carbon-image-search text-6xl mb-4 opacity-50" />
            <div class="text-sm font-medium">{{ t('home.history.empty') }}</div>
        </div>
        
        <!-- Slot for footer/actions -->
        <slot name="footer"></slot>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 6px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #374151;
}

:global(.dark) .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: #4b5563;
}

.text-primary {
    color: v-bind(primaryColor);
}

.bg-primary {
    background-color: v-bind(primaryColor);
}

.bg-primary-50 {
    background-color: v-bind(primaryColorSuppl);
}

.hover\:bg-primary:hover {
    background-color: v-bind(primaryColorHover);
}

.border-primary {
    border-color: v-bind(primaryColor);
}

.hover\:border-primary:hover {
    border-color: v-bind(primaryColorHover);
}

.ring-primary {
    --tw-ring-color: v-bind(primaryColor);
}

.hover\:border-primary-200:hover {
    border-color: v-bind(primaryColorSuppl);
}

.card-selected {
    border: 1px solid v-bind(primaryColor);
}
</style>
