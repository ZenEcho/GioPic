<script setup lang="ts">
import { ref } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { DriveConfig } from '@/types'

import ConfigList from '@/components/home/ConfigList.vue'
import UploadZone from '@/components/home/UploadZone.vue'
import HistoryList from '@/components/home/HistoryList.vue'
import ConfigModal from '@/components/config/ConfigModal.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'

import { useUploadQueue } from '@/composables/useUploadQueue'
import { useUploadInput } from '@/composables/useUploadInput'

const configStore = useConfigStore()

// --- 状态定义 ---
const showAddModal = ref(false)
const showSettingsModal = ref(false)
const isEdit = ref(false)
const currentConfig = ref<DriveConfig | null>(null)

// --- 组合式函数 ---
const { fileQueue, addFileToQueue } = useUploadQueue()

const { onFilesDropped } = useUploadInput((files) => {
    files.forEach(f => addFileToQueue(f))
})

// --- 配置管理逻辑 ---
function handleAddConfig() {
    currentConfig.value = null
    isEdit.value = false
    showAddModal.value = true
}

function handleEditConfig(config: DriveConfig) {
    currentConfig.value = config
    isEdit.value = true
    showAddModal.value = true
}
</script>

<template>
    <div
        class="h-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden transition-colors duration-300 bg-[#F5F7FA] dark:bg-[#101014]">
        <!-- 左侧：分发节点 -->
        <ConfigList v-model:selectedIds="configStore.selectedIds" @add="handleAddConfig" @edit="handleEditConfig"
            @openSettings="showSettingsModal = true" />

        <!-- 中间：上传区域 -->
        <UploadZone @filesDropped="onFilesDropped" />

        <!-- 右侧：历史/结果 -->
        <HistoryList :uploadQueue="fileQueue.items" @upload-all="fileQueue.start()"
            @upload-item="(id: string) => fileQueue.trigger(id)" @retry-item="(id: string) => fileQueue.retry(id)"
            @remove-item="(id: string): void => fileQueue.remove(id)" @clear-all="fileQueue.clear()" />

        <!-- 弹窗 -->
        <ConfigModal v-model:show="showAddModal" :config="currentConfig" :isEdit="isEdit" @saved="() => { }" />

        <SettingsModal v-model:show="showSettingsModal" />
    </div>
</template>
