<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
    show: boolean
    value: string
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'update:value', value: string): void
    (e: 'confirm'): void
}>()

const { t } = useI18n()
</script>

<template>
    <n-modal :show="show" @update:show="emit('update:show', $event)">
        <n-card style="width: 600px; max-width: 90vw;" :title="t('home.importTitle')" :bordered="false" size="huge"
            role="dialog" aria-modal="true">
            <n-input :value="value" @update:value="emit('update:value', $event)" type="textarea"
                :placeholder="t('home.importPlaceholder')" :rows="10" />
            <template #footer>
                <div class="flex justify-end gap-2">
                    <n-button @click="emit('update:show', false)">{{ t('common.cancel') }}</n-button>
                    <n-button type="primary" @click="emit('confirm')">{{ t('common.confirm') }}</n-button>
                </div>
            </template>
        </n-card>
    </n-modal>
</template>
