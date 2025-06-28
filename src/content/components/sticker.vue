<template>
    <div ref="containerRef" v-show="isVisible" class="sticker-container" :style="containerStyle"
        @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <!-- 控制按钮区域 -->
        <div class="control-buttons">
            <button title="关闭"
                class="absolute top-[-32px] right-[0px] w-[24px] h-[24px] bg-slate-200 hover:bg-slate-300"
                @click="hideSticker">
                <span class="i-ph-x  text-red-600 w-[24px] h-[24px] block "></span>
            </button>
            <button title="设置"
                class="absolute top-[-32px] right-[32px] w-[24px] h-[24px] bg-slate-200 hover:bg-slate-300"
                @click="isSettingsOpen = !isSettingsOpen">
                <span class="i-ph-gear   w-[24px] h-[24px] block "
                    :class="isSettingsOpen ? 'text-blue-600' : 'bg-slate-600'"></span>
            </button>
            <button title="刷新"
                class="absolute top-[-32px] right-[64px] w-[24px] h-[24px] bg-slate-200 hover:bg-slate-300"
                @click="fetchStickers">
                <span class="i-ph-arrows-clockwise bg-slate-600 w-[24px] h-[24px] block "></span>
            </button>
            <button title="移动"
                class="absolute top-[-32px] right-[96px] w-[24px] h-[24px] bg-slate-200 hover:bg-slate-300"
                @mousedown="startMove">
                <span class="i-ph-mouse-left-click-fill   w-[24px] h-[24px] block"
                    :class="isMoving ? 'bg-blue-600' : 'bg-slate-600'"></span>
            </button>
        </div>

        <div class="sticker-content">
            <!-- 贴纸容器区域 -->
            <div class="sticker-box" ref="stickerBoxRef" :style="{ width: boxWidth }">
                <!-- 分类标签栏 -->
                <div class="sticker-tabs" ref="scrollContainerRef" @mousedown="startDrag">
                    <div v-for="(category, index) in stickers" :key="category.id" :title="category.StickerDescribe"
                        class="sticker-tab" :class="{ 'sticker-tab-active': selectedIndex === index }"
                        @click="selectedIndex = index">
                        {{ category.StickerTitle }}
                    </div>
                </div>

                <!-- 设置面板 -->
                <div v-if="isSettingsOpen" class="settings-panel">
                    <div class="settings-item">
                        <input type="checkbox" id="insert-focus" :checked="insertFocusEnabled"
                            @change="updateInsertFocus">
                        <label for="insert-focus">焦点插入</label>
                    </div>

                    <div class="settings-item">
                        <label for="code-format">插入格式:</label>
                        <select id="code-format" :value="codeFormat" @change="updateCodeFormat">
                            <option value="URL">URL</option>
                            <option value="HTML">HTML</option>
                            <option value="BBCode">BBCode</option>
                            <option value="Markdown">Markdown</option>
                            <option value="MD with link">MD with link</option>
                        </select>
                    </div>
                </div>

                <!-- 贴纸列表 -->
                <div v-else-if="currentCategory" class="sticker-grid" @mousedown="startMove">
                    <img v-for="item in currentCategory.StickerData" :key="item.StickerURL" :src="item.StickerURL"
                        :alt="item.StickerName" :title="item.StickerName" class="sticker-image"
                        @mouseover="previewSrc = item.StickerURL" @mouseleave="previewSrc = ''"
                        @click="insertSticker(item)" loading="lazy">
                </div>
            </div>

            <!-- 预览区域 -->
            <div class="preview-container" v-if="!isSettingsOpen" @mousedown="startMove">
                <img v-if="previewSrc" class="preview-image" :src="previewSrc" alt="预览图片">
                <img v-else src="@/assets/icons/logo128.png" alt="贴纸" class="preview-image">
            </div>
        </div>

       
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLocalStorage } from '@/stores/useLocalStorage';

// 类型定义
interface StickerData {
    StickerURL: string;
    StickerName: string;
}

interface StickerCategory {
    id: number;
    index: number;
    StickerTitle: string;
    StickerDescribe?: string;
    StickerData: StickerData[];
}

type CodeFormat = 'URL' | 'HTML' | 'BBCode' | 'Markdown' | 'MD with link';

// 状态管理
const isVisible = ref(false);
const isSettingsOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const stickerBoxRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);
const boxWidth = ref('0px');
const containerStyle = ref('');
const previewSrc = ref('');

// 贴纸数据
const stickers = ref<StickerCategory[]>([]);
const selectedIndex = ref(0);
const currentCategory = computed<StickerCategory | null>(() =>
    stickers.value[selectedIndex.value] || null
);

