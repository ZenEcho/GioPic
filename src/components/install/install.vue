<template>
    <n-modal v-model:show="ProgramInstallationStatus" class="overflow-y-hidden w-11/12">
        <n-card :bordered="false" size="huge" role="dialog" aria-modal="true">
            <template #default>
                <div class="flex flex-col">
                    <div class="my-2">
                        <n-gradient-text type="info" class="w-full text-3xl text-center py-4">
                            {{ $t('Bro, choose an API you need!') }}
                        </n-gradient-text>

                    </div>
                    <n-tabs type="line" animated>
                        <n-tab-pane name="Interface" :tab="$t('API')">
                            <div class="flex flex-row items-center my-2">
                                <n-button @click="toggleViewMode" :title="$t('Display Mode')">
                                    <div class=" w-6 h-6"
                                        :class="viewMode ? 'i-ph-list-dashes' : 'i-ph-squares-four'">
                                    </div>
                                    <div class="ml-2">
                                        {{ viewMode ? $t('List View') : $t('Card View') }}

                                    </div>
                                </n-button>
                                <div class="mx-1">
                                    <n-button secondary @click="toggleAll" class="mx-1">
                                        <div class="i-ph-check-square h-6 w-6"></div>
                                        {{ $t('Select All') }}
                                    </n-button>
                                    <n-button secondary @click="toggleNone" class="mx-1">
                                        <div class="i-ph-square h-6 w-6"></div>
                                        {{ $t('Cancel') }}
                                    </n-button>
                                </div>
                                <n-button class="ml-1" type="success" strong @click="saveData">
                                    <div class="i-ph-check h-6 w-6"></div>
                                    {{ $t('Complete') }}
                                </n-button>
                            </div>
                            <div class="overflow-auto  h-[calc(100vh-330px)]">
                                <div class=" flex flex-wrap justify-center overflow-auto" v-if="!viewMode">
                                    <n-card v-for="item in programData" :key="item.id"
                                        class="w-[420px] m-2 flex flex-wrap border-2 border-solid border-gray-100"
                                        :class="{ selected: isSelected(item.id) }"
                                        @click="toggleSelection($event, item)" size="huge" role="dialog"
                                        aria-modal="true">
                                        <!-- 头部插槽 -->
                                        <template #header>
                                            <n-flex justify="center">
                                                <n-image :src="item.demo_images" :alt="item.text" class=" rounded"
                                                    :img-props="{ class: 'w-full  h-[220px]' }" />
                                            </n-flex>
                                        </template>
                                        <!-- 主体插槽 -->
                                        <template #default>
                                            <div class=" flex flex-col">
                                                <span class="text-2xl !max-md:text-xl  text-blue-600"> {{ item.text
                                                }}</span>
                                                <n-ellipsis :line-clamp="3"
                                                    class="text-xl my-2 text  !max-lg:text-base">
                                                    {{ item.describe }}
                                                </n-ellipsis>
                                            </div>
                                        </template>
                                    </n-card>
                                </div>
                                <div v-if="viewMode" class="flex  overflow-auto">
                                    <n-list hoverable clickable class="w-full">
                                        <n-list-item v-for="item in programData" :key="item.id"
                                            class="h-[300px] w-full my-1 border-2 border-solid border-gray-100"
                                            @click="toggleSelection($event, item)"
                                            :class="{ selected: isSelected(item.id) }">
                                            <div class=" flex">
                                                <n-image :src="item.demo_images" :alt="item.text" class=" rounded"
                                                    :img-props="{ class: 'w-[380px] mr-8' }" />

                                                <div class="flex flex-col">
                                                    <span class="text-3xl my-2  !max-md:text-2xl text-blue-600"> {{
                                                        item.text
                                                        }}</span>
                                                    <n-ellipsis :line-clamp="5"
                                                        class="text-xl my-2 text  !max-lg:text-base">
                                                        {{ item.describe }}
                                                    </n-ellipsis>

                                                </div>

                                            </div>

                                        </n-list-item>
                                    </n-list>
                                </div>
                            </div>

                        </n-tab-pane>
                        <n-tab-pane name="导入数据" :tab="$t('Import Data')">

                            <n-input v-model:value="textareaData" type="textarea"
                                :placeholder="$t('Paste the data here')" class="h-[300px]" />
                            <div class="flex justify-center mt-2">
                                <n-button type="primary" @click="Replace()" class="mx-1">{{ $t('Replace') }}</n-button>
                                <n-button type="info" @click="Append()" class="mx-1">{{ $t('Append') }}</n-button>
                                <div class="mx-1">
                                    <n-popover trigger="hover">
                                        <template #trigger>
                                            <n-button>{{ $t('Data Example') }}</n-button>
                                        </template>
                                        <code>
                    { <br>
                    &nbsp;&nbsp; "data": {<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Album": "",<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Host": "google.com",<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Privacy": "0",<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Program": "Lsky",<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Storage": "2",<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;"Token": "Bearer1|114514"<br>
                    &nbsp;&nbsp;},<br>
                    &nbsp;&nbsp;"ConfigName": "配置名称"<br>
                    }<br>
                </code>
                                    </n-popover>
                                </div>
                            </div>
                        </n-tab-pane>
                    </n-tabs>



                    <div class=" absolute top-[26px] right-[24px] ">
                        <!-- 关闭 -->
                        <n-button title="关闭" type="error" @click="handleClose"
                            class="i-ph-x h-10 w-10">
                        </n-button>
                    </div>
                </div>
            </template>
        </n-card>
    </n-modal>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";
