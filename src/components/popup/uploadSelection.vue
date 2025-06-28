<template>
  <n-select class="m-2 w-[256px] max-sm:w-11/12 " v-model:value="SelectedUploadConfig" :render-tag="renderTag"
    :render-label="renderLabel" :render-option="renderOption" :max-tag-count="1" multiple clearable
    :options="BedConfigStoreOptions" placeholder="请选择" @update:value="handleUpdateValue">

  </n-select>
</template>
<script setup lang="ts">
import type { ConfigResponse } from '@/type'
import type { SelectRenderTag } from 'naive-ui'
import type { VNodeChild, VNode } from 'vue';
import { NButton, NTooltip } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { ref, onMounted, h } from 'vue';
import { useIndexedDB } from '@/stores/useIndexedDB';
import { useSelectedUploadConfig } from '@/stores/common';

interface SelectOption {
  label: string;
  value: string;
  source?: ConfigResponse;
}
const {
  SelectedUploadConfig
} = storeToRefs(useSelectedUploadConfig())
const {
  setSelectedUploadConfig
} = useSelectedUploadConfig();
const BedConfigStoreOptions = ref<SelectOption[]>([]);
const BedConfigStore = ref<ConfigResponse[]>([]);

onMounted(async () => {
  BedConfigStore.value = await useIndexedDB.BedConfigStore.getAllSortedByIndex()
  BedConfigStoreOptions.value = BedConfigStore.value.map(item => {
    return { label: item.ConfigName, value: item.id, source: item } as SelectOption
  });
  await useSelectedUploadConfig().initialize();
  pushSelectedData(SelectedUploadConfig.value);
});
//渲染Tag
const renderTag: SelectRenderTag = ({ option, handleClose }) => {
  return h('div', { class: 'flex flex-row items-center ' }, [
    h('span', { class: 'w-[128px] overflow-hidden whitespace-nowrap text-ellipsis' }, { default: () => option.label }),
    h(NButton, { type: "error", class: 'i-ph-x', onClick: handleClose })
  ]);
}
// 渲染Label
const renderLabel = (option: SelectOption): VNodeChild => {
  return h('div', { class: 'flex flex-row items-center w-full ' }, [
    h('span', { class: 'px-2 overflow-hidden whitespace-nowrap text-ellipsis' }, { default: () => option.label }),
  ]);
}
// 渲染Option
const renderOption = ({ node, option }: { node: VNode, option: SelectOption }) => {
  return h(NTooltip, null, {
    trigger: () => node,
    default: () => `${option.source?.data.Program}`
  });
}

const emit = defineEmits<{
  (e: "selectedData-update", value: ConfigResponse[]): void;
}>();

const handleUpdateValue = (value: string[]) => {
  setSelectedUploadConfig(value).then(() => {
    pushSelectedData(value);
  });
}
// 推送选中的数据给父组件
const pushSelectedData = (value: string[]) => {
  if (!value) { return; }
  const selectedData = BedConfigStore.value.filter(item => value.includes(item.id as string));
  emit("selectedData-update", selectedData);
}

</script>
