<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { QueueItem } from '@/types'
import { formatLink, copyToClipboard, FORMAT_LABELS, COPY_FORMATS } from '@/utils/common'

const props = defineProps<{
    uploadQueue: QueueItem[]
}>()

const emit = defineEmits<{
    (e: 'upload-all'): void
    (e: 'clear-all'): void
    (e: 'upload-item', id: string): void
    (e: 'retry-item', id: string): void
    (e: 'remove-item', id: string): void
}>()

const { t } = useI18n()
const configStore = useConfigStore()
const themeStore = useThemeStore()
const router = useRouter()

const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')


const message = useMessage()
const copyFormat = ref('url')

const successTasks = computed(() => {
    const results: Array<{
        id: string
        url: string
        thumbUrl?: string
        filename: string
        configName: string
    }> = []
    
    props.uploadQueue.forEach(item => {
        item.tasks.forEach(task => {
            if (task.status === 'success' && task.result) {
                const config = configStore.configs.find(c => c.id === task.configId)
                results.push({
                    id: task.id,
                    url: task.result,
                    // Note: In upload task result, we might not have thumbUrl directly unless we added it to UploadTask interface
                    // But for now we can use the original preview from item if needed, or just use url
                    thumbUrl: item.preview, 
                    filename: item.file.name,
                    configName: config?.name || 'Unknown'
                })
            }
        })
    })
    return results.reverse()
})

function copyLink(url: string, thumbUrl?: string) {
    const textToCopy = formatLink(url, copyFormat.value, thumbUrl)
    copyToClipboard(textToCopy).then(() => {
        message.success(t('common.copied'))
    }).catch(() => {
        message.error(t('common.copyFailed'))
    })
}
</script>

<template>
 <div   class="min-h-[180px] p-6 m-4 md:m-6 flex flex-col bg-white dark:bg-gray-800 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0 transition-colors duration-300 overflow-hidden">
            <div class="flex items-center justify-between mb-4 flex-shrink-0">
                <div class="text-lg font-black italic text-gray-800 dark:text-white">{{ t('home.history.uploadQueue') }}
                </div>
                <div class="flex items-center gap-2">
                    <button v-if="props.uploadQueue.length > 0" @click="emit('upload-all')"
                        class="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white hover:opacity-90 transition-opacity"
                        :title="t('home.upload.uploadAll')">
                        <div class="i-carbon-upload text-sm" />
                    </button>
                    <button v-if="props.uploadQueue.length > 0" @click="emit('clear-all')"
                        class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        :title="t('home.upload.clearAll')">
                        <div class="i-carbon-trash-can text-sm" />
                    </button>
                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button @click="router.push('/history')"
                        class="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center">
                        {{ t('home.history.title') }}
                        <div class="i-carbon-arrow-right" />
                    </button>
                </div>
            </div>

            <div class=" md:w-[288px] flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 custom-scrollbar">
                <!-- 正在上传的队列 -->
                <div v-for="item in props.uploadQueue" :key="item.id"
                    class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700 relative group">
                    <div class="flex gap-3 mb-2">
                        <img :src="item.preview"
                            class="w-12 h-12 rounded-lg object-cover bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600" />
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-sm truncate text-gray-700 dark:text-gray-200">{{ item.file.name
                                }}
                            </div>
                            <div class="flex items-center justify-between mt-1">
                                <div class="text-xs text-gray-400 dark:text-gray-500">
                                    {{ item.status === 'pending' ? t('home.upload.status.pending') :
                                        item.status === 'processing' ? t('home.upload.status.uploading') :
                                            item.status === 'success' ? t('home.upload.status.success') :
                                                item.status === 'error' ? t('home.upload.status.error') : '' }}
                                </div>
                                <div
                                    class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button v-if="item.status === 'pending' || item.status === 'paused'"
                                        @click="emit('upload-item', item.id)"
                                        class="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
                                        :title="t('home.upload.start')">
                                        <div class="i-carbon-play text-xs" />
                                    </button>
                                    <button v-if="item.status === 'error'" @click="emit('retry-item', item.id)"
                                        class="p-1 rounded-md hover:bg-primary/10 text-primary transition-colors"
                                        :title="t('home.upload.retry')">
                                        <div class="i-carbon-renew text-xs" />
                                    </button>
                                    <button @click="emit('remove-item', item.id)"
                                        class="p-1 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                                        :title="t('home.upload.remove')">
                                        <div class="i-carbon-close text-xs" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 进度条们 -->
                    <div class="space-y-1">
                        <div v-for="task in item.tasks" :key="task.id" class="flex items-center gap-2 text-xs">
                            <span class="w-16 truncate text-gray-500 dark:text-gray-400">{{configStore.configs.find(c =>
                                c.id === task.configId)?.name }}</span>
                            <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-300"
                                    :class="task.status === 'error' ? 'bg-red-500' : 'bg-primary'"
                                    :style="{ width: task.progress + '%' }"></div>
                            </div>
                            <span class="w-8 text-right font-mono"
                                :class="task.status === 'success' ? 'text-green-500' : ''">
                                {{ task.status === 'success' ? 'OK' : task.status === 'error' ? 'ERR' : task.progress +
                                '%'
                                }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="props.uploadQueue.length === 0"
                    class="flex items-center justify-center h-20 text-gray-300 dark:text-gray-600 text-sm">
                    {{ t('home.history.empty') }}
                </div>

                <!-- Success Results Section -->
                <div v-if="successTasks.length > 0" class="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div class="mb-3 flex items-center justify-between">
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <div class="i-carbon-checkmark-outline" />
                            {{ t('home.upload.status.success') }}
                        </div>
                        
                        <!-- Format Selector -->
                        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                             <button 
                                v-for="fmt in COPY_FORMATS" 
                                :key="fmt"
                                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all"
                                :class="copyFormat === fmt ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
                                @click="copyFormat = fmt"
                                :title="fmt"
                             >
                                {{ fmt === 'markdown' ? 'MD' : FORMAT_LABELS[fmt] || fmt }}
                             </button>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div v-for="task in successTasks" :key="task.id" 
                             class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors group">
                            <div class="flex flex-col min-w-0 flex-1 mr-3">
                                 <div class="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                                    <span class="truncate max-w-[120px]">{{ task.filename }}</span>
                                    <span class="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span>{{ task.configName }}</span>
                                 </div>
                                 <div class="text-xs text-gray-600 dark:text-gray-300 truncate font-mono select-all">
                                    {{ formatLink(task.url, copyFormat, task.thumbUrl) }}
                                 </div>
                            </div>
                            <button @click="copyLink(task.url, task.thumbUrl)" 
                                    class="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-400 hover:text-primary shadow-sm transition-all"
                                    :title="t('common.copy')">
                                <div class="i-carbon-copy text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

</template>


<style scoped>
@media (max-width: 720px) {}

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

.bg-primary {
    background-color: v-bind(primaryColor);
}

.hover\:text-primary:hover {
    color: v-bind(primaryColor);
}
</style>
