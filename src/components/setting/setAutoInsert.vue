<template>
    <n-modal class="w-[700px]" preset="card" title="设置自动插入" :bordered="false">
        <!-- 自动插入开关 -->
        <div class="flex flex-row items-center py-2 ">
            <div class="items-center flex">
                <span class="text-base mr-2">自动插入</span>
                <n-switch v-model:value="props.uploadFunctionSettings.autoInsert"
                    @update:value="handleUpdate('autoInsert', $event)" />

            </div>
            <!-- 重置数据 -->
            <div class="ml-4 items-center flex">
                <span class="text-base mr-2">重置数据</span>
                <n-button type="error" size="small" @click="() => resetData()">
                    重置
                </n-button>

            </div>
        </div>

        <!-- 数据表 -->
        <n-table :bordered="false" :single-line="false" class="">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>域名</th>
                    <th>插入类型</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(data, index) in configData" :key="data.id">
                    <!-- ID -->
                    <td width="100px">
                        {{ data.id }}
                    </td>

                    <!-- 域名 -->
                    <td>
                        <span v-if="!isEditing || editingIndex !== index">{{ data.host }}</span>
                        <n-input v-else v-model:value="data.host" type="text" placeholder="输入域名" />
                    </td>

                    <!-- 插入类型选择 -->
                    <td>
                        <n-select class="min-w-[100px]" :disabled="!isEditing || editingIndex !== index"
                            v-model:value="data.type"
                            @update:value="(newValue) => handleValueChange(index, newValue)" :options="options" />
                    </td>

                    <!-- 操作按钮 -->
                    <td>
                        <!-- 编辑按钮 -->
                        <n-button v-if="!isEditing || editingIndex !== index" class="mr-1" type="info" size="small"
                            @click="startEditing(index)">
                            编辑
                        </n-button>

                        <!-- 保存按钮 -->
                        <n-button v-if="isEditing && editingIndex === index" class="mr-1" type="success" size="small"
                            @click="saveChanges()">
                            保存
                        </n-button>

                        <!-- 删除按钮 -->
                        <n-button class="ml-1" type="error" size="small" @click="deleteEntry(index)">
                            删除
                        </n-button>
                    </td>
                </tr>

                <!-- 添加新条目行 -->
                <tr>
                    <td>
                        {{ configData.length + 1 }}
                    </td>

                    <!-- 可编辑域名 -->
                    <td>
                        <n-input v-model:value="newData.host" type="text" placeholder="输入域名" />
                    </td>

                    <!-- 插入类型选择 -->
                    <td>
                        <n-select class="min-w-[100px]" v-model:value="newData.type" :options="options" />
                    </td>

                    <!-- 操作按钮 -->
                    <td>
                        <!-- 添加按钮 -->
                        <n-button type="success" size="small" @click="addEntry">
                            添加
                        </n-button>
                    </td>
                </tr>
            </tbody>
        </n-table>
    </n-modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useLocalStorage } from '@/stores/useLocalStorage';
import { useMessage } from "naive-ui";

// 插入类型选项
const options: Array<{ label: string; value: string }> = [
    { label: "Discuz", value: "Discuz" },
    { label: "Halo", value: "Halo" },
    { label: "Typecho", value: "Typecho" },
    { label: "phpBB", value: "phpBB" },
    { label: "V2EX", value: "V2EX" },
    { label: "nodeseek", value: "nodeseek" },
    { label: "lowendtalk", value: "lowendtalk" },
    { label: "CodeMirror5", value: "CodeMirror5" },
    { label: "CodeMirror6", value: "CodeMirror6" },
    { label: "GutenbergEditor", value: "GutenbergEditor" },
    { label: "TinyMCE", value: "TinyMCE" },
    { label: "CKEditor4", value: "CKEditor4" },
    { label: "CKEditor5", value: "CKEditor5" },
    { label: "UEditor", value: "UEditor" },
];



interface configDataType {
    id: number;
    host: string;
    type: string;
}

// 配置数据
const configData = ref<configDataType[]>([]);

const newData = ref<configDataType>({
    id: 0,
    host: '',
    type: options[0].value
});

const isEditing = ref(false);
const editingIndex = ref(-1);

// 消息提示实例
const message = useMessage();

// 父组件传入的 props
const props = defineProps({
    uploadFunctionSettings: {
        type: Object,
        required: true,
    },
});

// 事件发射
const emit = defineEmits(["saveUpdate"]);

// 加载初始数据
useLocalStorage.get("InsertionEditorType").then((res) => {
    // 确保 res 是数组格式，如果不是则初始化为空数组
    if (Array.isArray(res)) {
        configData.value = res;
    } else if (res && typeof res === 'object') {
        // 如果是对象，尝试转换为数组
        configData.value = Object.values(res);
    } else {
        // 如果是 null、undefined 或其他类型，初始化为空数组
        configData.value = [];
    }
});

// 开关自动插入
const handleUpdate = (key: string, value: boolean): void => {
    emit("saveUpdate", key, value);
};

// 修改插入类型（value）
const handleValueChange = (index: number, newValue: string): void => {
    if (configData.value[index]) {
        configData.value[index].type = newValue;
    }
};

// 开始编辑
const startEditing = (index: number): void => {
    isEditing.value = true;
    editingIndex.value = index;
};

// 添加新条目
const addEntry = (): void => {
    if (newData.value.host === '') {
        message.error("域名不能为空");
        return;
    }

    // 检查重复
    if (configData.value.some(item => item.host === newData.value.host)) {
        message.error("域名已存在");
        return;
    }

    // 生成新的ID
    const newId = configData.value.length > 0
        ? Math.max(...configData.value.map(item => item.id)) + 1
        : 1;

    // 添加新条目
    configData.value.push({
        id: newId,
        host: newData.value.host,
        type: newData.value.type
    });
    console.log(configData.value);

    // 保存到本地存储
    useLocalStorage.set("InsertionEditorType", configData.value).then(() => {
        message.success("添加完成");
        // 重置新数据
        newData.value = {
            id: 0,
            host: '',
            type: options[0].value
        };
    });
};

// 保存修改
const saveChanges = (): void => {
    const editingItem = configData.value[editingIndex.value];
    if (!editingItem || editingItem.host === '') {
        message.error("域名不能为空");
        return;
    }

    // 检查重复（排除当前编辑项）
    const isDuplicate = configData.value.some((item, index) =>
        index !== editingIndex.value && item.host === editingItem.host
    );

    if (isDuplicate) {
        message.error("域名已存在");
        return;
    }

    isEditing.value = false;
    editingIndex.value = -1;

    useLocalStorage.set("InsertionEditorType", configData.value).then(() => {
        message.success("修改已保存");
    });
};

// 删除条目
const deleteEntry = (index: number): void => {
    configData.value.splice(index, 1);
    useLocalStorage.set("InsertionEditorType", configData.value).then(() => {
        message.success("条目已删除");
    });
};

// 重置数据
const resetData = (): void => {
    useLocalStorage.set("InsertionEditorType", []).then(() => {
        configData.value = [];
        message.success("数据已重置");
    });
};
</script>