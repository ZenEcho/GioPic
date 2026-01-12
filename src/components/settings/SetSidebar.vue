<template>
    <n-modal :show="show" @update:show="(val) => emit('update:show', val)" class="w-[500px]" preset="card" :title="t('settings.sidebarSetting.title')"
        :bordered="false">
        <div class="flex flex-row relative">
            <div class="w-[125px]">
                <span v-if="sidebarData.position == 'Left'" class="bg-slate-500 flex absolute"
                    :style="{ width: sidebarData.width + 'px', height: sidebarData.height + '%', opacity: sidebarData.opacity / 100, top: calculateHeight(sidebarData.height, sidebarData.location) + '%' }"></span>
            </div>
            <div class="w-[250px]">
                <!-- //开启关闭 -->
                <div class="py-2">
                    <label for="width">{{ t('settings.sidebarSetting.switch') }}：</label>
                    <n-switch v-model:value="sidebarData.status" class="ml-2" />
                </div>
                <div class="py-2">
                    <label for="width">{{ t('settings.sidebarSetting.width') }}:{{ sidebarData.width }}px</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.width" :min="1" :step="1" />
                </div>
                <div class="py-2">
                    <label for="height">{{ t('settings.sidebarSetting.height') }}:{{ sidebarData.height }}%</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.height" :min="1" :step="1" />
                </div>
                <div class="py-2">
                    <label for="location">{{ t('settings.sidebarSetting.location') }}:{{ sidebarData.location }}%</label>
                    <n-slider :default-value="0" v-model:value="sidebarData.location" @update:value="updateLocation"
                        :min="0" :step="1" />
                </div>
                <div class="py-2">
                    <label for="opacity">{{ t('settings.sidebarSetting.opacity') }}:{{ sidebarData.opacity }}</label>
                    <n-slider :default-value="5" v-model:value="sidebarData.opacity" :step="1" :min="5" />
                </div>
                <div class="py-2">
                    <label for="closeTime">{{ t('settings.sidebarSetting.closeTime') }}:{{ sidebarData.closeTime }}s</label>
                    <n-slider :default-value="2" v-model:value="sidebarData.closeTime" :step="1" :min="2" />
                </div>
                <div class="py-2">
                    <label for="position">{{ t('settings.sidebarSetting.position') }}:</label>
                    <n-radio-group v-model:value="sidebarData.position" class="ml-[20px]">
                        <n-radio value="Left">{{ t('settings.sidebarSetting.positionLeft') }}</n-radio>
                        <n-radio value="Right">{{ t('settings.sidebarSetting.positionRight') }}</n-radio>
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
                <n-button type="info" class="mr-2" @click="resetSidebarData">{{ t('settings.sidebarSetting.reset') }}</n-button>
                <!-- 保存按钮 -->
                <n-button type="primary" class="ml-2" @click="save">{{ t('settings.sidebarSetting.save') }}</n-button>
            </div>
        </template>
    </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMessage } from 'naive-ui';
import browser from "webextension-polyfill";
import { useI18n } from "vue-i18n";

interface UploadAreaType {
    status: boolean;
    width: number;
    height: number;
    location: number;
    opacity: number;
    closeTime: number;
    position: 'Left' | 'Right';
}

const { t } = useI18n();
const message = useMessage();
const sidebarData = ref<UploadAreaType>({
    status: true,
    width: 32,
    height: 30,
    location: 34,
    opacity: 30,
    closeTime: 2,
    position: 'Right',
});

const props = defineProps<{
    show: boolean
}>();

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void;
    (e: 'save'): void;
}>();

const save = async (): Promise<void> => {
    await browser.storage.local.set({ uploadArea: sidebarData.value });
    emit('save');
    // 通知

    message.success(t('settings.sidebarSetting.saveSuccess'));
}

const resetSidebarData = (): void => {
    sidebarData.value = {
        status: true,
        width: 32,
        height: 30,
        location: 34,
        opacity: 30,
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

onMounted(async () => {
    const res = await browser.storage.local.get("uploadArea");
    if (res.uploadArea) {
        sidebarData.value = res.uploadArea as UploadAreaType;
    } else {
        // Initialize default if not exists
        await browser.storage.local.set({ uploadArea: sidebarData.value });
    }
});
</script>
