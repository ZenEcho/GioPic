<template>

    <n-form :model="formValue" ref="formRef">
        <!-- URL 地址 -->
        <n-form-item label="请求地址">
            <n-input type="text" v-model:value="formValue.Url" placeholder="请输入请求 URL" />
        </n-form-item>

        <!-- 请求方法 -->
        <n-form-item label="请求方法">
            <n-select v-model:value="formValue.method" :options="method" placeholder="请选择请求方法">

            </n-select>
        </n-form-item>

        <!-- Tabs for Params, Headers, Body, Auth -->
        <n-tabs v-model:value="activeTab">
            <!-- Params Tab -->
            <n-tab-pane name="params" tab="Params">
                <n-form-item label="请求参数">
                    <n-dynamic-input v-model:value="formValue.params" preset="pair" key-placeholder="Key"
                        value-placeholder="Value" />
                </n-form-item>
            </n-tab-pane>

            <!-- Headers Tab -->
            <n-tab-pane name="headers" tab="Headers">
                <n-form-item label="Headers">
                    <n-dynamic-input v-model:value="formValue.headers" preset="pair" key-placeholder="Header Name"
                        value-placeholder="Header Value" />
                </n-form-item>
            </n-tab-pane>

            <!-- Body Tab -->
            <n-tab-pane name="body" tab="Body">
                <!-- Body Type Selection -->
                <n-form-item label="Body 类型">
                    <n-radio-group v-model:value="formValue.bodyType">
                        <n-radio value="none">None</n-radio>
                        <!-- String -->
                        <n-radio value="string">String</n-radio>
                        <!-- json -->
                        <n-radio value="json">JSON</n-radio>
                        <!-- Form Data -->
                        <n-radio value="form-data">Form Data</n-radio>
                    </n-radio-group>
                </n-form-item>

                <!-- Body Content -->
                <n-form-item label="Body" v-if="formValue.bodyType !== 'none'">
                    <n-dynamic-input v-model:value="formValue.body" preset="pair" key-placeholder="Body Name"
                        value-placeholder="Body Value" />
                </n-form-item>
            </n-tab-pane>

            <!-- Auth Tab -->
            <n-tab-pane name="auth" tab="Auth">
                <n-form-item label="认证类型">
                    <n-select v-model:value="formValue.authType" :options="authType" placeholder="请选择认证类型">
                    </n-select>
                </n-form-item>

                <!-- Basic Auth Inputs -->
                <n-form-item v-if="formValue.authType === 'basic'" label="用户名">
                    <n-input v-model:value="formValue.authUsername" placeholder="请输入用户名" />
                </n-form-item>
                <n-form-item v-if="formValue.authType === 'basic'" label="密码">
                    <n-input v-model:value="formValue.authPassword" type="password" placeholder="请输入密码" />
                </n-form-item>

                <!-- Bearer Token Input -->
                <n-form-item v-if="formValue.authType === 'bearer'" label="Token">
                    <n-input type="text" v-model:value="formValue.authToken" placeholder="请输入 Token" />
                </n-form-item>

                <!-- API Key Input -->
                <n-form-item v-if="formValue.authType === 'apiKey'" label="API Key">
                    <n-input type="text" v-model:value="formValue.authApiKey" placeholder="请输入 API Key" />
                </n-form-item>
            </n-tab-pane>
            <n-tab-pane name="keyReplace" tab="关键词替换">
                <n-form-item label="上传完成:关键词替换">
                    <n-dynamic-input v-model:value="formValue.keyReplace" preset="pair" key-placeholder="关键词"
                        value-placeholder="替换词" />
                </n-form-item>
            </n-tab-pane>
        </n-tabs>
        <!-- 字词拼接 -->
        <div class="flex  flex-row">
            <n-form-item label="前缀词拼接" style="width: 50%; margin-right: 4px;">
                <n-input v-model:value="formValue.responseAppend"
                    placeholder="如:在上传完成的信息,前缀增加一个地址https://www.google.com/" />
            </n-form-item>
            <n-form-item label="后缀词拼接" style="width: 50%; margin-left: 4px;">
                <n-input v-model:value="formValue.responsePrefix" placeholder="如，上传完成的信息：后缀增加内容" />
            </n-form-item>
        </div>
        <!-- 响应类型 -->
        <n-form-item label="上传完成:响应类型">
            <n-select v-model:value="formValue.responseType" :options="responseTypes" placeholder="请选择响应类型">
            </n-select>
        </n-form-item>
        <!-- 返回路径 -->
        <n-form-item label="上传完成:数据路径">
            <n-input v-model:value="formValue.responsePath" placeholder="请输入返回路径，如：data.image.Url" />
        </n-form-item>
        <Searchkeyword />
        <!-- 提交按钮 -->
        <n-form-item>
            <n-button type="primary" @click="handleSubmit">提交</n-button>
        </n-form-item>

    </n-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { FormValidationError, FormInst } from 'naive-ui';
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const activeTab = ref('params')
const formValue = ref({
    Url: '',
    method: 'POST',
    params: [], // 请求参数
    headers: [],
    bodyType: 'none',
    body: [],
    authType: "none",
    authUsername: '',
    authPassword: '',
    authToken: '',
    authApiKey: '',
    keyReplace: [], // 关键词替换
    responseAppend: '', // 前缀
    responsePrefix: '', // 后缀
    responseType: 'json',
    responsePath: '',
})