import { programData } from '@/stores/program';
import type { ProgramDataType } from '@/stores/program'
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useAppSettings } from '@/stores/appSettings';
import { storeToRefs } from 'pinia'
import { useMessage, useNotification } from 'naive-ui';
import { configReplace, configAppend } from '@/utils/configReplace';
const message = useMessage();
const textareaData = ref('');
const notification = useNotification();


const { setProgramInstallationStatus } = useAppSettings()
const {
    ProgramInstallationStatus
} = storeToRefs(useAppSettings())





const handleClose = () => {
    setProgramInstallationStatus(false);
};
const selected = ref<ProgramDataType[]>([]);
function isSelected(id: string) {
    return selected.value.some(item => item.id === id);
}
//全选
const toggleAll = () => {
    if (selected.value.length === programData.length) {
        selected.value = [];
    } else {
        selected.value = [...programData];
    }
};
//取消
const toggleNone = () => {
    selected.value = [];
};
const toggleSelection = (event: MouseEvent, item: ProgramDataType) => {
    // 如果点击到img就返回
    if ((event.target as HTMLElement).tagName === 'IMG') {
        return;
    }
    const index = selected.value.findIndex(selectedItem => selectedItem.id === item.id);
    if (index === -1) {
        selected.value.push(item);
    } else {
        selected.value.splice(index, 1);
    }
};
//保存数据
const saveData = () => {
    let indexedData = selected.value.map((item, index) => {
        return {
            ...item, // 展开原始对象
            index    // 添加 index 属性
        };
    });
    if (indexedData.length > 0) {
        useIndexedDB.ApplicationMenu.clear()
            .then(() => useIndexedDB.ApplicationMenu.add(indexedData))
            .then(({ successes, errors }) => {
                if (errors.length > 0) {
                    message.error('添加新数据时发生错误的数据项');
                    console.error(errors);
                    return;
                }
                message.success('已添加的新数据项');
                window.dispatchEvent(new Event('readApplicationMenu'));
                handleClose(); // 操作完成后调用
            })
            .catch(error => {
                message.error('意外的错误');
                console.error(error);
            });

    } else {
        handleClose()
    }

};
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
const handleError = (error: any) => {
    console.error(error);
    notification.error(error.message);
};
const viewMode = ref(true)
// 可视排列模式
function toggleViewMode() {
    viewMode.value = !viewMode.value
}

// 监听 showInstall 的变化
// watch(showInstall, (newVal) => {
//     if (newVal) {
//         useIndexedDB.ApplicationMenu.getAll().then((result) => {
//             selected.value = [...result]
//         });
//     }
// });

</script>

<style scoped>
.selected {
    border: 2px solid #42b983 !important;
}
</style>