<template>
    <div v-show="!iframeShow" ref="uploadAreaRef" title="长按拖动" class="uploadArea fixed right-0"
        :style="{ ...uploadAreaStyle, }" @mousedown="handleMouseDown" @mouseup="handleMouseUp" @click="showIframe"
        @mouseleave="handleMouseUp"></div>

    <!-- 遮罩 -->
    <div v-show="iframeShow" class="fixed inset-0 bg-black opacity-25 z-[998]" @click="hideIframe"></div>

    <iframe v-show="iframeShow" ref="iframeRef" :src="iframeSrc" :style="{ ...iframeStyle }"
        allow="clipboard-write "></iframe>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useLocalStorage } from '@/stores/useLocalStorage';

const uploadArea = useTemplateRef<HTMLDivElement>('uploadAreaRef');
const uploadAreaData = ref();
const uploadAreaStyle = ref({});

const iframeShow = ref(false);
const iframe = useTemplateRef<HTMLDivElement>('iframeRef')
const iframeStyle = ref({});
const iframeSrc = ref('');


// 变量声明
let isDragging = false;
let startY = 0;
let startTop = 0;
let isClickPrevented = false;
let isMouseOverSidebar = false;
let uploadAreaRect: DOMRect | null = null;
let dragTimeout: number | null = null;

onMounted(async () => {
    uploadAreaData.value = await useLocalStorage.get("uploadArea");

    uploadAreaStyle.value = {
        width: uploadAreaData.value.width + 'px',
        height: uploadAreaData.value.height + '%',
        background: `url("${chrome.runtime.getURL('assets/icons/logo256.png')}") no-repeat center rgba(60,64,67,${uploadAreaData.value.opacity / 100})`,
        backgroundSize: 'contain',
        top: uploadAreaData.value.location + '%',
        zIndex: Math.pow(2, 31) - 1,
        ...(uploadAreaData.value.position == 'Left'
            ? { left: '-' + (Number(uploadAreaData.value.width) + 10) + 'px' }
            : { right: '-' + (Number(uploadAreaData.value.width) + 10) + 'px' }
        ),
        transition: uploadAreaData.value.position == 'Left' ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        borderRadius: uploadAreaData.value.position == 'Left' ? '0px 10px 10px 0px' : '10px 0px 0px 10px',
        cursor: 'pointer'
    };
    iframeStyle.value = {
        position: 'fixed',
        width: '800px',
        height: '100%',
        bottom: '0',
        border: 'none',
        boxShadow: 'rgb(0 0 0 / 30%) 0px 0px 10px, rgba(0, 0, 0, 0.06) 0px 2px 4px',
        zIndex: String(Math.pow(2, 31) - 10),
        transition: uploadAreaData.value.position == 'Left' ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out',
        [uploadAreaData.value.position === "Left" ? 'left' : 'right']: `-900px`

    };
    // 添加鼠标事件监听器
    document.addEventListener('mousemove', handleMouseMoveWrapper);
    document.addEventListener('mouseup', handleDocumentMouseUp);
});

onUnmounted(() => {
    // 清理事件监听器
    document.removeEventListener('mousemove', handleMouseMoveWrapper);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
    if (dragTimeout) {
        clearTimeout(dragTimeout);
    }
});

function handleMouseMoveWrapper(e: MouseEvent) {
    if (uploadArea.value && uploadAreaData.value) {
        if (!uploadAreaRect) {
            uploadAreaRect = uploadArea.value.getBoundingClientRect();
        }
        handleMouseMove(e, uploadArea.value, uploadAreaRect, uploadAreaData.value.position);
    }
}

