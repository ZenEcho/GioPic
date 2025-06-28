import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useLocalStorage } from '@/stores/useLocalStorage';

export const useSelectedUploadConfig = defineStore('SelectedUploadConfig', () => {
    const SelectedUploadConfig = ref<string[]>([]); // 初始默认值

    //   保存到本地存储
    async function setSelectedUploadConfig(value: any) {
        SelectedUploadConfig.value = value;
        await useLocalStorage.set("SelectedUploadConfig", value);
        return SelectedUploadConfig.value;
    }

    // 新增异步初始化方法
    async function initialize() {
        SelectedUploadConfig.value = await useLocalStorage.get("SelectedUploadConfig");
        return SelectedUploadConfig.value;
    }

    return {
        SelectedUploadConfig,
        initialize, // 初始化方法
        setSelectedUploadConfig
    };
});