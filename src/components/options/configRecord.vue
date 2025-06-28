<template>
    <div class="h-screen hide-scrollbar overflow-scroll">
        <div>
            <div class="text-lg font-bold px-4 py-6 relative flex  items-center"
                :class="ConfigCollapsed ? 'flex-col' : ' flex-row '">
                <div @click="setConfigCollapsed(!ConfigCollapsed)"
                    class="i-ph-suitcase-simple w-8 h-8">
                </div>
                <span class=" whitespace-nowrap text-ellipsis" v-show="!ConfigCollapsed">{{ $t('Config Record')
                }}</span>
                <span class="text-[14px] " v-show="!ConfigCollapsed">({{ BedConfigStore.length }})</span>
            </div>
            <div class="mt-1 border-t">
                <div v-if="BedConfigStore.length > 0">
                    <n-list hoverable clickable show-divider class=" overflow-hidden">
                        <n-list-item v-for="(config, index) in BedConfigStore" :key="config.id"
                            :draggable="!config.isEditing" :class="[{
                                'opacity-50': draggedItemIndex === index,
                                'bg-gray-200': dragOverIndex === index
                            }, ConfigCollapsed ? ' flex justify-center' : '',]" @dragstart="handleDragStart(index)"
                            @dragover.prevent="handleDragOver(index)" @drop="handleDrop(index)" @dragend="handleDragEnd"
                            :title="ConfigCollapsed ? config.ConfigName : ''">
                            <n-popover trigger="hover">
                                <template #trigger>
                                    <div class=" flex items-center justify-center">
                                        <div :class="ConfigCollapsed ? '' : ' mr-1 w-8 h-6'">
                                            <component @click="addButton(config)"
                                                :is="getIconComponent(config.data.Program)"></component>
                                        </div>

                                        <div v-show="!ConfigCollapsed" class="h-8 w-full flex flex-row items-center">
                                            <div class="w-full" @dblclick="enableEditing(config, $event)">
                                                <n-ellipsis style="max-width: 128px" v-if="!config.isEditing"
                                                    :data-old-value="config.ConfigName"
                                                    :title="$t('Double Click to Edit')">
                                                    {{ config.ConfigName }}
                                                </n-ellipsis>
                                                <n-input class="text-sm" v-else-if="config.isEditing"
                                                    v-model:value="config.ConfigName" size="small"
                                                    @blur="disableEditing(config)" @keyup.enter="disableEditing(config)"
                                                    type="text" />
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div class="flex flex-col items-center">
                                    <div v-show="ConfigCollapsed" class=" text-center py-1 w-full" title="展开后双击编辑名称">
                                        {{ config.ConfigName }}
                                    </div>
                                    <div class="flex flex-row py-1">
                                        <n-button type="primary"
                                            :title="$t('Load') + ':[' + config.ConfigName + ' | ' + config.data.Program + ']'"
                                            class="i-ph-plugs-connected w-6 h-6 px-0"
                                            @click="addButton(config)">
                                        </n-button>
                                        <n-button type="info"
                                            :title="$t('Share') + ':[' + config.ConfigName + ' | ' + config.data.Program + ']'"
                                            class="i-ph-share-network w-6 h-6  "
                                            @click="shareButton(config)">
                                        </n-button>
                                        <n-button type="error"
                                            :title="$t('Delete') + ':[' + config.ConfigName + ' | ' + config.data.Program + ']'"
                                            class="i-ph-trash w-6 h-6  px-0"
                                            @click="deleteButton(config)">
                                        </n-button>
                                    </div>
                                </div>
                            </n-popover>

                        </n-list-item>
                    </n-list>
                </div>
                <n-result v-else status="404" title="404 资源不存在" description="可能是你还没有配置！">
                </n-result>
            </div>
            <div class="flex justify-center w-full my-2  border-t">
                <n-button @click="clearAllConfig" size="small" secondary type="error"
                    :class="ConfigCollapsed ? 'my-1 flex justify-center items-center' : 'mx-1'">
                    <template #icon>
                        <n-icon size="22">
                            <div class="i-ph-trash"></div>
                        </n-icon>
                    </template>
                    <span v-show="!ConfigCollapsed">{{ $t('Delete All Config') }}</span>
                </n-button>
            </div>
            <div class="flex justify-center items-center border-t py-2"
                :class="ConfigCollapsed ? 'flex-col' : 'flex-row '">
                <n-button size="small" secondary type="info" @click="allShareButton" :title="$t('Share')"
                    :class="ConfigCollapsed ? 'my-1 flex justify-center items-center' : 'mx-1'">
                    <template #icon>
                        <n-icon size="22">
                            <div class="i-ph-share-network"></div>
                        </n-icon>
                    </template>
                    <span v-show="!ConfigCollapsed">{{ $t('Share') }}</span>
                </n-button>
                <n-button size="small" secondary type="primary" @click="importshow" :title="$t('Import')"
                    :class="ConfigCollapsed ? 'my-1' : 'mx-1'">
                    <template #icon>
                        <n-icon size="22">
                            <div class="i-ph-list-plus"></div>
                        </n-icon>
                    </template>

                    <span v-show="!ConfigCollapsed">{{ $t('Import') }}</span>
                </n-button>

            </div>
            <n-drawer v-model:show="importState" :width="500">
                <n-drawer-content :title="$t('Import Data')" closable class="dark:bg-gray-100/50">
                    <n-input v-model:value="textareaData" type="textarea" :placeholder="$t('Paste the data here')"
                        :autosize="{
                            minRows: 5
                        }" round clearable />
                    <div class="flex justify-center mt-2">
                        <n-button type="primary" @click="Replace" class="mx-1">{{ $t('Replace') }}</n-button>
                        <n-button type="info" @click="Append" class="mx-1">{{ $t('Append') }}</n-button>
                    </div>
                </n-drawer-content>
            </n-drawer>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ConfigResponse } from '@/type/index'
