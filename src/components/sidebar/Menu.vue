<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import type { VNode } from 'vue';
import { renderIcon } from '@/utils/main'
import { useRouter } from 'vue-router';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useAppSettings} from '@/stores/appSettings';

import { useMessage } from 'naive-ui';
import { NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const message = useMessage();
const { setProgramInstallationStatus } = useAppSettings()
export interface ChildOption {
    id: string
    value: string
    text: string
    demo_images: string
    describe: string
    index: number
    key: string
}
interface MenuItem {
    // label: string | (() => VNode); // 可以是字符串或返回 VNode 的函数
    label: any; // 可以是字符串或返回 VNode 的函数
    icon: () => VNode; // 图标是一个返回 VNode 的函数
    href: string; // 链接地址
    key: string; // 唯一标识
    children?: ChildOption[]
}

const menuData = ref<MenuItem[]>([
    {
        label: () => h('span', [t('Upload page')]),
        icon: renderIcon('i-ph-file-arrow-up w-5 h-5'),  // 使用 CSS 类名作为图标
        href: '/popup',
        key: 'popup'
    },
    {
        label: () =>
            h('div', {
                class: 'flex justify-between items-center pr-2 ',
            }, [
                h('span', [t('Config API')]),
                h(NButton, {
                    class: 'w9 h5',
                    size: 'small',
                    type: 'tertiary',  // 保留这个
                    round: true,
                    strong: true,
                    focusable: false,
                    ariaLabel: '添加存储配置',
                    renderIcon: renderIcon('i-ph-plus !w16px !h16px'),
                    onClick: (e) => {
                        openInstall()
                    },
                }),
            ]),
        icon: renderIcon('i-ph-plugs'),
        href: '/options',
        key: 'options'
    },
    {
        label: () => h('span', [t('Upload records')]),
        icon: renderIcon('i-ph-images'),
        href: '/uploadRecords',
        key: 'uploadRecords'
    },
    {
        label: () => h('span', [t('FAQ')]),
        icon: renderIcon('i-ph-question'),
        href: '/help',
        key: 'help'
    }
]);
// 定义响应式 activeMenuKey 状态
const activeMenuKey = ref<string>('');
interface ProgramConfig {
    Program: string;
}

const ProgramConfiguration = ref<ProgramConfig>({ Program: '' });
// 打开安装
function openInstall(): void {
    setProgramInstallationStatus(true);
}
// 处理菜单点击事件
function handleMenuClick(key: string, item: any): void {
    if (!menuData.value[1].children) {
        openInstall()
    }

    if (item.value) {
        router.push({ path: '/options', hash: `#program=${item.value}` });
    } else {
        router.push({ path: item.key });
    }
    activeMenu(key);
}
// 激活菜单项
function activeMenu(key: string): void {
    activeMenuKey.value = key
}

const handleError = (error: unknown): void => {
    message.error('配置程序,数据获取失败');
    console.error(error);
};

const fetchProgramConfiguration = async () => {
    try {
        const result = await useLocalStorage.get("ProgramConfiguration");
        ProgramConfiguration.value = result || {};
    } catch (error) {
        handleError(error);
    }
};

const fetchApplicationMenu = async () => {
    try {
        await fetchProgramConfiguration();
        const result = await useIndexedDB.ApplicationMenu.getAllSortedByIndex();
        if (result.length === 0) {
            openInstall()
            return;
        }
        const active = result.find(item => item.value === window.location.hash.split('=')[1]);
     
        
        result.forEach((item) => {
            item.key = item.id;
            item.label = () => h('span', {}, [
                item.text,
                // item.value === ProgramConfiguration.value.Program ? h('span', { class: 'text-red ml-1' }, '[运行]') : null
            ]);
            item.icon = renderIcon(item.icon);
            item.href = renderIcon(item.value);
        });
        menuData.value[1].children = result;

        if (active) {
            activeMenu(active.key);
        }
    } catch (error) {
        handleError(error);
    }
};
// 路由发生变化时
const router = useRouter();
router.afterEach((to, from) => {
    const currentHash = window.location.hash.split('=')[1];
    // message.error('扩展还在开发过程中，这版本有一堆bug，请不要使用！发布仅占位作用！');
    let currentOption: ChildOption | undefined;
    if (menuData.value[1].children) {
        currentOption = menuData.value[1].children.find(item => item.value === currentHash);
    }
    if (currentOption) {
        activeMenu(currentOption.id);
    }
});

onMounted(async () => {
    const currentPath = window.location.hash.split('#')[1];
    const currentOption = menuData.value.find(item => item.href === currentPath);

    if (currentOption) {
        activeMenu(currentOption.key);
    }

    await fetchProgramConfiguration();
    await fetchApplicationMenu();
    window.addEventListener('readApplicationMenu', fetchApplicationMenu);
});
</script>

<template>
    <n-menu v-model:value="activeMenuKey" :options="menuData" :collapsed-width="64" @update:value="handleMenuClick" />
</template>
