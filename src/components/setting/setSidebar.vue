<template>
    <n-modal class="w-[500px]" preset="card" title="设置侧边栏" :bordered="false">
        <div class="flex flex-row relative">
            <div class="w-[125px]">
                <span v-if="sidebarData.position == 'Left'" class="bg-slate-500 flex absolute"
                    :style="{ width: sidebarData.width + 'px', height: sidebarData.height + '%', opacity: sidebarData.opacity / 100, top: calculateHeight(sidebarData.height, sidebarData.location) + '%' }"></span>
            </div>
            <div class="w-[250px]">
                <!-- //开启关闭 -->
                <div class="py-2">
                    <label for="width">侧边栏：</label>
                    <n-switch v-model:value="sidebarData.status" class="ml-2" />
                </div>
                <div class="py-2">
                    <label for="width">宽:{{ sidebarData.width }}px</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.width" :min="1" :step="1" />
                </div>
                <div class="py-2">
                    <label for="height">高:{{ sidebarData.height }}%</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.height" :min="1" :step="1" />
                </div>
                <div class="py-2">
                    <label for="location">位置:{{ sidebarData.location }}%</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.location" @update:value="updateLocation"
                        :min="0" :step="1" />
                </div>
                <div class="py-2">
                    <label for="opacity">透明度:{{ sidebarData.opacity }}</label>
                    <n-slider :default-value="5" v-model:value="sidebarData.opacity" :step="1" :min="5" />
                </div>
                <div class="py-2">
                    <label for="closeTime">关闭时间:{{ sidebarData.closeTime }}秒</label>
                    <n-slider :default-value="2" v-model:value="sidebarData.closeTime" :step="1" :min="2" />
                </div>
                <div class="py-2">
                    <label for="position">侧边栏在:</label>
                    <n-radio-group v-model:value="sidebarData.position" class="ml-[20px]">
                        <n-radio value="Left">左</n-radio>
                        <n-radio value="Right">右</n-radio>
                    </n-radio-group>
                </div>
            </div>
            <div class="w-[125px] ">
                <span v-if="sidebarData.position == 'Right'" class="bg-slate-500 flex absolute right-0"
                    :style="{ width: sidebarData.width + 'px', height: sidebarData.height + '%', opacity: sidebarData.opacity / 100, top: calculateHeight(sidebarData.height, sidebarData.location) + '%' }"></span>
            </div>
        </div>
        <template #footer>
            <div class="flex flex-row justify-end">
                <!-- 重置按钮 -->
                <n-button type="info" class="mr-2" @click="resetSidebarData">重置</n-button>
                <!-- 保存按钮 -->
                <n-button type="primary" class="ml-2" @click="save">保存</n-button>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useLocalStorage } from '@/stores/useLocalStorage';
import type { UploadAreaType } from '@/type/index'
const sidebarData = ref<UploadAreaType>({
    status: true,
    width: 1,
    height: 1,
    location: 0,
    opacity: 5,
    closeTime: 2,
    position: 'Right',
});

const emit = defineEmits(['save']);

const save = (): void => {
    useLocalStorage.set('uploadArea', sidebarData.value);
    emit('save');
}


const resetSidebarData = (): void => {
    sidebarData.value = <UploadAreaType>{
        status: true,
        width: 1,
        height: 1,
        location: 0,
        opacity: 5,
        closeTime: 2,
        position: 'Right',
    };
};

const calculateHeight = (height: number, value: number): number => {
    return height + value > 100 ? 100 - height : value;
};

const updateLocation = (value: number): void => {
    if (sidebarData.value.height + value <= 100) {
        sidebarData.value.location = value;
    } else {
        sidebarData.value.location = Math.trunc(100 - sidebarData.value.height); 

    }
};

onMounted(() => {
    useLocalStorage.get("uploadArea").then(res => {
        if (!res) {
            res = {
                status: true,
                width: 32,
                height: 30,
                location: 34,
                opacity: 30,
                closeTime: 2,
                position: "Right"
            }
            useLocalStorage.set("uploadArea", res);
console.log("获取侧边栏数据", res);
        }
        console.log("获取侧边栏数据", res);
        sidebarData.value = res
    })
});

</script>