import { ref, inject, nextTick, toRaw, onMounted, h, onBeforeMount } from 'vue';
import type { VNode } from 'vue';
// import { dbHelper } from '@/assets/js/db';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useNotification } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useMessage, useDialog } from "naive-ui";
import { activateBedConfig } from '@/utils/storage';
import { renderIcon } from '@/utils/main';
import { configReplace, configAppend } from '@/utils/configReplace';
import { programData } from '@/stores/program';

import { storeToRefs } from 'pinia'
import { useAppSettings } from '@/stores/appSettings';

const { setConfigCollapsed } = useAppSettings()
const {
    ConfigCollapsed
} = storeToRefs(useAppSettings())

const message = useMessage();
const dialog = useDialog();
// 获取路由实例
const router = useRouter();

// 数据类型ConfigResponse
const BedConfigStore = ref<ConfigResponse[]>([]);

const notification = useNotification();
const importState = ref(false);
const textareaData = ref('');
const importshow = () => {
    importState.value = true;
};

// 拖拽相关状态
const draggedItemIndex = ref<number | null>(null); // 保存拖动的元素索引
const dragOverIndex = ref<number | null>(null);  // 保存当前拖动经过的元素索引

// 记录拖动的元素索引
const handleDragStart = (index: number): void => {

    draggedItemIndex.value = index;
};

// 记录当前拖动经过的元素索引
const handleDragOver = (index: number): void => {

    //  禁止重复触发
    if (dragOverIndex.value === index) return;
    dragOverIndex.value = index;
};

// 处理放置元素时的位置交换
const handleDrop = (index: number): void => {

    if (draggedItemIndex.value === null || draggedItemIndex.value === index) return;

    // 拖动的元素
    const draggedItem = BedConfigStore.value[draggedItemIndex.value];
    // 从原位置移除拖动的元素，并在目标位置插入
    BedConfigStore.value.splice(draggedItemIndex.value, 1);
    BedConfigStore.value.splice(index, 0, draggedItem);
    // 重新排序索引
    BedConfigStore.value.forEach((item, idx) => {
        item.index = idx;
    });
    // 清除拖拽相关状态
    draggedItemIndex.value = null;
    dragOverIndex.value = null;
    // 克隆BedConfigStore.value并确保对象是纯粹的数据对象
    const modifiedBedConfig = BedConfigStore.value.map(({ id, index, ...rest }) => ({
        id,
        index,
        ...JSON.parse(JSON.stringify(rest))
    }));
    useIndexedDB.BedConfigStore.put(modifiedBedConfig).then(() => {
        message.success("排序已保存！");
    }).catch(error => {
        console.error("Error updating data:", error);
    });
};

// 拖动结束后清理状态
const handleDragEnd = (): void => {

    draggedItemIndex.value = null;
    dragOverIndex.value = null;
};

// --------
const enableEditing = (config: ConfigResponse, event: MouseEvent): void => {
    // 保存原始名称
    config.originalConfigName = config.ConfigName;
    // 标记为编辑状态
    config.isEditing = true;

    // 在 DOM 更新后聚焦输入框
    nextTick(() => {
        const inputElement = (event.currentTarget as HTMLElement).querySelector("input");
        if (inputElement) {
            inputElement.focus();
        }
    });
};

