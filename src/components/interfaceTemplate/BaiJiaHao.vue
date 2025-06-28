<template>

    <n-form :model="formValue" ref="formRef">
        <n-form-item>
            <n-card embedded :bordered="false">
                <n-result status="warning" title="百家号接口配置" class=" text-center">
                    <h3>使用百家号接口,请维持<a href="https://baijiahao.baidu.com/">百家号</a>登录状态</h3>
                    <h3>注意：当你使用百家号接口时,程序会基于浏览器的API调用你的百家号cookie,但不会保存cookie，介意者勿用。</h3>
                    <template #footer>
                        <n-button type="primary" @click="handleSubmit">我知道了</n-button>
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
    Program: 'BaiJiaHao',
})


const emit = defineEmits(['submit'])

function handleSubmit() {
    emit('submit', formValue.value)
    message.success('提交成功');
}

</script>