// 用户设置
const insertFocusEnabled = ref(false);
const codeFormat = ref<CodeFormat>('URL');

// 拖拽相关状态
const isDragging = ref(false);
const isMoving = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const initialLeft = ref(0);
const initialTop = ref(0);

// 计时器
let showTimer: number | null = null;
let hideTimer: number | null = null;
let isShowPending = false;

// =============== 功能函数 ===============

/**
 * 从远程加载贴纸数据
 */
async function fetchStickers() {
    stickers.value = [];
    try {
        const stickerUrl = await useLocalStorage.get("StickerURL");
        const response = await fetch('https://cors-anywhere.pnglog.com/' + stickerUrl);
        const data = await response.json();

        if (data.sticker) {
            // 确保每个类别都有ID和索引
            data.sticker.forEach((item: StickerCategory, index: number) => {
                if (item.id === undefined) {
                    item.id = index;
                }
                if (item.index === undefined) {
                    item.index = item.id || index;
                }
            });

            stickers.value = data.sticker;
            await useLocalStorage.set("Sticker", data.sticker);
        }
    } catch (error) {
        console.error('Failed to fetch stickers:', error);
    }
}

/**
 * 从本地存储加载贴纸数据
 */
async function loadStickers() {
    try {
        const result = await useLocalStorage.get("Sticker");
        if (result && result.length > 0) {
            stickers.value = result;
        } else {
            await fetchStickers();
        }
    } catch (error) {
        await fetchStickers();
    }
}

/**
 * 加载用户设置
 */
async function loadUserSettings() {
    try {
        const focusSetting = await useLocalStorage.get("StickerOptional");
        insertFocusEnabled.value = !!focusSetting;

        const formatSetting = await useLocalStorage.get("StickerCodeSelect");
        if (formatSetting) {
            codeFormat.value = formatSetting as CodeFormat;
        }
    } catch (error) {
        console.error('Failed to load user settings:', error);
    }
}

/**
 * 更新焦点插入设置
 */
function updateInsertFocus(e: Event) {
    const checked = insertFocusEnabled.value
    insertFocusEnabled.value = checked;
    useLocalStorage.set("StickerOptional", checked);
}

/**
 * 更新代码格式设置
 */
// 定义类型

function updateCodeFormat(e: Event) {
    const value = ((e.target as HTMLSelectElement)?.value) || codeFormat.value
    codeFormat.value = value as CodeFormat;
    useLocalStorage.set("StickerCodeSelect", value);
}

/**
 * 插入贴纸
 */
function insertSticker(stickerData: StickerData) {
    if (insertFocusEnabled.value) {
        let formattedContent = '';

        switch (codeFormat.value) {
            case 'URL':
                formattedContent = stickerData.StickerURL;
                break;
            case 'HTML':
                formattedContent = `<img src="${stickerData.StickerURL}" alt="" title="${stickerData.StickerName}">`;
                break;
            case 'BBCode':
                formattedContent = `[img]${stickerData.StickerURL}[/img]`;
                break;
            case 'Markdown':
                formattedContent = `![${stickerData.StickerName}](${stickerData.StickerURL})`;
                break;
            case 'MD with link':
                formattedContent = `[![${stickerData.StickerName}](${stickerData.StickerURL})](${stickerData.StickerURL})`;
                break;
        }

        chrome.runtime.sendMessage({ AutoInsert: [formattedContent, "FocusInsert"] });
    } else {
        chrome.runtime.sendMessage({ AutoInsert: stickerData.StickerURL });
    }
}

// =============== 拖拽与定位 ===============

function startDrag(e: MouseEvent) {
    isDragging.value = true;
    if (!scrollContainerRef.value) return;

    startX.value = e.pageX - scrollContainerRef.value.offsetLeft;
    scrollLeft.value = scrollContainerRef.value.scrollLeft;

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
    if (!isDragging.value || !scrollContainerRef.value) return;

    const x = e.pageX - scrollContainerRef.value.offsetLeft;
    const walk = (x - startX.value);
    scrollContainerRef.value.scrollLeft = scrollLeft.value - walk;
}

function stopDrag() {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
}

function startMove(e: MouseEvent) {
    if (e.target instanceof HTMLElement && e.target.tagName === 'IMG') return;

    isMoving.value = true;
    startX.value = e.clientX + window.scrollX;
    startY.value = e.clientY + window.scrollY;

    if (!containerRef.value) return;

    const rect = containerRef.value.getBoundingClientRect();
    initialLeft.value = rect.left + window.scrollX;
    initialTop.value = rect.top + window.scrollY;

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopMove);
}

