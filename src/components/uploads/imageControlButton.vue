<template>
    <div class=" sticky  bottom-4 flex flex-row items-center w-fit">
        <n-badge :value="selectedImages.length" class="mx-2">
            <n-button type="primary" @click="handleSelectedAll">
                <template #icon>
                    <div class="i-ph-check-square"></div>
                </template>
                全选
            </n-button>
        </n-badge>
        <n-button type="info" @click="handleUnSelectedAll" class="mx-2">
            <template #icon>
                <div class="i-ph-square"></div>
            </template>
            取消
        </n-button>
        <n-button type="warning" @click="handleSelectedCopy(copyMode)" class="mx-2">
            <template #icon>
                <div class="i-ph-copy"></div>
            </template>
            <n-dropdown trigger="hover" :options="urlType" @select="handleSelectedCopy(copyMode)"
                v-model:value="copyMode">
                复制选中
            </n-dropdown>
        </n-button>
        <n-button type="error" @click="handleSelectedRemove" class="mx-2">
            <template #icon>
                <div class="i-ph-trash"></div>
            </template>
            删除选中
        </n-button>
    </div>
    <div class="  bottom-4 right-4 w-10  absolute">
        <n-button quaternary circle @click="scrollToTop">
            <template #icon>
                <div class="i-ph-arrow-line-up"></div>
            </template>
        </n-button>
        <n-button quaternary circle @click="scrollToBottom">
            <template #icon>
                <div class="i-ph-arrow-line-down"></div>
            </template>
        </n-button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMessage } from 'naive-ui'
import { useUploadRecordsStore } from '@/stores/uploadRecords'
import { useLocalStorage } from '@/stores/useLocalStorage';
import { isSelected, copyOperation, handleDelete } from '@/composables/uploadRecords/common';
import type { UploadLogType } from '@/type';
import { urlType } from '@/utils/main';

const {
    setSelectedImages //更新选中图片
} = useUploadRecordsStore();
const {
    loading, //加载状态
    imagesData,  //图片数据
    selectedImages,  //选中图片 
} = storeToRefs(useUploadRecordsStore()) //  保持响应式
const message = useMessage();
const copyMode = ref("URL") //  默认复制格式
onMounted(() => {
    useLocalStorage.get("").then((data) => {
        copyMode.value = data.copyMode
    })
})



// 全选
function handleSelectedAll(): void {
    const allSelected = imagesData.value.every(item => isSelected(item.key));
    if (allSelected) {
        setSelectedImages(selectedImages.value.filter(item => !imagesData.value.some(data => data.key === item.key)));
    } else {
        const newSelections = imagesData.value.filter(item => !isSelected(item.key));
        setSelectedImages([...selectedImages.value, ...newSelections]);
    }
}
// 取消选中
function handleUnSelectedAll(): void {
    setSelectedImages([]);
}

// 选中复制
function handleSelectedCopy(mode: string) {
    let images: UploadLogType[] = selectedImages.value;
    if (images.length < 1) return;
    copyOperation(images, mode).then((result) => {
        message[result.type as 'success' | 'error' | 'warning' | 'info'](result.message)
    })
    useLocalStorage.set("copyMode", mode).then(() => {
        copyMode.value = mode;
    })
}
// 删除选中
function handleSelectedRemove() {
    if (selectedImages.value.length < 1) return;
    if (loading.value.imagesBox) return;

    const keys: { key: string, filename: string }[] = selectedImages.value.map(data => ({
        key: data.key,
        filename: data.original_file_name
    }));
    handleDelete(keys).then(() => {
        message.success('删除成功');
    }).catch((error) => {
        message.error('删除操作失败');
    });;
}


const scrollToBottom = () => {
    const el = document.getElementById('image-scroll-container')
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
    }
}
const scrollToTop = () => {
    const el = document.getElementById('image-scroll-container')
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    }
}


</script>