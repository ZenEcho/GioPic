<template>
    <n-popover trigger="hover" placement="bottom">
        <template #trigger>
            <slot>
                <n-button >CORS 是什么?</n-button>
            </slot>
        </template>
        <div class="p-4 max-w-[400px]">
            <h3 class="font-bold mb-2">什么是 CORS？</h3>
            <p class="mb-2">CORS（跨域资源共享）是一种安全机制，用于控制不同域之间的资源访问。</p>
            <p class="mb-2">常见问题：上传文件时可能会遇到跨域错误，如下图所示：</p>
            <!-- 修改：在 n-image 上添加点击事件 -->
            <n-image class="mt-2" width="350"
                src="https://t11.baidu.com/it/u=3939002545,204141372&fm=30&app=106&f=JPEG?w=640&h=148&s=2F42E716C5764C201A5CB1FC03005033"
                alt="CORS错误示例"
                @click.stop.prevent="showPreview = true" />
            <p class="mt-2 text-sm text-gray-500">配置正确的 CORS 规则可以解决此类跨域访问问题</p>
        </div>
    </n-popover>
    <!-- 新增：图片预览的模态框 -->
    <n-modal v-model:show="showPreview" preset="card" maskClosable>
        <template #header>
            <span>图片预览</span>
        </template>
        <n-image width="100%" :src="imageSrc" alt="预览图片" />
          <p class="mt-2 text-sm text-gray-500">配置正确的 CORS 规则可以解决此类跨域访问问题</p>
    </n-modal>
</template>

<script setup>
import { ref } from 'vue'
const showPreview = ref(false)
// 定义图片地址变量，便于 n-modal 中使用
const imageSrc = "https://t11.baidu.com/it/u=3939002545,204141372&fm=30&app=106&f=JPEG?w=640&h=148&s=2F42E716C5764C201A5CB1FC03005033"
</script>