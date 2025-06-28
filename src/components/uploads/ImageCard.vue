<template>
    <n-image-group>
        <n-card v-for="(item, index) in imagesData" :key="item.key" :class="{ active: isSelected(item.key) }"
            class="w-[25%] min-w-[256px] max-w-[320px] relative" content-style="padding: 14px;"
            header-style="padding:14px 18px; text-align: center;" @click="handleImageCardClick($event, item)"
            @close="handleRemove(item, index)" closable hoverable>
            <template #header>
                <n-ellipsis line-clamp="1">
                    {{ item.original_file_name }}
                </n-ellipsis>
            </template>
            <n-popover trigger="hover">
                <template #trigger>
                    <div class="flex justify-center items-center h-full w-full">
                        <CustomImage v-if="item.type === 'image'" :item="item" />
                        <div v-else-if="item.type == 'editable'" class="w-full h-full">
                            <n-progress type="circle" :percentage="item.progress || 0"
                                class="absolute top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 z-10"
                                v-show="Number(item.progress) >= 1 && Number(item.progress) < 100" />
                            <n-input type="textarea" placeholder="点击加载内容！" class="min-h-[200px]"
                                @click="handleEditingContent($event, item)" v-model:value="item.NetResponseText" />

                        </div>
                        <div v-else-if="item.type == 'video'" class="w-full h-[200px]">
                            <video controls class="w-full h-full">
                                <source :src="item.url">
                            </video>
                        </div>
                        <div v-else>
                            <div v-if="(item.type ?? 'null') in imageMap">
                                <n-image :src="getImageSrc(imageMap[item.type ?? 'null'])"
                                    class="h-[200px] flex justify-center" preview-disabled
                                    @click="item.type === 'dir' ? handlePathClick($event, item) : null" />
                            </div>
                            <div v-else>
                                <n-image :src="getImageSrc('images/fileicon/unknown.png')"
                                    class="h-[200px] flex justify-center" preview-disabled />
                            </div>
                        </div>
                    </div>
                </template>
                <template #default>
                    <p>文件名称：{{ item.original_file_name }}</p>
                    <p>文件大小：{{ getFormatFileSize(item.file_size) }}</p>
                    <p>上传程序：{{ item.uploadExe }}</p>
                    <p>上传域名：{{ item.upload_domain_name }}</p>
                    <p>上传时间：{{ item.uploadTime }}</p>
                </template>
            </n-popover>
            <template #footer>
                <div class="flex justify-center items-center">
                    <n-button tertiary type="info" class="mx-1" @click="textInsert(item)">
                        插入
                    </n-button>
                    <n-dropdown v-model:value="copyMode" ref="dropdown" trigger="hover" :options="urlType"
                        @select="handleCopy($event, item)">
                        <n-button class="mx-1" tertiary type="primary" @click="handleCopy(copyMode, item)">
                            复制
                        </n-button>

                    </n-dropdown>
                </div>
            </template>
        </n-card>
    </n-image-group>
</template>
<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { useUploadRecordsStore } from '@/stores/uploadRecords';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { imageMap } from '@/constants/uploadRecords';
import { isSelected, copyOperation, handleDelete } from '@/composables/uploadRecords/common';
import { getFormatFileSize, urlType } from '@/utils/main';
import { storeToRefs } from 'pinia'
import { ref, onMounted } from 'vue'
import type { UploadLogType } from '@/type';

const message = useMessage();

// 图片类型资源
const getImageSrc = (imageName: string) => {
    return `/assets/` + imageName;
}

const {
    imagesData,  //图片数据
    selectedImages,  //选中图片
} = storeToRefs(useUploadRecordsStore()) //  保持响应式

const UploadPath = ref(); //上传路径
const copyMode = ref("URL") //  默认复制格式


async function handlePathClick(event: Event, i: UploadLogType) {
    useLocalStorage.get("accessPath").then((accessPath) => {
        accessPath += i.original_file_name + "/"
        UploadPath.value = accessPath
    })

}
//加载可编辑内容
const handleEditingContent = (e: Event, item: UploadLogType) => {
    if (item.progress != null) {
        return;
    };
    // 如果item.file_size大于5MB片大小，则不加载!
    if (Number(item.file_size) > 1024 * 1024 * 5) {
        item.NetResponseText = "加载大于5MB的文本将会影响浏览器性能,请下载查看！";
        return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open('GET', item.url, true);
    xhr.responseType = 'text';

    xhr.onprogress = function (event) {
        if (event.lengthComputable) {
            item.progress = Math.floor((event.loaded / event.total) * 100);
        } else {
            item.progress = event.loaded;
        }
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            item.NetResponseText = xhr.response;
            item.NetResponseStatus = 200;
        } else {
            item.NetResponseStatus = 404;
            item.NetResponseText = "加载失败:" + xhr.status;
        }
    };
    xhr.onerror = function () {
        item.NetResponseStatus = 502;
        item.NetResponseText = "网络错误或请求被阻止:";
    };

    xhr.send();
}

// 点击卡片选中
function handleImageCardClick(event: Event, item: UploadLogType) {
    // 如果点击到['img', 'button', 'svg', 'video', '[type="editable"]']就不选中
    const selectors = ['img', 'button', 'svg', 'video', '[type="editable"]', "textarea"];
    // 使用 event.target.matches 来检查是否匹配选择器
    if (selectors.some(selector => (event.target as Element).matches(selector))) return;
    const index = selectedImages.value.findIndex(selectedItem => selectedItem.key === item.key);
    if (index > -1) {
        selectedImages.value.splice(index, 1);
    } else {
        selectedImages.value.push(item);
    }
}
// 点击复制
function handleCopy(mode: string, item: UploadLogType) {
    copyOperation([item], mode).then((result) => {
        message[result.type as 'success' | 'error' | 'warning' | 'info'](result.message)
    }).catch((error) => {
        message.error('复制操作失败');
    });
    useLocalStorage.set("copyMode", mode).then(() => {
        copyMode.value = mode;
    })
}

// 删除
function handleRemove(item: UploadLogType, index: number) {
    const key = [{ key: item.key, filename: item.original_file_name }];
    handleDelete(key).then(() => {
        message.success('删除成功');
    }).catch((error) => {
        message.error('删除操作失败');
    });;
}
function textInsert(item: UploadLogType) {
    // window.postMessage({
    //     type: 'giopic_textInsert_1',
    //     data: item
    // }, '*');
    chrome.runtime.sendMessage({
        AutoInsert: item.url,
    });
}
onMounted(() => {
    useLocalStorage.get("").then((data) => {
        copyMode.value = data.copyMode
    })
})
</script>
<style scoped>
.active {
    position: relative;
}

.active::after {
    content: '\2713';
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 5rem;
    line-height: 100px;
    text-align: center;
    font-weight: 700;
    color: #18a058;
    transform: translate(-50%, -50%);
    background: azure;
    width: 100px;
    height: 100px;
    border-radius: 50%;
}
</style>