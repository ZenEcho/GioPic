<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { AliyunConfig, TencentConfig, S3Config } from '@/types'
import { 
    getAliyunAcl, setAliyunAcl, 
    getTencentAcl, setTencentAcl,
    getS3Acl, setS3Acl,
    type AclType
} from '@/services/bucket'

const props = defineProps<{
    config: AliyunConfig | TencentConfig | S3Config
    type: 'aliyun' | 'tencent' | 'aws'
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const acl = ref<string>('default')

const aclOptions = computed(() => {
    const opts = [
        { label: t('config.acl.options.default'), value: 'default' },
        { label: t('config.acl.options.private'), value: 'private' },
        { label: t('config.acl.options.publicRead'), value: 'public-read' },
        { label: t('config.acl.options.publicReadWrite'), value: 'public-read-write' },
    ]

    // S3 supports authenticated-read
    if (props.type === 'aws') {
        opts.push({ label: t('config.acl.options.authenticatedRead'), value: 'authenticated-read' })
    }
    
    return opts
})

const typeName = computed(() => t(`providers.${props.type}`))

async function handleGetAcl() {
    loading.value = true
    try {
        let result = 'default'
        if (props.type === 'aliyun') {
            result = await getAliyunAcl(props.config as AliyunConfig)
        } else if (props.type === 'tencent') {
            result = await getTencentAcl(props.config as TencentConfig)
        } else if (props.type === 'aws') {
            result = await getS3Acl(props.config as S3Config)
        }
        
        acl.value = result
        message.success(t('common.success'))
    } catch (e: any) {
        console.error(e)
        message.error(e.message || t('config.acl.getFailed'))
    } finally {
        loading.value = false
    }
}

async function handleSetAcl() {
    loading.value = true
    try {
        if (props.type === 'aliyun') {
            await setAliyunAcl(props.config as AliyunConfig, acl.value)
        } else if (props.type === 'tencent') {
            await setTencentAcl(props.config as TencentConfig, acl.value)
        } else if (props.type === 'aws') {
            await setS3Acl(props.config as S3Config, acl.value)
        }
        message.success(t('common.success'))
    } catch (e: any) {
        console.error(e)
        message.error(e.message || t('config.acl.setFailed'))
    } finally {
        loading.value = false
    }
}

</script>

<template>
    <div class="mt-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
        <h3 class="text-base font-medium mb-4 flex items-center gap-2">
            {{ t('config.acl.title', { type: typeName }) }}
            <n-tooltip trigger="hover">
                <template #trigger>
                    <div class="i-carbon-help text-gray-400 cursor-pointer"></div>
                </template>
                {{ t('config.acl.desc') }}
            </n-tooltip>
        </h3>
        
        <n-form-item :label="t('config.acl.permission')" label-placement="left" :show-feedback="false" class="mb-4">
             <n-select v-model:value="acl" :options="aclOptions" />
        </n-form-item>

        <div class="flex gap-2 justify-end">
             <n-button secondary type="info" @click="handleGetAcl" :loading="loading">
                {{ t('config.acl.get') }}
            </n-button>
            <n-button type="success" @click="handleSetAcl" :loading="loading">
                {{ t('config.acl.set') }}
            </n-button>
        </div>
    </div>
</template>
