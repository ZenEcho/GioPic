<template>
    <n-form :model="formValue" ref="formRef" :rules="rules">
        <n-form-item label="网站域名" path="Host">
            <n-input v-model:value="formValue.Host" placeholder="请输入网站域名" />
            <n-checkbox title="[仅上传生效]使用完整请求地址,不在由扩展拼接" v-model:checked="formValue.fullURL" class="w-[110px] ml-1">
                完整地址
            </n-checkbox>
        </n-form-item>
        <n-form-item label="Token" path="Token">
            <n-input v-model:value="formValue.Token" placeholder="请输入Token" />
        </n-form-item>
        <n-form-item label="相册ID" path="Album">
            <n-input v-model:value="formValue.Album" placeholder="请输入相册ID" />
        </n-form-item>
        <n-form-item label="是否健康" path="Nsfw">
            <n-select v-model:value="formValue.Nsfw" :options="privacyNsfw" placeholder="请选择是否健康" />
        </n-form-item>
        <n-form-item label="删除时间" path="Expiration">
            <n-select v-model:value="formValue.Expiration" :options="expirationOptions" placeholder="请选择存储源" />
        </n-form-item>
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
    Host: '',
    Token: '',
    Album: '',
    Nsfw: 0,
    Expiration: 'NODEL',
    fullURL: false
})


const rules = {
    Host: [
        { required: true, message: '请输入网站域名', trigger: 'blur' }
    ],
    Token: [
        { required: true, message: '请输入Token', trigger: 'blur' }
    ],
    Privacy: [
        { required: true, message: '请选择隐私设置', trigger: 'change' }
    ],
    Expiration: [
        { required: true, message: '请选择删除时间', trigger: 'change' }
    ],
}
const expirationOptions = [
    { value: "NODEL", label: "不删除" },
    { value: "PT5M", label: "5分钟" },
    { value: "PT15M", label: "15分钟" },
    { value: "PT30M", label: "30分钟" },
    { value: "PT1H", label: "1小时" },
    { value: "PT3H", label: "3小时" },
    { value: "PT6H", label: "6小时" },
    { value: "PT12H", label: "12小时" },
    { value: "P1D", label: "1天" },
    { value: "P2D", label: "2天" },
    { value: "P3D", label: "3天" },
    { value: "P4D", label: "4天" },
    { value: "P5D", label: "5天" },
    { value: "P6D", label: "6天" },
    { value: "P1W", label: "1周" },
    { value: "P2W", label: "2周" },
    { value: "P3W", label: "3周" },
    { value: "P1M", label: "1个月" },
    { value: "P2M", label: "2个月" },
    { value: "P3M", label: "3个月" },
    { value: "P4M", label: "4个月" },
    { value: "P5M", label: "5个月" },
    { value: "P6M", label: "6个月" },
    { value: "P1Y", label: "1年" },

]

const privacyNsfw = [
    { label: '健康', value: 0 },
    { label: '不良', value: 1 },
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
