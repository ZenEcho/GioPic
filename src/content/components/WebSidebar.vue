<template>
    <div v-if="uploadAreaData?.status" v-show="!iframeShow" ref="uploadAreaRef" class="giopic-web-handle"
        :data-side="uploadAreaData?.position"
        :style="sidebarStyle" @mousedown="handleMouseDown" @click="handleClick" title="按住拖动">
        <div class="giopic-web-handle__glow"></div>
        <div class="giopic-web-handle__inner"></div>
        <div class="giopic-web-handle__label">GioPic</div>
    </div>

    <div v-if="uploadAreaData?.status" v-show="iframeShow" class="giopic-web-overlay" :style="overlayStyle"
        @click="hideIframe"></div>

    <iframe v-if="uploadAreaData?.status" v-show="iframeShow" ref="iframeRef" :src="iframeSrc" :style="iframeStyle"
        allow="clipboard-write"></iframe>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, useTemplateRef, watch } from 'vue'
import browser from 'webextension-polyfill'
import { useSidebarDrag } from '@/content/composables/useSidebarDrag'

interface SidebarConfig {
    status: boolean
    width: number
    height: number
    location: number
    opacity: number
    closeTime: number
    position: 'Left' | 'Right'
}

const uploadAreaRef = useTemplateRef<HTMLDivElement>('uploadAreaRef')
const uploadAreaData = ref<SidebarConfig>()

const iframeShow = ref(false)
const iframeRef = useTemplateRef<HTMLIFrameElement>('iframeRef')
const iframeSrc = ref(browser.runtime.getURL('index.html'))
const isHoveringHandle = ref(false)

// Composable for drag logic
const {
    isDragging,
    isClickPrevented,
    handleMouseDown,
    handleGlobalMouseMove
} = useSidebarDrag(uploadAreaRef, uploadAreaData)

// Computed Styles
const sidebarStyle = computed(() => {
    if (!uploadAreaData.value) return {}
    
    const { width, height, location, opacity, position } = uploadAreaData.value
    const isLeft = position === 'Left'
    const logoUrl = browser.runtime.getURL('assets/icons/logo256.png')
    
    return {
        position: 'fixed',
        width: `${width}px`,
        height: `${height}%`,
        background: `rgba(17, 24, 39, ${Math.max(0.12, opacity / 100)})`,
        WebkitBackdropFilter: 'blur(10px)',
        backdropFilter: 'blur(10px)',
        top: `${location}%`,
        zIndex: 2147483647,
        [isLeft ? 'left' : 'right']: `-${width + 10}px`,
        transition: isLeft ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        borderRadius: isLeft ? '0px 14px 14px 0px' : '14px 0px 0px 14px',
        cursor: 'pointer',
        boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
        border: '1px solid rgba(255,255,255,0.16)',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.10), transparent 55%), url("${logoUrl}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
    } as any
})

const overlayStyle = computed(() => {
    return {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.32)',
        WebkitBackdropFilter: 'blur(2px)',
        backdropFilter: 'blur(2px)',
        zIndex: String(Math.pow(2, 31) - 11),
    } as any
})

const iframeStyle = computed(() => {
    if (!uploadAreaData.value) return {}
    const { position } = uploadAreaData.value
    const isLeft = position === 'Left'
    
    return {
        position: 'fixed',
        width: 'min(650px)',
        height: '100%',
        bottom: '0',
        border: 'none',
        boxShadow: '0 0 16px rgba(0,0,0,0.25), 0 6px 30px rgba(0,0,0,0.18)',
        borderRadius: isLeft ? '0 16px 16px 0' : '16px 0 0 16px',
        zIndex: String(Math.pow(2, 31) - 10),
        transition: isLeft ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        [isLeft ? 'left' : 'right']: iframeShow.value ? '0' : '-900px'
    } as any
})

const showIframe = () => {
    if (isClickPrevented.value) return
    iframeShow.value = true
    if (!iframeSrc.value) iframeSrc.value = browser.runtime.getURL('index.html')
}

const hideIframe = () => {
    iframeShow.value = false
}

const handleClick = () => {
    showIframe()
}

