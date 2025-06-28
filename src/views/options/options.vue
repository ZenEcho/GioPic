<template>
    <n-message-provider>

        <n-layout has-sider sider-placement="right">

            <n-layout-content content-style="padding: 20px 32px" class="h-screen transparent-scrollbar">
                <siteTitle />
                <div v-if="program == 'Tencent_COS' || program == 'Aliyun_OSS' || program == 'AWS_S3'">
                    <corsTemplate :program="program" />
                </div>
                <div v-else>

                    <whatisCORS v-if="!storedFormValue.CorsProxy">
                        <n-button tertiary title="CORS" class="mb-2 w-full" @click="storedFormValue.CorsProxy = true">
                            <template #icon>
                                <n-icon class="i-ph-info w-6 h-6"></n-icon>
                            </template>
                            CORS
                        </n-button>
                    </whatisCORS>
                    <n-form :model="storedFormValue" v-if="storedFormValue.CorsProxy">
                        <n-form-item label="CORS代理" path="Cors">
                            <n-input v-model:value="storedFormValue.Cors" placeholder="CORS代理地址" />
                            <n-button tertiary type="error" title="关闭CORS" @click="storedFormValue.CorsProxy = false"
                                class="i-ph-x  w-6 h-6"></n-button>
                        </n-form-item>
                    </n-form>
                </div>
                <!-- 动态组件渲染 -->
                <template v-if="activeComponent">
                    <component :is="activeComponent" @submit="handleFormSubmit" :initial-form-value="storedFormValue" />
                </template>
                <div v-else>
                    <n-result status="418" title="出问题了,此路不通" description="可能是你没被正确引导吧！">
                        <template #footer>
                            <n-button @click="guideJump">散财消灾</n-button>
                        </template>
                    </n-result>
                    <div class="debug-info">
                        <div>当前路由参数: {{ program }}</div>
                        <div>存储配置: {{ storedFormValue }}</div>
                    </div>
                </div>


            </n-layout-content>
            <!-- 将 show-trigger 属性绑定到计算属性 -->
            <n-layout-sider bordered :collapsed="ConfigCollapsed" collapse-mode="width" :width="220"
                :collapsed-width="64" @update:collapsed="handleConfigCollapsed" show-trigger="bar"
                content-style="padding: 0;">
                <n-dialog-provider>
                    <configRecord />
                </n-dialog-provider>
            </n-layout-sider>
        </n-layout>
    </n-message-provider>
</template>

<script setup lang="ts">
import type { VNode } from 'vue';
import { ref, watch, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { NMessageProvider } from 'naive-ui';
import { useDB_BedConfig, activateBedConfig } from '@/utils/storage';

import { storeToRefs } from 'pinia'
import { useAppSettings } from '@/stores/appSettings';

const { setConfigCollapsed } = useAppSettings()
const {
    ConfigCollapsed
} = storeToRefs(useAppSettings())


// 组件动态导入
const components: Record<string, ReturnType<typeof defineAsyncComponent>> = {
    'Lsky': defineAsyncComponent(() => import('@/components/interfaceTemplate/Lsky.vue')),
    'EasyImages': defineAsyncComponent(() => import('@/components/interfaceTemplate/EasyImages.vue')),
    'ImgURL': defineAsyncComponent(() => import('@/components/interfaceTemplate/ImgURL.vue')),
    'Chevereto': defineAsyncComponent(() => import('@/components/interfaceTemplate/Chevereto.vue')),
    'Hellohao': defineAsyncComponent(() => import('@/components/interfaceTemplate/Hellohao.vue')),
    'SM_MS': defineAsyncComponent(() => import('@/components/interfaceTemplate/SM_MS.vue')),
    'Imgur': defineAsyncComponent(() => import('@/components/interfaceTemplate/Imgur.vue')),
    'Tencent_COS': defineAsyncComponent(() => import('@/components/interfaceTemplate/AWS_S3.vue')),
    'Aliyun_OSS': defineAsyncComponent(() => import('@/components/interfaceTemplate/AWS_S3.vue')),
    'AWS_S3': defineAsyncComponent(() => import('@/components/interfaceTemplate/AWS_S3.vue')),
    'GitHub': defineAsyncComponent(() => import('@/components/interfaceTemplate/GitHub.vue')),
    'IMGDD': defineAsyncComponent(() => import('@/components/interfaceTemplate/IMGDD.vue')),
    'BaiJiaHao': defineAsyncComponent(() => import('@/components/interfaceTemplate/BaiJiaHao.vue')),
    'Custom': defineAsyncComponent(() => import('@/components/interfaceTemplate/Custom.vue')),
};

const message = useMessage();
const { setProgramInstallationStatus } = useAppSettings()
const router = useRouter();
const route = useRoute();

// 统一处理路由参数
const program = computed(() => {
    const hashParam = route.hash ? route.hash.split('=')[1] : '';
    return hashParam || '';
});


// 动态组件计算属性
const activeComponent = computed<ReturnType<typeof defineAsyncComponent> | undefined>(() => {
    const component = components[program.value];
    if (!component) {
        message.error(`未找到接口: ${program.value}`);
    }
    return component;
});

// 配置数据相关
const storedFormValue = ref<Record<string, any>>({});

// 表单提交处理
const handleFormSubmit = async (formData: any) => {
    try {
        formData.Program = program.value;
        formData.Cors = storedFormValue.value.Cors;
        formData.CorsProxy = storedFormValue.value.CorsProxy;
        const result = await useDB_BedConfig(formData);
        if (result.type === "error") {
            message.error(result.message.content);
            return;
        }
        await activateBedConfig(formData);
        message.success('配置保存成功！');
        window.dispatchEvent(new Event('readBedConfig'));
    } catch (error) {
        message.error("保存失败！");
        console.error('保存失败:', error);
    }
};

// 初始化加载配置
const readProgramConfiguration = async () => {
    try {
        const result = await useLocalStorage.get("ProgramConfiguration");
        storedFormValue.value = result || {};
    } catch (error) {
        console.error('读取配置失败:', error);
    }
};
function handleConfigCollapsed() {
    setConfigCollapsed(!ConfigCollapsed.value)
}

// 引导跳转
const guideJump = async () => {
    try {
        const menus = await useIndexedDB.ApplicationMenu.getAllSortedByIndex();
        if (menus.length > 0) {
            router.push(`/options#program=${menus[0].value}`);
        } else {
            setProgramInstallationStatus(true);
        }
    } catch (error) {
        console.error('导航失败:', error);
        message.error('无法加载菜单配置');
    }
};


// 生命周期钩子
onMounted(() => {
    readProgramConfiguration();
    window.addEventListener('readProgramConfiguration', readProgramConfiguration);

});

// 路由监听
watch(
    () => route.hash,
    () => {
        readProgramConfiguration();
    },
    { immediate: true }
);

</script>
<style>
/* 备用方案：透明滚动条 */
</style>