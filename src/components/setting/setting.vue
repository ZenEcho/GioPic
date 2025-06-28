<template>

    <n-drawer v-model:show="SettingSwitchStatus" :width="400" @after-leave="setSettingSwitchStatus(false)">
        <n-drawer-content title="设置" closable>
            <div class="p-4">
                <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">明暗模式</span>
                    <n-switch title="明暗模式" @update:value="setDarkMode(!DarkMode)" />
                </div>
                <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">打开方式</span>
                    <div class="flex flex-row items-center">
                        <n-select title="打开方式" class="w-[180px]" v-model:value="uploadFunctionSettings.openInTab"
                            :options="openInTabOptions" @update:value="handleUpdate('openInTab', $event)" />
                        <div class="i-ph-arrows-clockwise w-6 h-6 ml-2" title="重载扩展" @click="chromeRuntimeReload">
                        </div>
                    </div>
                </div>
                <!-- <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">自动复制<span class="text-[12px] text-red-600">[仅右键,拖拽上传生效]</span></span>
                    <n-switch title="自动复制" v-model:value="uploadFunctionSettings.autoCopy"
                        @update:value="handleUpdate('autoCopy', $event)" />
                </div> -->
                <!-- <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">拖拽上传<span class="text-[12px] text-red-600">[绑定侧边栏]</span></span>
                    <n-switch title="拖拽上传" v-model:value="uploadFunctionSettings.dragUpload"
                        @update:value="handleUpdate('dragUpload', $event)" />
                </div> -->
                <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">右键上传</span>
                    <n-switch title="右键上传" v-model:value="uploadFunctionSettings.rightClickUpload"
                        @update:value="handleUpdate('rightClickUpload', $event)" />
                </div>
                <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">侧边栏</span>
                    <n-button title="设置侧边栏" @click="openSetSidebar()">设置侧边栏</n-button>
                </div>
                <!-- <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">图片代理<span class="text-[12px] text-red-600">[不生效]</span></span>
                    <n-select class="w-[180px]" v-model:value="uploadFunctionSettings.imageProxy"
                        :options="imageProxyOptions" @update:value="handleUpdate('imageProxy', $event)" />
                </div> -->
                <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">自动插入</span>
                    <n-button title="自动插入" @click="openSetAutoInsert()">设置自动插入</n-button>
                </div>
                <!-- <div class="flex flex-row justify-between items-center py-2">
                    <span class="text-base">编辑框粘贴</span>
                    <n-switch title="编辑器粘贴" v-model:value="uploadFunctionSettings.editBoxPaste"
                        @update:value="handleUpdate('editBoxPaste', $event)" />
                </div> -->
            </div>

        </n-drawer-content>
    </n-drawer>
    <setSidebar v-model:show="showSetSidebar" @save="handleSave" />
    <setAutoInsert v-if="isDataLoaded" v-model:show="showSetAutoInsert" @saveUpdate="handleUpdate"
        :uploadFunctionSettings="uploadFunctionSettings" />
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppSettings } from '@/stores/appSettings'
import { useLocalStorage } from '@/stores/useLocalStorage'
import type { UploadFunctionSettingsType } from '@/type/index'

// 定义 uploadFunctionSettings 的类型
const uploadFunctionSettings = ref<UploadFunctionSettingsType>({
    dragUpload: true,
    autoInsert: true,
    autoCopy: false,
    rightClickUpload: true,
    imageProxy: 'false',
    editBoxPaste: false,
    openInTab: 1,
    i18n: 'zh-CN' // 默认语言
})
const showSetSidebar = ref(false) // 控制子组件显示
const showSetAutoInsert = ref(false) // 控制子组件显示
const isDataLoaded = ref(false)


const {
    DarkMode,
    SettingSwitchStatus
} = storeToRefs(useAppSettings())
const {
    setDarkMode,
    setSettingSwitchStatus } = useAppSettings()
const openInTabOptions = [
    { label: '标签', value: 1 },
    { label: '窗口', value: 2 },
    { label: '内置', value: 3 }
]

const imageProxyOptions = [
    { label: '关闭', value: 'false', },
    { label: 'WordPress', value: 'wordpress', },
    { label: 'Weserv.nl', value: 'weserv', }
]


const handleUpdate = <K extends keyof UploadFunctionSettingsType>(item: K, value: UploadFunctionSettingsType[K]): void => {
    // 根据传来的 [item]: value 覆盖 uploadFunctionSettings.value 里的数据
    uploadFunctionSettings.value[item] = value
    useLocalStorage.set('uploadFunctionSettings', uploadFunctionSettings.value)
}
const openSetSidebar = (): void => {
    showSetSidebar.value = true;
}
const openSetAutoInsert = (): void => {
    showSetAutoInsert.value = true;
}
const handleSave = (): void => {
    showSetSidebar.value = false;
}
const chromeRuntimeReload = (): void => {
    chrome.runtime.reload()
}
// 元素加载完毕
onMounted(() => {
    useLocalStorage.get("uploadFunctionSettings").then(res => {
        if (!res) {
            res = {
                dragUpload: true,
                autoInsert: true,
                autoCopy: false,
                rightClickUpload: true,
                imageProxy: false,
                editBoxPaste: false,
                openInTab: 1,
            },
                useLocalStorage.set("uploadFunctionSettings", res);

        }
        uploadFunctionSettings.value = res
        isDataLoaded.value = true; // 数据加载完成
    })
})
</script>