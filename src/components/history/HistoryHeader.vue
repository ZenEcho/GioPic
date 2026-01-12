<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { COPY_FORMATS, FORMAT_LABELS } from '@/utils/common'

defineProps<{
    isBatchMode: boolean
    isAllSelected: boolean
    copyFormat: string
}>()

const emit = defineEmits<{
    (e: 'update:copyFormat', value: string): void
    (e: 'toggleBatchMode'): void
    (e: 'toggleSelectAll'): void
}>()

const { t } = useI18n()
const router = useRouter()
const themeStore = useThemeStore()

const primaryColor = computed(() => themeStore.themeOverrides?.common?.primaryColor || '#409eff')
const primaryColorSuppl = computed(() => themeStore.themeOverrides?.common?.primaryColorSuppl || '#ecf5ff')
const primaryColorHover = computed(() => themeStore.themeOverrides?.common?.primaryColorHover || '#66b1ff')
</script>

<template>
    <div class="flex justify-between mb-6 flex-col md:flex-row md:items-center">
        <div class="flex items-center gap-4">
            <button
                class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                @click="router.back()">
                <div class="i-carbon-arrow-left text-xl text-gray-600 dark:text-gray-300" />
            </button>
            <div class="text-2xl font-black italic text-gray-800 dark:text-white">{{ t('home.history.title') }}</div>
        </div>
        <div class="flex items-center gap-2 p-1 md:mt-0 mt-2">
            <!-- Copy Format Selector -->
            <div class="flex flex-row w-fit bg-white dark:bg-gray-800 rounded-lg text-xs font-bold shadow-sm">
                <button v-for="fmt in COPY_FORMATS" :key="fmt"
                    class="px-3 py-1.5 rounded-md transition-all uppercase bg-transparent"
                    :class="copyFormat === fmt ? 'bg-primary text-white shadow-sm' : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'"
                    @click="emit('update:copyFormat', fmt)">
                    {{ fmt === 'markdown' ? 'MD' : FORMAT_LABELS[fmt] || fmt }}
                </button>
            </div>
            <div class="flex items-center gap-1">
                <button v-if="isBatchMode"
                    class="px-3 h-8 rounded-lg border transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    :class="isAllSelected ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary'"
                    @click="emit('toggleSelectAll')">
                    <div class="i-carbon-checkmark-outline text-lg"
                        :class="{ 'opacity-100': isAllSelected, 'opacity-50': !isAllSelected }" />
                    <span class="text-xs font-bold hidden sm:inline">{{ isAllSelected ? t('home.history.deselectAll') : t('home.history.selectAll') }}</span>
                </button>
                <button
                    class="px-3 h-8 rounded-lg border transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    :class="isBatchMode ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary'"
                    @click="emit('toggleBatchMode')">
                    <div class="i-carbon-list-boxes text-lg" />
                    <span class="text-xs font-bold hidden sm:inline">{{ isBatchMode ? t('home.history.cancelBatch') : t('home.history.batchManage') }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.text-primary {
    color: v-bind(primaryColor);
}

.bg-primary {
    background-color: v-bind(primaryColor);
}

.border-primary {
    border-color: v-bind(primaryColor);
}

.hover\:border-primary:hover {
    border-color: v-bind(primaryColorHover);
}
</style>