const applyGlowPosition = (e: PointerEvent) => {
    if (!uploadAreaRef.value) return
    const rect = uploadAreaRef.value.getBoundingClientRect()
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width)
    const y = Math.min(Math.max(0, e.clientY - rect.top), rect.height)
    const xPercent = rect.width ? (x / rect.width) * 100 : 50
    const yPercent = rect.height ? (y / rect.height) * 100 : 50
    uploadAreaRef.value.style.setProperty('--glow-x', `${xPercent}%`)
    uploadAreaRef.value.style.setProperty('--glow-y', `${yPercent}%`)
}

const resetGlowPosition = () => {
    if (!uploadAreaRef.value) return
    uploadAreaRef.value.style.setProperty('--glow-x', '50%')
    uploadAreaRef.value.style.setProperty('--glow-y', '50%')
}

const handlePointerEnter = (e: PointerEvent) => {
    isHoveringHandle.value = true
    applyGlowPosition(e)
}

const handlePointerLeave = () => {
    isHoveringHandle.value = false
    resetGlowPosition()
}

const handlePointerMove = (e: PointerEvent) => {
    if (!isHoveringHandle.value) return
    applyGlowPosition(e)
}

onMounted(async () => {
    const res = await browser.storage.local.get("uploadArea");
    
    if (res.uploadArea) {
        uploadAreaData.value = res.uploadArea as SidebarConfig
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
            uploadAreaData.value = changes.uploadArea.newValue as SidebarConfig
        }
    })

    // Global mouse move for sidebar peek/hide
    document.addEventListener('mousemove', handleGlobalMouseMove)
})

let isGlowListenerAttached = false
const attachGlowListeners = () => {
    if (isGlowListenerAttached) return
    if (!uploadAreaRef.value) return
    uploadAreaRef.value.addEventListener('pointerenter', handlePointerEnter)
    uploadAreaRef.value.addEventListener('pointerleave', handlePointerLeave)
    uploadAreaRef.value.addEventListener('pointermove', handlePointerMove)
    resetGlowPosition()
    isGlowListenerAttached = true
}

const detachGlowListeners = () => {
    if (!isGlowListenerAttached) return
    if (!uploadAreaRef.value) return
    uploadAreaRef.value.removeEventListener('pointerenter', handlePointerEnter)
    uploadAreaRef.value.removeEventListener('pointerleave', handlePointerLeave)
    uploadAreaRef.value.removeEventListener('pointermove', handlePointerMove)
    isGlowListenerAttached = false
}

watch([uploadAreaRef, () => uploadAreaData.value?.status], ([el, status]) => {
    if (el && status) {
        attachGlowListeners()
    } else {
        detachGlowListeners()
    }
}, { immediate: true })

watch(isDragging, async (val, oldVal) => {
    if (!oldVal || val) return
    if (!uploadAreaData.value) return
    await browser.storage.local.set({ uploadArea: uploadAreaData.value })
})

onUnmounted(() => {
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    detachGlowListeners()
})
</script>

<style scoped>
.giopic-web-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    --glow-x: 50%;
    --glow-y: 50%;
}

.giopic-web-handle__glow {
    position: absolute;
    inset: -24px;
    background: radial-gradient(circle at var(--glow-x) var(--glow-y), rgba(59, 130, 246, 0.25), transparent 60%);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
}

.giopic-web-handle__inner {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.02));
    pointer-events: none;
}

.giopic-web-handle__label {
    position: absolute;
    left: 100%;
    margin-left: 10px;
    padding: 6px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
    background: rgba(17, 24, 39, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    transform: translateX(-6px);
    opacity: 0;
    transition: opacity 0.18s ease, transform 0.18s ease;
    pointer-events: none;
    white-space: nowrap;
}

.giopic-web-handle[data-side='Right'] .giopic-web-handle__label {
    left: auto;
    right: 100%;
    margin-left: 0;
    margin-right: 10px;
    transform: translateX(6px);
}

.giopic-web-handle:hover .giopic-web-handle__glow {
    opacity: 1;
}

.giopic-web-handle:hover .giopic-web-handle__label {
    opacity: 1;
    transform: translateX(0);
}

.giopic-web-overlay {
    pointer-events: auto;
}
</style>
