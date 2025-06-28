<template>
    <n-layout has-sider sider-placement="right">
        <n-layout-content content-style="padding: 24px 0px 0px 0px" class="h-screen relative transparent-scrollbar ">
            <n-spin :show="loading.imagesBox" size="large">
                <siteTitle />
                <div class="flex flex-row items-center justify-end px-6">
                    <n-button secondary strong type="primary" @click="loadImages" class="px-4 py-1 mr-1" title="刷新数据">
                        <template #icon>
                            <n-icon size="24">
                                <div class="i-ph-arrows-clockwise"></div>
                            </n-icon>
                        </template>
                        <span>刷新</span>
                    </n-button>

                    <n-button secondary strong type="info" @click="toggleDataMode" class="px-4 py-1 ">
                        <template #icon>
                            <n-icon size="24">
                                <div v-if="loadingMode == 'network'" class="i-ph-cloud">
                                </div>
                                <div v-else class="i-ph-database"></div>
                            </n-icon>
                        </template>
                        <span v-if="loadingMode == 'network'">网络数据</span>
                        <span v-else>本地数据</span>
                    </n-button>
                    <!-- // 刷新按钮 -->

                </div>
                <div class="flex justify-end p-6">
                    <PathPage v-if="loadingMode != 'local'" @path-saved="loadImages"
                        @UploadPath-Refresh="UploadPathRefresh" :UploadPath="UploadPath">
                    </PathPage>
                    <!-- 数据排序，时间最新，时间最后，文件最大，文件最小 -->
                    <n-select class="w-48" v-model:value="selectedSortType" :options="sortOptions" placeholder="选择排序方式"
                        @update:value="sortData" />
                </div>
                <n-flex justify="center" id="image-scroll-container">
                    <ImageCard />
                </n-flex>
                <div v-if="imagesData.length <= 0">
                    <n-result status="403" title="403 禁止访问" description="总有些门是对你关闭的">
                        <template #footer>
                            <n-button><a href="/index.html">去上传试一试？</a></n-button>
                        </template>
                    </n-result>
                </div>
                <footer>
                    <Pagination />
                </footer>
            </n-spin>
            <imageControlButton />
        </n-layout-content>
        <n-layout-sider bordered :collapsed="ConfigCollapsed" collapse-mode="width" :width="220" :collapsed-width="64"
            @update:collapsed="handleConfigCollapsed" show-trigger="bar" content-style="padding: 0;">
            <n-dialog-provider>
                <configRecord />
            </n-dialog-provider>
        </n-layout-sider>
    </n-layout>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia'
import { sortOptions } from '@/constants/uploadRecords';
import { useUploadRecordsStore } from '@/stores/uploadRecords';
import { useAppSettings } from '@/stores/appSettings';
import { useImageLoader } from '@/composables/uploadRecords/useImageLoader';
import { sortData } from '@/composables/uploadRecords/common';
const {
    setLoadingMode,  //更新加载模式
    setPage,  //更新页码
} = useUploadRecordsStore();
const {
    loading, //加载状态
    imagesData,  //图片数据
    loadingMode,  //加载模式
    selectedSortType,  //选中排序类型
} = storeToRefs(useUploadRecordsStore()) //  保持响应式

const { loadImages, } = useImageLoader()

const { setConfigCollapsed } = useAppSettings()
const {
    ConfigCollapsed
} = storeToRefs(useAppSettings())

function handleConfigCollapsed() {
    setConfigCollapsed(!ConfigCollapsed.value)
}

const UploadPath = ref(); //上传路径
const UploadPathRefresh = (newPath: string) => {
    UploadPath.value = newPath
}

// 数据加载模式
function toggleDataMode() {
    let currentMode = localStorage.getItem('loadingMode') || 'local';
    if (currentMode === 'local') {
        currentMode = 'network';
    } else {
        currentMode = 'local';
    }
    setPage(1);
    setLoadingMode(currentMode);
    localStorage.setItem('loadingMode', currentMode);
    loadImages()
}

onMounted(() => {
    loadImages()
})



</script>
