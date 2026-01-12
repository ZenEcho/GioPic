<template>
    <div v-if="uploadAreaData?.status" v-show="!iframeShow" ref="uploadAreaRef" title="长按拖动" class="uploadArea fixed"
        :style="sidebarStyle" @mousedown="handleMouseDown" @mouseup="handleMouseUp" @click="handleClick"
        @mouseleave="handleMouseUp"></div>

    <!-- 遮罩 -->
    <div v-if="uploadAreaData?.status" v-show="iframeShow" class="fixed inset-0 bg-black opacity-25 z-[998]" @click="hideIframe"></div>

    <iframe v-if="uploadAreaData?.status" v-show="iframeShow" ref="iframeRef" :src="iframeSrc" :style="iframeStyle"
        allow="clipboard-write"></iframe>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, useTemplateRef } from 'vue';
import browser from 'webextension-polyfill';
import { useSidebarDrag } from '@/content/composables/useSidebarDrag';

interface SidebarConfig {
    status: boolean
    width: number
    height: number
    location: number
    opacity: number
    closeTime: number
    position: 'Left' | 'Right'
}

const uploadAreaRef = useTemplateRef<HTMLDivElement>('uploadAreaRef');
const uploadAreaData = ref<SidebarConfig>();

const iframeShow = ref(false);
const iframeRef = useTemplateRef<HTMLDivElement>('iframeRef')
const iframeSrc = ref(browser.runtime.getURL('index.html'));

// Composable for drag logic
const { 
    isClickPrevented, 
    handleMouseDown, 
    handleMouseUp, 
    handleGlobalMouseMove 
} = useSidebarDrag(uploadAreaRef, uploadAreaData)

// Computed Styles
const sidebarStyle = computed(() => {
    if (!uploadAreaData.value) return {}
    
    const { width, height, location, opacity, position } = uploadAreaData.value
    const isLeft = position === 'Left'
    const logoUrl = browser.runtime.getURL('assets/icons/logo256.png')
    
    return {
        width: `${width}px`,
        height: `${height}%`,
        background: `url("${logoUrl}") no-repeat center rgba(60,64,67,${opacity / 100})`,
        backgroundSize: 'contain',
        top: `${location}%`,
        zIndex: 2147483647, // Max z-index
        [isLeft ? 'left' : 'right']: `-${width + 10}px`, // Initial hidden state handled by drag logic mostly, but good default
        transition: isLeft ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        borderRadius: isLeft ? '0px 10px 10px 0px' : '10px 0px 0px 10px',
        cursor: 'pointer'
    }
})

const iframeStyle = computed(() => {
    if (!uploadAreaData.value) return {}
    const { position } = uploadAreaData.value
    const isLeft = position === 'Left'
    
    return {
        position: 'fixed',
        width: '550px',
        height: '100%',
        bottom: '0',
        border: 'none',
        boxShadow: 'rgb(0 0 0 / 30%) 0px 0px 10px, rgba(0, 0, 0, 0.06) 0px 2px 4px',
        zIndex: String(Math.pow(2, 31) - 10),
        transition: isLeft ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        [isLeft ? 'left' : 'right']: iframeShow.value ? '0' : '-900px'
    } as any
})

const showIframe = () => {
    if (isClickPrevented.value) return
    iframeShow.value = true
    // Need to ensure iframe src is set if lazy loaded
    if (!iframeSrc.value) iframeSrc.value = browser.runtime.getURL('index.html')
}

const hideIframe = () => {
    iframeShow.value = false
}

const handleClick = () => {
    showIframe()
}

onMounted(async () => {
    const res = await browser.storage.local.get("uploadArea");
    
    if (res.uploadArea) {
        uploadAreaData.value = res.uploadArea as SidebarConfig;
    } else {
         uploadAreaData.value = {
            status: true,
            width: 32,
            height: 30,
            location: 34,
            opacity: 30,
            closeTime: 2,
            position: 'Right',
         }
    }

    // Listen for settings changes
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.uploadArea) {
            uploadAreaData.value = changes.uploadArea.newValue as SidebarConfig;
        }
    });

    // Global mouse move for sidebar peek/hide
    document.addEventListener('mousemove', handleGlobalMouseMove);
});

onUnmounted(() => {
    document.removeEventListener('mousemove', handleGlobalMouseMove);
});
</script>
