<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { DriveConfig } from '@/types'

import ConsoleSidebar from '@/components/sidebar/ConsoleSidebar.vue'
import UploadZone from '@/components/upload/UploadZone.vue'
import HistoryList from '@/components/history/HistoryList.vue'
import HistoryView from '@/views/HistoryView.vue'
import { useUploadInput } from '@/composables/useUploadInput'

const props = defineProps<{
    fileQueue: any
}>()

const emit = defineEmits<{
    (e: 'filesDropped', files: File[]): void
    (e: 'addConfig'): void
    (e: 'editConfig', config: DriveConfig): void
    (e: 'openSettings'): void
}>()

const configStore = useConfigStore()
const currentView = ref('upload')

const { onFilesDropped } = useUploadInput((files) => {
    emit('filesDropped', files)
})
</script>

<template>
    <div class="h-full flex flex-row overflow-hidden bg-[#F5F7FA] dark:bg-[#101014]">
        <!-- 侧边栏 -->
        <ConsoleSidebar 
            v-model:selectedIds="configStore.selectedIds"
            :currentView="currentView"
            @navigate="(view) => currentView = view"
            @add="emit('addConfig')"
            @edit="(c) => emit('editConfig', c)"
            @openSettings="emit('openSettings')"
        />

        <!-- 内容区 -->
        <div class="flex-1 overflow-hidden relative">
            <!-- 上传视图: 上下分栏 -->
            <div v-if="currentView === 'upload'" class="h-full flex flex-col">
                <!-- 上部分: 上传区域 -->
                <div class="flex-none p-6">
                    <UploadZone 
                        @filesDropped="onFilesDropped" 
                        class="!m-0 !h-[320px] shadow-sm" 
                    />
                </div>
                
                <!-- 下部分: 上传队列 -->
                <!-- 只有当有文件时才显示队列，或者一直显示空状态？用户说"下部分就是上传队列" -->
                <div class="flex-1 min-h-0 px-6 pb-6">
                     <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                         <HistoryList 
                            :uploadQueue="fileQueue.items" 
                            @upload-all="fileQueue.start()"
                            @upload-item="(id: string) => fileQueue.trigger(id)" 
                            @retry-item="(id: string) => fileQueue.retry(id)"
                            @remove-item="(id: string): void => fileQueue.remove(id)" 
                            @clear-all="fileQueue.clear()" 
                            @open-history="currentView = 'history'"
                            class="!m-0 !w-full !max-w-none !h-full !border-none !shadow-none !bg-transparent"
                        />
                     </div>
                </div>
            </div>

            <!-- 历史视图 -->
            <div v-else-if="currentView === 'history'" class="h-full w-full">
                <HistoryView />
            </div>
        </div>
    </div>
</template>