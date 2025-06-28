<template>
    <div class="w-full flex items-center">
        <div class="i-ph-folder min-w-[32px] min-h-8 mx-2"></div>
        <div v-if="!isEditing" class="w-full px-2 flex flex-wrap h-8 items-center" @click="editPath">
            <!-- 前段路径选择菜单 -->
            <div v-if="pathSegments.Segments && pathSegments.Segments.length > 5">
                <n-dropdown trigger="hover" :options="pathSegments.frontSegments" @select="handleSelect"
                    class="rounded-md">
                    <div class="i-ph-caret-circle-right w-6 h-6"></div>
                </n-dropdown>
            </div>
            <div class="flex items-center">
                <n-button size="small" quaternary @click="jumpPath(null, '/')" class="px-2">
                    <div class="max-w[96px] overflow-hidden whitespace-nowrap text-ellipsis">/</div>
                </n-button>
                <span class=" i-ph-caret-right w-6 h-6"> </span>
            </div>
            <!-- 最后 5 个路径段 -->
            <div class="flex">
                <div v-for="(segment, index) in pathSegments.lastSegments" :key="segment.key" class="flex items-center">
                    <n-button size="small" quaternary @click="jumpPath(segment.key, null)" class="px-2">
                        <div class="max-w[96px] overflow-hidden whitespace-nowrap text-ellipsis"> {{ segment.label }}
                        </div>
                    </n-button>
                    <span v-if="index < pathSegments.lastSegments.length - 1" class="i-ph-caret-right w-6 h-6"> </span>
                </div>
            </div>
        </div>
        <div class=" w-full pl-2 h-8 leading-8" v-if="isEditing">
            <n-input ref='inputRef' v-model:value="editablePath" type="text" placeholder="路径地址" @blur="savePath"
                @keyup.enter="savePath" />
        </div>
        <div class="pl-1 pr-2">
            <n-button quaternary round type="info" title="获取上传地址" @click="getNewPath">
                <div class="i-ph-download h-6 w-6"></div>
            </n-button>
        </div>
    </div>
</template>
<script setup lang="ts">
import type { VNode } from 'vue';
import { ref, useTemplateRef, onMounted, computed, nextTick } from 'vue';
import { custom_Replace } from '@/utils/uploadConfig';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useMessage } from 'naive-ui';
import { watch } from 'vue';

// 定义一个ref来存储路径
const uploadPath = ref('');
const message = useMessage();
const ProgramConfiguration = ref();
const StorageData = ref();

// 定义编辑模式的状态
const isEditing = ref(false);
const editablePath = ref('');
const inputRef = useTemplateRef<HTMLInputElement>('inputRef');
const emit = defineEmits(['path-saved', 'UploadPath-Refresh']);
// 在组件挂载时获取路径信息
onMounted(async () => {
    StorageData.value = await useLocalStorage.get(``)
    ProgramConfiguration.value = StorageData.value.ProgramConfiguration
    if (!StorageData.value.accessPath && StorageData.value.accessPath != "") {
        // let path = await custom_Replace(ProgramConfiguration.value.UploadPath, 'UploadPath', ProgramConfiguration.value);
        // useLocalStorage.set("accessPath", path).then(() => {
        //     emit('path-saved');
        // })
    }
    StorageData.value.accessPath = StorageData.value.accessPath
    uploadPath.value = StorageData.value.accessPath;
    editablePath.value = StorageData.value.accessPath;
});

// 计算属性来分割路径字符串并过滤掉空的部分
type PathSegments = {
    label: string;
    key: number;
};
const pathSegments = computed(() => {
    // 添加安全检查，确保 uploadPath.value 存在且为字符串
    if (!uploadPath.value || typeof uploadPath.value !== 'string') {
        return { Segments: [], frontSegments: [], lastSegments: [] };
    }

    const segments = uploadPath.value.split('/').filter(segment => segment);
    let value: {
        Segments: PathSegments[],
        frontSegments: PathSegments[],
        lastSegments: PathSegments[]
    } = {
        Segments: [],
        frontSegments: [],
        lastSegments: []
    };
    let segmentsValue: PathSegments[] = [];
    segments.forEach((segment, index) => {
        segmentsValue.push({
            label: segment,
            key: index,
        });
    });

    value.Segments = segmentsValue;
    value.frontSegments = value.Segments.slice(0, -5);
    value.lastSegments = value.Segments.slice(-5);
    return segments.length ? value : { Segments: [], frontSegments: [], lastSegments: [] };
});

// 编辑路径的方法
const editPath = (event: MouseEvent) => {
    if (event.target !== event.currentTarget) {
        return;
    }
    isEditing.value = true;
    nextTick(() => {
        inputRef.value?.focus(); // 聚焦输入框
    });
};


// 保存路径的方法
const savePath = () => {
    // 如果内容没变就返回
    if (editablePath.value === uploadPath.value) {
        isEditing.value = false;
        return;
    }
    if (ProgramConfiguration.value.Program == 'GitHub') {
        if (editablePath.value === "/") {
            editablePath.value = "/";
        } else if (!editablePath.value || editablePath.value.trim() === "") {
            editablePath.value = "/";
        } else {
            editablePath.value = `/${editablePath.value.replace(/^\/|\/$/g, "")}/`;
        }
    }
    uploadPath.value = editablePath.value;

    useLocalStorage.set("accessPath", editablePath.value).then(() => {
        emit('path-saved');
    }).finally(() => {
        isEditing.value = false;
    });
};
//点击跳转路径
const jumpPath = (key: number | null, url: string | null) => {

    let newPath: string;
    if (key === null) {
        newPath = ProgramConfiguration.value.Program == 'GitHub' ? url as string : '';
    } else {
        newPath = pathSegments.value.Segments.slice(0, key + 1)
            .map(segment => segment.label)
            .join('/');
    }

    if (ProgramConfiguration.value.Program == 'GitHub') {
        if (newPath === "/") {
            newPath = "/";
        } else if (!newPath || newPath.trim() === "") {
            newPath = "/";
        } else {
            newPath = `/${newPath.replace(/^\/|\/$/g, "")}/`;
        }
    }
    uploadPath.value = newPath;
    editablePath.value = newPath;
    useLocalStorage.set("accessPath", newPath).then(() => {
        emit('path-saved');
    }).finally(() => {
        isEditing.value = false;
    });
};
const handleSelect = (item: number) => {
    jumpPath(item, null);
}
const props = defineProps({
    UploadPath: {
        required: true
    }
});

// 获取最新地址
const getNewPath = async () => {
    // let path = await custom_Replace(ProgramConfiguration.value.UploadPath, 'UploadPath', ProgramConfiguration.value);
    // useLocalStorage.set("accessPath", path).then(() => {
    //     //   刷新当前页面
    //     window.location.reload();

    // })
}
watch(
    () => props.UploadPath,
    (newPath, oldPath) => {
        jumpPath(null, newPath as string);
    }
);
</script>

<style scoped>
li {
    list-style: none;
}

input {
    width: 100%;
}
</style>