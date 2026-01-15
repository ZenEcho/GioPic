<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { AliyunConfig, TencentConfig, S3Config } from '@/types'
import { 
    getAliyunCors, setAliyunCors, 
    getTencentCors, setTencentCors, 
    getS3Cors, setS3Cors,
    type CorsRule
} from '@/services/bucket'

const props = defineProps<{
    config: AliyunConfig | TencentConfig | S3Config
    type: 'aliyun' | 'tencent' | 'aws'
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)

const titleType = computed(() => {
    switch (props.type) {
        case 'aliyun': return 'Aliyun'
        case 'tencent': return 'Tencent'
        case 'aws': return 'S3'
        default: return ''
    }
})

// We maintain a single rule for simplicity as per UI screenshot, 
// but backend supports array. We'll just edit the first rule or create one.
const formModel = ref({
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST'],
    allowedHeaders: '*',
    exposeHeaders: 'ETag,Content-Length,Content-Type,Content-Disposition',
    maxAgeSeconds: 600
})

// Methods options
const methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'HEAD', value: 'HEAD' }
]

async function handleGetCors() {
    loading.value = true
    try {
        let rules: CorsRule[] = []
        if (props.type === 'aliyun') {
            rules = await getAliyunCors(props.config as AliyunConfig)
        } else if (props.type === 'tencent') {
            rules = await getTencentCors(props.config as TencentConfig)
        } else if (props.type === 'aws') {
            rules = await getS3Cors(props.config as S3Config)
        }

        if (rules && rules.length > 0) {
            const rule = rules[0]
            formModel.value = {
                allowedOrigins: rule?.allowedOrigins?.join(',') ?? '*',
                allowedMethods: rule && rule.allowedMethods ? rule.allowedMethods : ['GET', 'POST'],
                allowedHeaders: rule?.allowedHeaders?.join(',') ?? '*',
                exposeHeaders: rule?.exposeHeaders?.join(',') ?? 'ETag,Content-Length,Content-Type,Content-Disposition',
                maxAgeSeconds: rule?.maxAgeSeconds ?? 600
            }
            message.success(t('common.success'))
        } else {
            message.info(t('config.cors.noConfig'))
        }
    } catch (e: any) {
        console.error(e)
        message.error(e.message || t('config.cors.getFailed'))
    } finally {
        loading.value = false
    }
}

async function handleSetCors() {
    loading.value = true
    try {
        const rule: CorsRule = {
            allowedOrigins: formModel.value.allowedOrigins.split(',').map(s => s.trim()).filter(Boolean),
            allowedMethods: formModel.value.allowedMethods,
            allowedHeaders: formModel.value.allowedHeaders.split(',').map(s => s.trim()).filter(Boolean),
            exposeHeaders: formModel.value.exposeHeaders.split(',').map(s => s.trim()).filter(Boolean),
            maxAgeSeconds: Number(formModel.value.maxAgeSeconds)
        }

        const rules = [rule]

        if (props.type === 'aliyun') {
            await setAliyunCors(props.config as AliyunConfig, rules)
        } else if (props.type === 'tencent') {
            await setTencentCors(props.config as TencentConfig, rules)
        } else if (props.type === 'aws') {
            await setS3Cors(props.config as S3Config, rules)
        }

        message.success(t('common.success'))
    } catch (e: any) {
        console.error(e)
        message.error(e.message || t('config.cors.setFailed'))
    } finally {
        loading.value = false
    }
}

function handleReset() {
    formModel.value = {
        allowedOrigins: '*',
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: '*',
        exposeHeaders: 'ETag,Content-Length,Content-Type,Content-Disposition',
        maxAgeSeconds: 600
    }
}
</script>

<template>
    <div class="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            {{ t('config.cors.title', { type: titleType }) }}
            <n-tooltip trigger="hover">
                <template #trigger>
                    <div class="i-ph-question text-gray-400 cursor-pointer text-xs"></div>
                </template>
                {{ t('config.cors.desc') }}
            </n-tooltip>
        </h3>
        
        <div class="space-y-3">
            <n-form-item :label="t('config.cors.allowedOrigins')" label-placement="top" :show-feedback="false">
                <n-input v-model:value="formModel.allowedOrigins" :placeholder="t('config.cors.allowedOriginsPlaceholder')" />
            </n-form-item>

            <n-form-item :label="t('config.cors.allowedMethods')" label-placement="top" :show-feedback="false">
                <n-checkbox-group v-model:value="formModel.allowedMethods">
                    <n-space>
                        <n-checkbox v-for="opt in methodOptions" :key="opt.value" :value="opt.value" :label="opt.label" />
                    </n-space>
                </n-checkbox-group>
            </n-form-item>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <n-form-item :label="t('config.cors.allowedHeaders')" label-placement="top" :show-feedback="false">
                    <n-input v-model:value="formModel.allowedHeaders" :placeholder="t('config.cors.allowedHeadersPlaceholder')" />
                </n-form-item>

                <n-form-item :label="t('config.cors.exposeHeaders')" label-placement="top" :show-feedback="false">
                    <n-input v-model:value="formModel.exposeHeaders" :placeholder="t('config.cors.exposeHeadersPlaceholder')" />
                </n-form-item>
            </div>

            <n-form-item :label="t('config.cors.maxAgeSeconds')" label-placement="top" :show-feedback="false">
                <n-input-number v-model:value="formModel.maxAgeSeconds" :min="0" class="w-full md:w-1/2" />
            </n-form-item>
        </div>

        <div class="flex gap-2 justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/50">
             <button @click="handleGetCors" :disabled="loading"
                class="giopic-link-btn px-3 h-8 text-xs font-bold rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1">
                <div class="i-ph-cloud-arrow-down" />
                {{ t('config.cors.get') }}
            </button>
            <button @click="handleSetCors" :disabled="loading"
                class="giopic-link-btn px-3 h-8 text-xs font-bold rounded bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors flex items-center gap-1">
                <div class="i-ph-cloud-arrow-up" />
                {{ t('config.cors.set') }}
            </button>
            <button @click="handleReset"
                class="giopic-link-btn px-3 h-8 text-xs font-bold rounded border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                {{ t('config.cors.reset') }}
            </button>
        </div>
    </div>
</template>
