<template>

  <n-image class="h-[200px] w-full flex justify-center" :src="imageUrl" object-fit="cover" height="100%" width="100%"
    lazy :intersection-observer-options="{ root: '#image-scroll-container' }" :fallback-src="fallbackImage">
    <template #placeholder>
      <div class="w-[300px] h-[200px] flex justify-center">
        <n-spin size="large" />
      </div>
    </template>
  </n-image>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';


const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  fallbackImage: {
    type: String,
    default: '/assets/icons/logo256.png'
  }
});

const imageUrl = ref();
watch(
  () => props.item.url,
  (newUrl) => {
    if (newUrl && newUrl.includes('111666.best')) {
      // 将 URL 发给 background.js
      chrome.runtime.sendMessage({ action: 'fetchBlob', url: newUrl }, (response) => {
        if (response && response.blobUrl) {
        //  接收到base64
          imageUrl.value = response.blobUrl;
        } else {
          imageUrl.value = props.fallbackImage;
        }
      });
    } else {
      imageUrl.value = newUrl;
    }
  },
  { immediate: true }
);

// 组件销毁前清理 Blob URL
onBeforeUnmount(() => {
  if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>
