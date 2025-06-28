<template>
    <!-- <n-marquee>
        <n-h2 class="text-red-500">
            采用S3接口配置,理论上支持市面上所有支持S3接口的对象存储
        </n-h2>
    </n-marquee> -->
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
        <n-form-item label="Region" path="Region">
            <n-input v-model:value="formValue.Region" placeholder="请输入Region" />
        </n-form-item>
        <n-form-item label="Endpoint(S3 接口兼容必填)" path="Endpoint">
            <n-input v-model:value="formValue.Endpoint" placeholder="请输入Endpoint" />
        </n-form-item>
        <n-form-item label="ACL(访问策略)" path="ACL">
            <div v-if="program != 'AWS_S3'" class=" w-full flex flex-row  items-center">
                <n-select v-model:value="formValue.ACL" :options="ACLOptions" placeholder="选择ACL"
                    :loading="loading.AclLoading" />
                <n-button strong secondary class="i-ph-cloud-arrow-up h-6 w-6" title="推送到云"
                    @click="putBucketAcl"></n-button>
            </div>
            <div v-else class=" w-full">
                <n-input v-model:value="formValue.ACL" placeholder="请输入ACL" />
            </div>
        </n-form-item>
        <n-form-item label="上传路径" path="UploadPath">
            <n-input v-model:value="formValue.UploadPath" placeholder="请输入上传路径" />
        </n-form-item>
        <n-form-item label="自定义域名(S3 接口兼容必填)" path="custom_DomainName">
            <n-input v-model:value="formValue.custom_DomainName" placeholder="请输入自定义域名" />
        </n-form-item>
        <Searchkeyword />
        <n-form-item>
            <n-button type="primary" @click="handleSubmit">提交</n-button>
        </n-form-item>
    </n-form>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui';

import { useRoute } from 'vue-router';
import { GetBucketAclCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { COS_Client, OSS_Client, S3_Client } from '@/utils/authObjStorage';
import type COS from 'cos-js-sdk-v5'
import type OSS from 'ali-oss'
import type { S3Client } from "@aws-sdk/client-s3"
import type { FormValidationError, FormInst } from 'naive-ui';
const route = useRoute();
const message = useMessage();
const formRef = ref<FormInst | null>(null)
const loading = ref({
    AclLoading: false,
    CorsLoading: false,
})
// 统一处理路由参数
const program = computed(() => {
    const hashParam = route.hash ? route.hash.split('=')[1] : '';
    return hashParam || '';
});

const formValue = ref({
    SecretId: '',
    SecretKey: '',
    Bucket: '',
    Endpoint: '',
    Region: '',
    ACL: 'public-read',
    UploadPath: '$date$',
    custom_DomainName: '',
})
const ACLOptions = [
    { label: '[1]私有写&私有读', value: "private" },
    { label: '[2]私有写&公有读', value: "public-read" },
    { label: '[3]公有写&公有读', value: "public-read-write" },
]
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
async function GetBucketAcl() {
    if (!formValue.value.SecretId || !formValue.value.SecretKey || !formValue.value.Bucket || !formValue.value.Region) {
        return;
    }
    loading.value.AclLoading = true;
    if (program.value == 'Tencent_COS') {
        const client = await COS_Client({ data: formValue.value }) as COS;
        client.getBucketAcl({
            Bucket: formValue.value.Bucket,
            Region: formValue.value.Region
        }).then((result) => {
            formValue.value.ACL = result.ACL || 'public-read';;
        }).finally(() => {
            loading.value.AclLoading = false;
        });

    } else if (program.value == 'Aliyun_OSS' && formValue.value.Region.startsWith('oss-')) {
        const client = await OSS_Client({ data: formValue.value }) as OSS;
        client.getBucketACL(formValue.value.Bucket).then((result) => {
            formValue.value.ACL = result.acl || 'public-read';
        }).finally(() => {
            loading.value.AclLoading = false;
        });


    }

}
async function putBucketAcl() {
    if (!formValue.value.SecretId || !formValue.value.SecretKey || !formValue.value.Bucket || !formValue.value.Region) {
        return;
    }
    loading.value.AclLoading = true;
    if (program.value == 'Tencent_COS') {
        const client = await COS_Client({ data: formValue.value }) as COS;
        client.putBucketAcl({
            Bucket: formValue.value.Bucket,
            Region: formValue.value.Region,
            ACL: formValue.value.ACL as 'private' | 'public-read' | 'public-read-write'
        }).then(() => {
            message.success('同步成功');
        }).catch((err) => {
            message.error('同步失败');
            console.log(err);

        }).finally(() => {
            loading.value.AclLoading = false;
        });

    } else if (program.value == 'Aliyun_OSS' && formValue.value.Region.startsWith('oss-')) {
        const client = await OSS_Client({ data: formValue.value }) as OSS;
        client.putBucketACL(formValue.value.Bucket, formValue.value.ACL as 'private' | 'public-read' | 'public-read-write').then(() => {
            message.success('同步成功');
        }).catch((err) => {
            message.error('同步失败');
            console.log(err);
        }).finally(() => {
            loading.value.AclLoading = false;
        });

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
// 加载完毕
onMounted(() => {
    // 等待2秒运行
    setTimeout(() => {
        GetBucketAcl();
    }, 1000);
    window.addEventListener('readApplicationMenu', GetBucketAcl); // 刷新菜单的时候，请求Acl配置
})

</script>