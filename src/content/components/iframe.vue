<template>
    <iframe :src="src" ref="iframe"></iframe>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useLocalStorage } from '@/stores/useLocalStorage';
const src = chrome.runtime.getURL('index.html');
const iframe = ref<HTMLIFrameElement | null>(null);

</script>
<style scoped>
iframe {
    position: fixed;
    width: 800px;
    height: 100%;
    bottom: 0;
    border: none;
    transition: left right 0.4s ease;
    box-shadow: rgb(0 0 0 / 30%) 0px 0px 10px, rgba(0, 0, 0, 0.06) 0px 2px 4px;
}
</style>