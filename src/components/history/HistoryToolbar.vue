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
    <div class="mb-6 flex flex-col md:flex-row gap-4">
        <div class="flex-1 flex gap-2">
            <n-input :value="searchQuery" @update:value="emit('update:searchQuery', $event)"
                :placeholder="t('home.history.searchPlaceholder')" clearable class="flex-1">
                <template #prefix>
                    <div class="i-carbon-search text-gray-400" />
                </template>
            </n-input>
        </div>
        <div class="flex gap-4">
            <n-select :value="filterConfig" @update:value="emit('update:filterConfig', $event)"
                :options="configOptions" clearable :placeholder="t('home.history.filterConfig')" class="w-40" />
            <n-select :value="sortBy" @update:value="emit('update:sortBy', $event)" :options="sortOptions"
                class="w-40" />
        </div>
    </div>
</template>