function onMove(e: MouseEvent) {
    if (!isMoving.value) return;

    const deltaX = (e.clientX + window.scrollX) - startX.value;
    const deltaY = (e.clientY + window.scrollY) - startY.value;

    containerStyle.value = `left:${initialLeft.value + deltaX}px;top:${initialTop.value + deltaY}px`;
}

function stopMove() {
    isMoving.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', stopMove);
}

// =============== 显示和隐藏控制 ===============

function showSticker(targetElement: HTMLElement) {
    isShowPending = true;
    isVisible.value = true;
    boxWidth.value = '420px';

    // 计算并设置位置
    const rect = targetElement.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    const containerWidth = 420;
    const containerHeight = 200;

    const viewportHeight = window.innerHeight;
    const spaceBelow = (scrollY + viewportHeight) - (scrollY + rect.bottom);

    // 水平位置
    if (scrollX + rect.left >= containerWidth) {
        containerStyle.value = `left:${rect.right - containerWidth + 12}px`;
    } else {
        containerStyle.value = `left:${rect.left}px`;
    }

    // 垂直位置
    if (spaceBelow >= containerHeight) {
        containerStyle.value += `;top:${rect.bottom + scrollY + 10}px`;
    } else {
        containerStyle.value += `;top:${rect.top + scrollY - containerHeight - 10}px`;
    }
}

function hideSticker() {
    boxWidth.value = '0px';
    isShowPending = false;

    // 等待动画完成后隐藏
    setTimeout(() => {
        isVisible.value = false;
    }, 500);
}

function handleMouseEnter() {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
}

function handleMouseLeave() {
    hideTimer = window.setTimeout(() => {
        hideSticker();
    }, 2000);
}

// =============== 初始化逻辑 ===============

function initializeSticker(targetSelector: string) {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;

    targetElement.addEventListener('mouseenter', () => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }

        if (isShowPending) return;

        showTimer = window.setTimeout(() => {
            showSticker(targetElement);
        }, 800);
    });

    targetElement.addEventListener('mouseleave', () => {
        if (showTimer) {
            clearTimeout(showTimer);
            showTimer = null;
        }

        hideTimer = window.setTimeout(() => {
            hideSticker();
        }, 1000);
    });
}

// =============== 生命周期钩子 ===============

onMounted(async () => {
    // 加载用户设置和贴纸数据
    await loadUserSettings();
    await loadStickers();

    // 监听页面消息
    const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'stickerPageLoad') {
            initializeSticker(event.data.id);
        }
    };

    window.addEventListener('message', messageHandler);

    // // 清理函数
    // onUnmounted(() => {
    //     window.removeEventListener('message', messageHandler);
    //     if (showTimer) clearTimeout(showTimer);
    //     if (hideTimer) clearTimeout(hideTimer);
    // });
});
</script>

<style scoped>
.sticker-container {
    position: absolute;
    width: 420px;
    height: 200px;
    z-index: 9999;
}


.sticker-content {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.sticker-box {
    display: flex;
    flex-direction: column;
    transition: width 0.5s ease;
}

.control-buttons button {
    border: none;
    padding: 0;
    margin: 0;
}

.sticker-tabs {
    display: flex;
    overflow-x: hidden;
    white-space: nowrap;
    background-color: rgb(37, 99, 235);
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    height: 2.25rem;
}

.sticker-tab {
    padding: 0.5rem 1rem;
    cursor: grab;
    user-select: none;
    text-align: center;
    color: white;
    background-color: rgb(59, 130, 246);
}

.sticker-tab:hover {
    background-color: rgb(96, 165, 250);
}

.sticker-tab:active {
    cursor: grabbing;
}

.sticker-tab-active {
    background-color: rgb(96, 165, 250);
}

.sticker-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    height: 164px;
    overflow-y: auto;
    background-color: rgb(241, 245, 249);
}

.sticker-image {
    height: 64px;
    margin: 0.25rem;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.sticker-image:hover {
    transform: scale(1.05);
}

.preview-container {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
}

.preview-image {
    height: 96px;
}

.settings-panel {
    background-color: rgb(241, 245, 249);
    height: 164px;
    padding: 1rem;
}

.settings-item {
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
}

.settings-item label {
    margin-left: 0.5rem;
}

.settings-item select {
    margin-left: 0.5rem;
    padding: 0.25rem;
    border: 1px solid rgb(209, 213, 219);
    border-radius: 0.25rem;
}
</style>