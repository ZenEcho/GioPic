<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FieldSchema } from '@/constants/driveSchemas'
import { fetchLskyStrategies, fetchLskyAlbums } from '@/services/uploader'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  schema: FieldSchema[]
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
}>()

const { t } = useI18n()
const message = useMessage()
const strategyOptions = ref<{ label: string, value: string | number }[]>([])
const loadingStrategies = ref(false)
const albumOptions = ref<{ label: string, value: string | number }[]>([])
const loadingAlbums = ref(false)

// Watch for changes in Lsky config to fetch strategies and albums
watch(() => [props.modelValue.type, props.modelValue.apiUrl, props.modelValue.token, props.modelValue.version], async ([type, apiUrl, token, version], oldValue) => {
  const [oldType, oldApiUrl, oldToken, oldVersion] = oldValue || []
  if (type === 'lsky' && apiUrl && token) {
    // Check if relevant fields changed to avoid unnecessary fetches
    if (apiUrl !== oldApiUrl || token !== oldToken || version !== oldVersion) {
        await Promise.all([
          loadStrategies(apiUrl, token, version),
          loadAlbums(apiUrl, token, version)
        ])
    }
  } else {
    strategyOptions.value = []
    albumOptions.value = []
  }
}, { immediate: true })

async function loadStrategies(apiUrl: string, token: string, version: any) {
    loadingStrategies.value = true
    try {
        const strategies = await fetchLskyStrategies(apiUrl, token, version || 'v1')
        strategyOptions.value = strategies.map(s => ({
            label: s.name,
            value: s.id
        }))
        
    } catch (e) {
        // Silent fail or minimal notify
        console.error(e)
    } finally {
        loadingStrategies.value = false
    }
}

async function loadAlbums(apiUrl: string, token: string, version: any) {
    loadingAlbums.value = true
    try {
        const albums = await fetchLskyAlbums(apiUrl, token, version || 'v1')
        albumOptions.value = albums.map(a => ({
            label: a.name,
            value: a.id
        }))
    } catch (e) {
        console.error(e)
    } finally {
        loadingAlbums.value = false
    }
}

// Helper to check if a string is likely a translation key (contains dot)
// If not, return as is. Or we can just try to translate and if key missing, it returns key.
// But some labels might be raw strings like "SecretId".
function getLabel(label: string) {
    if (label.includes('.')) {
        return t(label)
    }
    return label
}

function updateField(key: string, value: any) {
    emit('update:modelValue', {
        ...props.modelValue,
        [key]: value
    })
}

function getKvPairs(jsonStr: string): { key: string, value: string }[] {
    try {
        const parsed = JSON.parse(jsonStr || '[]')
        if (Array.isArray(parsed)) {
            return parsed
        }
        // Fallback for old object format
        return Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }))
    } catch (e) {
        return []
    }
}

function updateKvPairs(key: string, pairs: { key: string, value: string }[]) {
    // Save as array to support empty keys and duplicates during editing
    updateField(key, JSON.stringify(pairs))
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
    <template v-for="field in schema" :key="field.key">
        <n-form-item 
            :label="getLabel(field.label)" 
            :path="field.key"
            :class="{ 'md:col-span-2': field.type === 'textarea' || field.type === 'kv-pairs' }"
        >
        <n-input 
            v-if="field.type === 'text' || field.type === 'password'"
            :value="modelValue[field.key]" 
            @update:value="(val: string | number) => updateField(field.key, val)"
            :type="field.type === 'password' ? 'password' : 'text'"
            :show-password-on="field.type === 'password' ? 'click' : undefined"
            :placeholder="field.placeholder ? (field.placeholder.includes('.') ? t(field.placeholder) : field.placeholder) : ''" 
        />
        <n-select
            v-else-if="field.type === 'select' && field.key !== 'strategyId' && !(field.key === 'albumId' && modelValue.type === 'lsky')"
            :value="modelValue[field.key] || field.defaultValue"
            @update:value="(val: string | number) => updateField(field.key, val)"
            :options="field.options"
        />
        
        <!-- Special handling for strategyId to use fetched options if available and Lsky -->
        <n-select
            v-else-if="field.key === 'strategyId' && modelValue.type === 'lsky'"
            :value="modelValue[field.key]"
            @update:value="(val: string | number) => updateField(field.key, val)"
            :options="strategyOptions"
            :loading="loadingStrategies"
            :placeholder="t('config.form.strategyIdPlaceholder')"
            filterable
            tag
        />

        <!-- Special handling for albumId to use fetched options if available and Lsky -->
        <n-select
            v-else-if="field.key === 'albumId' && modelValue.type === 'lsky'"
            :value="modelValue[field.key]"
            @update:value="(val: string | number) => updateField(field.key, val)"
            :options="albumOptions"
            :loading="loadingAlbums"
            :placeholder="field.placeholder ? (field.placeholder.includes('.') ? t(field.placeholder) : field.placeholder) : ''"
            filterable
            clearable
            tag
        />
        
        <n-input 
            v-else-if="field.key === 'strategyId' && modelValue.type !== 'lsky'"
            :value="modelValue[field.key]" 
            @update:value="(val: string | number) => updateField(field.key, val)"
            :placeholder="field.placeholder ? (field.placeholder.includes('.') ? t(field.placeholder) : field.placeholder) : ''" 
        />

        <n-input
            v-else-if="field.type === 'textarea'"
            :value="modelValue[field.key]"
            @update:value="(val: string | number) => updateField(field.key, val)"
            type="textarea"
            :placeholder="field.placeholder ? (field.placeholder.includes('.') ? t(field.placeholder) : field.placeholder) : ''"
            :autosize="{ minRows: 3, maxRows: 6 }"
        />

        <n-dynamic-input
            v-else-if="field.type === 'kv-pairs'"
            :value="getKvPairs(modelValue[field.key])"
            @update:value="(val: any) => updateKvPairs(field.key, val)"
            preset="pair"
            key-placeholder="Key"
            value-placeholder="Value"
            class="w-full"
        />
        
        <!-- Add other types here if needed, e.g. switch, number -->
        </n-form-item>
    </template>
  </div>
</template>
