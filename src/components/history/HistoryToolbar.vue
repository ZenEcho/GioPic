<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'

defineProps<{
    searchQuery: string
    filterConfig: string | null
    sortBy: string
    configOptions: SelectOption[]
    sortOptions: SelectOption[]
}>()

const emit = defineEmits<{
    (e: 'update:searchQuery', value: string): void
    (e: 'update:filterConfig', value: string | null): void
    (e: 'update:sortBy', value: string): void
}>()

const { t } = useI18n()
</script>

<template>
    <div class="mb-6 flex flex-col md:flex-row gap-3">
        <div class="flex-1 flex gap-2">
            <n-input 
                :value="searchQuery" 
                @update:value="emit('update:searchQuery', $event)"
                :placeholder="t('home.history.searchPlaceholder')" 
                clearable 
                size="large"
                class="flex-1 rounded-xl shadow-sm border-0"
            >
                <template #prefix>
                    <div class="i-ph-magnifying-glass text-gray-400 text-lg" />
                </template>
            </n-input>
        </div>
        <div class="flex gap-3">
            <n-select 
                :value="filterConfig" 
                @update:value="emit('update:filterConfig', $event)"
                :options="configOptions" 
                clearable 
                size="large"
                :placeholder="t('home.history.filterConfig')" 
                class="w-full md:w-48" 
            />
            <n-select 
                :value="sortBy" 
                @update:value="emit('update:sortBy', $event)" 
                :options="sortOptions"
                size="large"
                class="w-full md:w-48" 
            />
        </div>
    </div>
</template>
