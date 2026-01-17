<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { DriveConfig } from '@/types'

import ClassicHome from '@/views/home/ClassicHome.vue'
import ConsoleHome from '@/views/home/ConsoleHome.vue'
import CenterHome from '@/views/home/CenterHome.vue'
import SimpleHome from '@/views/home/SimpleHome.vue'
import ConfigModal from '@/components/config/ConfigModal.vue'
import SettingsModal from '@/components/settings/SettingsModal.vue'

import { useUploadQueue } from '@/composables/useUploadQueue'

const themeStore = useThemeStore()

// --- 状态定义 ---
const showAddModal = ref(false)
const showSettingsModal = ref(false)
const isEdit = ref(false)
const currentConfig = ref<DriveConfig | null>(null)

// --- 组合式函数 ---
const { fileQueue, addFileToQueue } = useUploadQueue()

// --- Event Handlers ---
function handleFilesDropped(files: File[]) {
    files.forEach(f => addFileToQueue(f))
}

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
    <div class="h-full w-full overflow-hidden transition-colors duration-300 bg-[#F5F7FA] dark:bg-[#101014]">
        
        <ClassicHome 
            v-if="themeStore.uiMode === 'classic'"
            :fileQueue="fileQueue"
            @filesDropped="handleFilesDropped"
            @addConfig="handleAddConfig"
            @editConfig="handleEditConfig"
            @openSettings="showSettingsModal = true"
        />

        <ConsoleHome 
            v-else-if="themeStore.uiMode === 'console'"
            :fileQueue="fileQueue"
            @filesDropped="handleFilesDropped"
            @addConfig="handleAddConfig"
            @editConfig="handleEditConfig"
            @openSettings="showSettingsModal = true"
        />

        <CenterHome 
            v-else-if="themeStore.uiMode === 'center'"
            :fileQueue="fileQueue"
            @filesDropped="handleFilesDropped"
            @addConfig="handleAddConfig"
            @editConfig="handleEditConfig"
            @openSettings="showSettingsModal = true"
        />

        <SimpleHome 
            v-else-if="themeStore.uiMode === 'simple'"
            :fileQueue="fileQueue"
            @filesDropped="handleFilesDropped"
            @addConfig="handleAddConfig"
            @editConfig="handleEditConfig"
            @openSettings="showSettingsModal = true"
        />

        <!-- 弹窗 -->
        <ConfigModal v-model:show="showAddModal" :config="currentConfig" :isEdit="isEdit" @saved="() => { }" />

        <SettingsModal v-model:show="showSettingsModal" />
    </div>
</template>