function handleMouseMove(e: MouseEvent, uploadAreaEl: HTMLElement, rect: DOMRect, position: string) {
    const x = e.clientX;
    const y = e.clientY;
    let w = window.innerWidth;
    let h = window.innerHeight;

    if (isDragging) {
        const deltaY = y - startY;
        const newTop = startTop + deltaY;
        const maxTop = window.innerHeight - uploadAreaEl.clientHeight;

        // 限制拖拽范围在窗口内
        const clampedTop = Math.max(0, Math.min(newTop, maxTop));

        uploadAreaEl.style.top = `${clampedTop}px`;
        uploadAreaEl.style[position === 'Left' ? 'left' : 'right'] = '0';
        uploadAreaEl.style.cursor = 'grabbing';
        isClickPrevented = true;

        // 更新位置数据
        const newLocationPercent = (clampedTop / window.innerHeight) * 100;
        uploadAreaData.value.location = Math.trunc(newLocationPercent);

        uploadAreaRect = uploadAreaEl.getBoundingClientRect();
        return;
    }

    const isLeft = position === 'Left';
    const isRight = position === 'Right';

    if (isRight && document.body.scrollHeight > window.innerHeight) {
        w -= window.innerWidth - document.body.clientWidth;
        h -= window.innerHeight - document.body.clientHeight;
    }

    // 更新rect以获取最新位置
    const currentRect = uploadAreaEl.getBoundingClientRect();

    // 检测鼠标是否在侧边栏区域内
    let isNearSidebar = false;
    if (isLeft) {
        // 左侧：检测鼠标是否在左边缘附近
        isNearSidebar = x <= 50;
    } else {
        // 右侧：检测鼠标是否在右边缘附近
        isNearSidebar = x >= w - 50;
    }

    // 检查是否在侧边栏的垂直范围内
    const isInVerticalRange = y >= currentRect.top && y <= currentRect.bottom;

    if (isNearSidebar && isInVerticalRange) {
        uploadAreaEl.style[isLeft ? 'left' : 'right'] = '0';
        isMouseOverSidebar = true;
    } else {
        isMouseOverSidebar = false;
    }

    if (!isMouseOverSidebar && !isDragging) {
        uploadAreaEl.style[isLeft ? 'left' : 'right'] = `-${uploadAreaData.value.width + 10}px`;
    }
}

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
    if (!uploadArea.value) return;
    e.preventDefault();
    dragTimeout = window.setTimeout(() => {
        isDragging = true;
        isClickPrevented = false;
        startY = e.clientY;
        startTop = uploadArea.value!.offsetTop;
        uploadArea.value!.classList.add('box-shadow-blink');
        uploadArea.value!.style.cursor = 'grabbing';

        // 禁用过渡效果以获得平滑拖拽
        uploadArea.value!.style.transition = 'none';
    }, 500);
}

// 处理鼠标抬起事件
function handleMouseUp(e: MouseEvent) {
    if (dragTimeout) {
        clearTimeout(dragTimeout);
        dragTimeout = null;
    }

    if (isDragging && uploadArea.value) {
        isDragging = false;
        uploadArea.value.classList.remove('box-shadow-blink');
        uploadArea.value.style.cursor = 'pointer';

        // 重新启用过渡效果
        const position = uploadAreaData.value.position;
        uploadArea.value.style.transition = position == 'Left' ? 'left 0.3s ease-in-out' : 'right 0.3s ease-in-out';

        // 保存新位置到本地存储
        useLocalStorage.set("uploadArea", uploadAreaData.value);

        uploadAreaRect = uploadArea.value.getBoundingClientRect();

        if (isClickPrevented) {
            setTimeout(() => { isClickPrevented = false }, 100);
        }
    }
}

// 处理文档级别的鼠标抬起事件（防止拖拽时鼠标移出元素）
function handleDocumentMouseUp(e: MouseEvent) {
    if (isDragging) {
        handleMouseUp(e);
    }
}

function showIframe() {
    // 如果点击被阻止（正在拖拽），则不执行显示iframe的逻辑
    if (isClickPrevented) {
        return;
    }
    iframeShow.value = true;
    iframeSrc.value = chrome.runtime.getURL('index.html');
    //   延迟300毫秒
    setTimeout(() => {
        if (iframe.value) {
            iframe.value.style[uploadAreaData.value.position === "Left" ? 'left' : 'right'] = '0';
        }
    }, 10);
}

function hideIframe() {
    if (iframe.value) {
        iframe.value.style[uploadAreaData.value.position === "Left" ? 'left' : 'right'] = `-800px`;
    }
    setTimeout(() => {
        iframeShow.value = false;
    }, 300);

}
</script>

<style scoped>
.box-shadow-blink {
    box-shadow: 0 0 10px red;
    animation: blink 0.5s infinite alternate;
}


@keyframes blink {
    0% {
        box-shadow: 0 0 10px red;
    }

    100% {
        box-shadow: 0 0 20px blue;
    }
}
</style>