<template>
    <n-collapse display-directive="show" @item-header-click="handleCollapseChange">
        <n-collapse-item title="变量规则" name="1">
            <p class="text-red">作用：用来代表上传时填入的值</p>
            <n-input v-model:value="searchQuery" placeholder="规则..." style="margin-bottom: 10px;" />
            <n-collapse default-expanded-names="1">
                <n-collapse-item title="结果" name="1">
                    <n-descriptions bordered label-style="color: blue; font-weight: bold;">
                        <n-descriptions-item v-for="item in filteredItems" :key="item.label" :label="item.label">
                            {{ item.description }}
                        </n-descriptions-item>
                    </n-descriptions>
                </n-collapse-item>
            </n-collapse>
        </n-collapse-item>
    </n-collapse>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useRoute } from 'vue-router';

// 定义变量项的接口
interface VariableItem {
    label: string;
    description: string | ComputedRef<string>;
}

const route = useRoute();
const program = ref(route.hash.split('=')[1]);
// 搜索关键词
const searchQuery = ref("");

// 数据项
const uploadVariables = ref<VariableItem[]>([]);

// 根据搜索关键词过滤数据
const filteredItems = computed(() => {
    if (!searchQuery.value) return uploadVariables.value;
    return uploadVariables.value.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (typeof item.description === 'string'
            ? item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
            : (item.description as ComputedRef<string>).value.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});
function handleCollapseChange() {
    if (program.value != 'Custom') {
        uploadVariables.value = [
            { label: "$date$", description: computed(() => `表示日期: ${new Date().toLocaleDateString()}`) },
            { label: "$date(yyyy)$", description: computed(() => `表示年: ${new Date().getFullYear()}`) },
            { label: "$date(mm)$", description: computed(() => `表示月: ${new Date().getMonth() + 1}`) },
            { label: "$date(dd)$", description: computed(() => `表示日: ${new Date().getDate()}`) },
            { label: "$date(hh)$", description: computed(() => `表示小时: ${new Date().getHours()}`) },
            { label: "$date(min)$", description: computed(() => `表示分钟: ${new Date().getMinutes()}`) },
            { label: "$date(ss)$", description: computed(() => `表示秒: ${new Date().getSeconds()}`) },
            { label: "$date(ms)$", description: computed(() => `表示毫秒: ${new Date().getMilliseconds()}`) },
            { label: "$date(time)$", description: computed(() => `表示毫秒时间戳: ${new Date().getTime()}`) },
            { label: "$date(Time)$", description: computed(() => `表示秒时间戳: ${Math.floor(new Date().getTime() / 1000)}`) },
            { label: "$uuid$", description: "表示随机生成UUID: 'da957671-ba...'" },
            { label: "$randomNumber(10)$", description: "表示随机生成数字, 10表示字符串长度" },
            { label: "$randomString(10)$", description: "表示随机生成字符串, 10表示字符串长度" },
        ]
    } else {
        uploadVariables.value = [
            { label: "$date$", description: computed(() => `表示日期: ${new Date().toLocaleDateString()}`) },
            { label: "$date(yyyy)$", description: computed(() => `表示年: ${new Date().getFullYear()}`) },
            { label: "$date(mm)$", description: computed(() => `表示月: ${new Date().getMonth() + 1}`) },
            { label: "$date(dd)$", description: computed(() => `表示日: ${new Date().getDate()}`) },
            { label: "$date(hh)$", description: computed(() => `表示小时: ${new Date().getHours()}`) },
            { label: "$date(min)$", description: computed(() => `表示分钟: ${new Date().getMinutes()}`) },
            { label: "$date(ss)$", description: computed(() => `表示秒: ${new Date().getSeconds()}`) },
            { label: "$date(ms)$", description: computed(() => `表示毫秒: ${new Date().getMilliseconds()}`) },
            { label: "$date(time)$", description: computed(() => `表示毫秒时间戳: ${new Date().getTime()}`) },
            { label: "$date(Time)$", description: computed(() => `表示秒时间戳: ${Math.floor(new Date().getTime() / 1000)}`) },
            { label: "$file$", description: "表示上传的文件, FormData格式" },
            { label: "$fileBase64$", description: "表示上传文件, base64格式" },
            { label: "$fileBase64Pure$", description: "表示上传文件, base64格式, 纯净的、没有多余前缀" },
            { label: "$fileName$", description: "表示文件名: 1.png" },
            { label: "$fileSize$", description: "表示文件的大小, 默认byte单位" },
            { label: "$fileSize(KB/MB/GB)$", description: "表示文件的大小,括号内的是单位,只能填写一种" },
            { label: "$fileType$", description: "表示文件的类型, 如image/png" },
            { label: "$uuid$", description: "表示随机生成UUID: 'da957671-ba...'" },
            { label: "$randomNumber(10)$", description: "表示随机生成数字, 10表示字符串长度" },
            { label: "$randomString(10)$", description: "表示随机生成字符串, 10表示字符串长度" },
        ]
    }
}

</script>