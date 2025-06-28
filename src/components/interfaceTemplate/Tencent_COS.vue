<template>
    <n-form :model="formValue" ref="formRef" :rules="rules">

        <n-form-item label="SecretId" path="SecretId">
            <n-input v-model:value="formValue.SecretId" placeholder="请输入SecretId" />
        </n-form-item>
        <n-form-item label="SecretKey" path="SecretKey">
            <n-input v-model:value="formValue.SecretKey" placeholder="请输入SecretKey" />
        </n-form-item>
        <n-form-item label="Bucket" path="Bucket">
            <n-input v-model:value="formValue.Bucket" placeholder="请输入Bucket" />
        </n-form-item>

        <n-form-item label="AppId" path="AppId">
            <n-input v-model:value="formValue.AppId" placeholder="请输入AppId" />
        </n-form-item>

        <n-form-item label="Region" path="Region">
            <n-input v-model:value="formValue.Region" placeholder="请输入Region" />
        </n-form-item>

        <n-form-item label="上传路径" path="UploadPath">
            <n-input v-model:value="formValue.UploadPath" placeholder="请输入上传路径" />
        </n-form-item>
        <n-form-item label="自定义域名" path="custom_DomainName">
            <n-input v-model:value="formValue.custom_DomainName" placeholder="请输入自定义域名" />
        </n-form-item>
        <Searchkeyword />
        <n-form-item>
            <n-button type="primary" @click="handleSubmit">提交</n-button>
        </n-form-item>
    </n-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui';
import type { FormValidationError, FormInst } from 'naive-ui';
const message = useMessage();
const formRef = ref<FormInst | null>(null)

const formValue = ref({
    SecretId: '',
    SecretKey: '',
    Bucket: '',
    AppId: '',
    Region: '',
    UploadPath: '$date$',
    custom_DomainName: '',
})

const rules = {
    SecretId: [
        { required: true, message: '请输入SecretId', trigger: 'blur' }
    ],
    SecretKey: [
        { required: true, message: '请输入SecretKey', trigger: 'blur' }
    ],
    Bucket: [
        { required: true, message: '请输入Bucket', trigger: 'blur' }
    ],
    Region: [
        { required: true, message: '请输入Region', trigger: 'blur' }
    ],
}

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
        const filteredNewVal = Object.keys(formValue.value).reduce<Record<string, any>>((acc, key) => {
            if (newVal.hasOwnProperty(key)) {
                acc[key] = newVal[key];
            }
            return acc;
        }, {});
        Object.assign(formValue.value, filteredNewVal);
    }
}, { immediate: true });

</script>