const disableEditing = (config: ConfigResponse): void => {
    // 退出编辑状态
    config.isEditing = false;

    // 如果配置名称为空或未修改，恢复原始名称
    if (!config.ConfigName || config.ConfigName === config.originalConfigName) {
        config.ConfigName = config.originalConfigName;
        return;
    }

    // 清除保存的原始值
    delete config.originalConfigName;
    delete config.isEditing;

    // 获取原始对象
    const rawConfig = toRaw(config);

    // 保存到 IndexedDB
    useIndexedDB.BedConfigStore.put(rawConfig).then(() => {
        message.success("已修改为: " + rawConfig.ConfigName);
    });
};
// ----------------------
function addButton(config: ConfigResponse): void {
    useLocalStorage.set("ProgramConfiguration", {}).then(() => {
        activateBedConfig(config).then(() => {
            // 延迟1秒刷新页面
            if (router.currentRoute.value.path === '/options') {
                router.push({ path: '/options', hash: `#program=${config.data.Program}` });
            } else {
                window.location.reload()
            }
            window.dispatchEvent(new Event('readApplicationMenu')); // 更新侧边栏的菜单
            setTimeout(() => {
                window.dispatchEvent(new Event('readProgramConfiguration')); //更新表单数据
            }, 200);
        });
    });

}

function shareButton(config: ConfigResponse): void {
    const { id, index, originalConfigName, isEditing, ...newData } = config;
    navigator.clipboard.writeText(JSON.stringify(newData))
        .then(() => {
            message.success(config.ConfigName + ":数据已复制到剪切板！");
        })
        .catch(error => {
            message.error(config.ConfigName + "复制失败！");
            console.log(error);
        });
}
function deleteButton(config: ConfigResponse): void {
    if (!config) return;
    const index = BedConfigStore.value.findIndex(item => item.id === config.id);
    if (index !== -1) {
        // 删除上传配置的
        useLocalStorage.get("uploadOptions").then((options) => {
            // 遍历options,如果options中有config.id,则删除
            options = options.filter((item: string) => item !== config.id);
            useLocalStorage.set("uploadOptions", options);
        })
        useIndexedDB.BedConfigStore.delete(config.id).then(() => {
            BedConfigStore.value.splice(index, 1);
            message.success("删除成功");
        }).catch(error => {
            message.error(config.ConfigName + ":好像删除失败了,使用开发者工具(F12)查看错误原因！");
            console.log(error);
        });
    }

}
// 删除全部配置
function clearAllConfig(): void {
    // 弹出确认提示
    if (BedConfigStore.value.length > 0) {
        dialog.warning({
            title: '警告',
            content: '你确定删除全部配置？',
            negativeText: '确定',
            onNegativeClick: () => {
                useIndexedDB.BedConfigStore.clear().then(() => {
                    BedConfigStore.value = [];
                    message.success('已删除全部配置');
                }).catch(error => {
                    message.error('删除失败');
                    console.log(error);
                });
            }
        })
    }


}
//全部分享按钮
function allShareButton(): void {
    if (BedConfigStore.value.length > 0) {
        const modifiedBedConfig = BedConfigStore.value.map(({ id, index, ...rest }) => rest);
        navigator.clipboard.writeText(JSON.stringify(modifiedBedConfig))
            .then(() => {
                message.success('已复制全部配置到剪切板');
            })
            .catch(error => {
                message.error('复制失败');
                console.log(error);
            });
    }

}

const Replace = async () => {
    try {
        configReplace(textareaData.value).then(() => {
            notification.success({
                title: "成功",
                content: "加载成功,即将重新加载页面！",
                duration: 3000,
            });
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 延迟
        })
    } catch (error) {
        handleError(error);
    }
};

const Append = async () => {
    try {
        configAppend(textareaData.value).then(() => {
            notification.success({
                title: "成功",
                content: "加载成功,即将重新加载页面！",
                duration: 3000,
            });
            setTimeout(() => {
                window.location.reload();
            }, 1000); // 延迟
        })
    } catch (error) {
        handleError(error);
    }
};
const handleError = (error: any): void => {
    console.error(error);
    notification.error(error.message);
};

// ----------------------
function getIconComponent(program: string | undefined): VNode | null {
    if (!program) return null;
    // item的类型是ProgramData
    const icon = programData.find(item => item.value === program);
    return icon ? renderIcon(icon.icon)() : null;
}
function readBedConfig() {
    useIndexedDB.BedConfigStore.getAllSortedByIndex().then(data => {
        BedConfigStore.value = data;
    }).catch(error => {
        console.error(error);
    });
}


onMounted(() => {
    readBedConfig()

})

window.addEventListener('message', function (event) {
    if (event.data.type === 'Refresh') {
        readBedConfig()
    }
});
window.addEventListener('readBedConfig', readBedConfig);
</script>
