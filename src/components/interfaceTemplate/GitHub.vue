<template>
    <n-form :model="formValue" ref="formRef" :rules="rules">
        <n-form-item label="所有者" path="Owner">
            <n-input v-model:value="formValue.Owner" placeholder="请输入所有者" />
        </n-form-item>
        <n-form-item label="仓库" path="Repository">
            <n-input v-model:value="formValue.Repository" placeholder="请输入仓库" />
        </n-form-item>
        <n-form-item label="Token" path="Token">
            <n-input v-model:value="formValue.Token" placeholder="请输入Token" />
        </n-form-item>
        <n-form-item label="上传路径" path="UploadPath">
            <n-input v-model:value="formValue.UploadPath" placeholder="请输入上传路径" />
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
    Owner: '',
    Repository: '',
    Token: '',
    UploadPath: '$date$'
})

const rules = {
    Owner: [
        { required: true, message: '请输入所有者', trigger: 'blur' }
    ],
    Repository: [
        { required: true, message: '请输入仓库', trigger: 'blur' }
    ],
    Token: [
        { required: true, message: '请输入Token', trigger: 'blur' }
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