const method = [{
    value: 'GET',
    label: 'GET'
}, {
    value: 'POST',
    label: 'POST'
}, {
    value: 'PUT',
    label: 'PUT'
}, {
    value: 'DELETE',
    label: 'DELETE'
}, {
    value: 'PATCH',
    label: 'PATCH'
}, {
    value: 'OPTIONS',
    label: 'OPTIONS'
}, {
    value: 'HEAD',
    label: 'HEAD'

}]
const authType = [
    {
        value: 'none',
        label: 'None'
    },
    {
        value: 'basic',
        label: 'Basic Auth'
    },
    {
        value: 'bearer',
        label: 'Bearer Token'
    },
    {
        value: 'apiKey',
        label: 'API Key'
    }]
const responseTypes = [
    { value: 'json', label: 'JSON' },
    { value: 'text', label: 'Text' },
    { value: 'blob', label: 'Blob' },
    { value: 'arrayBuffer', label: 'ArrayBuffer' },
    { value: 'document', label: 'Document' }
]



const emit = defineEmits(['submit'])
function handleSubmit() {
    if (formRef.value) {
        formRef.value.validate((errors: Array<FormValidationError> | undefined) => {
            if (!errors) {
                emit('submit', formValue.value)
                message.success('提交成功');
            }
            else {
                message.error('请检查表单填写是否正确');
            }
        })
    } else {
        message.error('表单引用不存在');
    }
}
const props = defineProps(['initialFormValue']);
watch(() => props.initialFormValue, (newVal) => {
    if (newVal) {
        if (typeof newVal === 'string') {
            try {
                newVal = JSON.parse(newVal);
            } catch (e) {
                console.error("initialFormValue不是有效的JSON字符串", e);
                return;
            }
        }
        // 过滤新数据，只保留 formValue 中已有的字段
        const filteredNewVal = Object.keys(formValue.value).reduce<typeof formValue.value>((acc, key) => {
            if (newVal.hasOwnProperty(key)) {
                acc[key as keyof typeof formValue.value] = newVal[key];
            }
            return acc;
        }, {} as typeof formValue.value);

        // 更新 body 和 headers 数据
        if (newVal.body) {
            filteredNewVal.body = Object.values(newVal.body);
        }
        if (newVal.headers) {
            filteredNewVal.headers = Object.values(newVal.headers);
        }
        // 更新 params 数据
        if (newVal.params) {
            filteredNewVal.params = Object.values(newVal.params);
        }
        Object.assign(formValue.value, filteredNewVal);
    }
}, { immediate: true });
</script>
