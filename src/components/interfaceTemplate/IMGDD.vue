<template>

    <n-form :model="formValue" ref="formRef">
        <n-form-item>
            <n-card embedded :bordered="false">
                <n-result status="success" title="IMGDD无须配置" description="直接保存就可以使用">
                    <template #footer>
                        <n-button type="primary" @click="handleSubmit">好的</n-button>
                    </template>
                </n-result>
            </n-card>
        </n-form-item>
    </n-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui';
const message = useMessage();
const formRef = ref(null)

const formValue = ref({
    Program: 'IMGDD',
})


const emit = defineEmits(['submit'])

function handleSubmit() {
    emit('submit', formValue.value)
    message.success('提交成功');
}

</script>
