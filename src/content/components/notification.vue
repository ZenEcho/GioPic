<template>

</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { useNotification, NText, NInput, NButton, NSpace } from 'naive-ui';
import { useLocalStorage } from '@/stores/useLocalStorage';
import { t } from '@/utils/i18n';
// 添加接口定义
interface NotificationButton {
    text: string;
    style?: string;
    init?: (closeCallback: () => void) => void;
}

interface UploadData {
    status?: string;
    url?: string;
    originalUrl?: string;
    name?: string;
    message?: string;
}

interface NotificationConfig {
    type: string;
    title: string;
    content: string | HTMLElement;
    duration: number;
    style: string;
    overwrite: boolean;
    saved?: boolean;
    buttons: NotificationButton[];
    uploadData: UploadData;
    randomUUID?: string;
}

const defaultConfig = {
    type: 'info',
    title: t("app_name") + ':',
    content: 'No Data',
    duration: 10000, // Naive UI 使用毫秒
    style: "",
    overwrite: false,
    saved: false,
    buttons: [],
    uploadData: {},
};

const notification = useNotification();
const activeNotifications = ref<Map<string, any>>(new Map());
const notificationButtonsMap = ref<Map<string, NotificationButton[]>>(new Map());

function createNotification(config: Partial<NotificationConfig>): void {
    const fullConfig: NotificationConfig = { ...defaultConfig, ...config } as NotificationConfig;
    fullConfig.type = mapNotificationType(fullConfig.type);
    fullConfig.randomUUID = fullConfig.randomUUID ? fullConfig.randomUUID : crypto.randomUUID();
    // 存储按钮配置
    if (fullConfig.buttons.length > 0) {
        notificationButtonsMap.value.set(fullConfig.randomUUID!, fullConfig.buttons);
    }
    // 检查是否需要覆盖现有通知
    if (fullConfig.overwrite) {
        // todo 逻辑有问题

        // const existingKey = findExistingNotification(fullConfig);
        // if (existingKey) {
        //     const existingNotification = activeNotifications.value.get(existingKey);
        //     if (existingNotification) {
        //         existingNotification.destroy();
        //         activeNotifications.value.delete(existingKey);

        //     }
        // }
    }

    // 创建通知内容
    const notificationContent = createNotificationContent(fullConfig);


    // 使用 Naive UI 创建通知
    const naiveNotification = notification.create({
        type: fullConfig.type as 'info' | 'success' | 'warning' | 'error',
        title: fullConfig.title,
        content: () => notificationContent,
        duration: fullConfig.duration,
        closable: true,
        onClose: () => {
            activeNotifications.value.delete(fullConfig.randomUUID!);
            notificationButtonsMap.value.delete(fullConfig.randomUUID!);
            removeNotificationFromStorage(fullConfig);
        },
        onAfterLeave: () => {
            activeNotifications.value.delete(fullConfig.randomUUID!);
            notificationButtonsMap.value.delete(fullConfig.randomUUID!);
            removeNotificationFromStorage(fullConfig);
        }
    });

    activeNotifications.value.set(fullConfig.randomUUID!, naiveNotification);

    if (fullConfig.saved) {
        saveNotificationToStorage(fullConfig);
    }
}

function createNotificationContent(config: NotificationConfig) {
    const contentNodes = [h(NText, { innerHTML: config.content })];

    // 上传成功时添加只读输入框
    if (config.uploadData.url) {
        contentNodes.push(
            h(NInput, {
                value: config.uploadData.url,
                readonly: true,
                onClick: (e) => {
                    (e.target as HTMLInputElement).select();
                },
                onDblclick: () => {
                    if (config.uploadData.url) {
                        navigator.clipboard.writeText(config.uploadData.url);
                    }
                }
            })
        );
    }

    // 添加按钮
    if (config.buttons.length > 0) {
        const buttons = config.buttons.map((button, index) =>
            h(NButton, {
                key: index,
                style: button.style || '',
                onClick: () => {
                    if (config.randomUUID) {
                        window.handleNotificationButton?.(config.randomUUID, index);
                    }
                }
            }, { default: () => button.text })
        );

        contentNodes.push(
            h(NSpace, {
                style: { marginTop: '8px' }
            }, { default: () => buttons })
        );
    }

    return h('div', {}, contentNodes);
}

function findExistingNotification(config: NotificationConfig): string | null {
    let foundKey: string | null = null;
    activeNotifications.value.forEach((_, key) => {
        if (config.uploadData.url && !foundKey) {
            console.log(1);
            foundKey = key;
        }
    });
    return foundKey;
}

function mapNotificationType(type: string): string {
    switch (type) {
        case "信息":
        case "1":
        case "a":
            return "info";
        case "成功":
        case "2":
        case "b":
            return "success";
        case "失败":
        case "3":
        case "c":
            return "error";
        case "警告":
        case "4":
        case "d":
            return "warning";
        default:
            return type;
    }
}

// 存储相关方法
function getSavedNotifications(callback: (notifications: NotificationConfig[]) => void): void {
    useLocalStorage.get("savedNotifications").then(result => {
        callback(result || []);
    });
}

function saveNotificationToStorage(config: NotificationConfig): void {
    const configCopy = { ...config };
    delete configCopy.saved;
    getSavedNotifications(savedNotifications => {
        if (savedNotifications.some(item => item.randomUUID === configCopy.randomUUID)) {
            return;
        }
        savedNotifications.push(configCopy);
        useLocalStorage.set("savedNotifications", savedNotifications);
    });
}

function removeNotificationFromStorage(config: NotificationConfig): void {
    getSavedNotifications((savedNotifications) => {
        const updatedNotifications = savedNotifications.filter((notification: NotificationConfig) => {
            return notification.randomUUID !== config.randomUUID;
        });
        useLocalStorage.set("savedNotifications", updatedNotifications);
    });
}

// 处理按钮点击
function handleNotificationButton(notificationId: string, buttonIndex: number): void {
    const buttons = notificationButtonsMap.value.get(notificationId);
    if (buttons && buttons[buttonIndex]) {
        const button = buttons[buttonIndex];
        if (button.init && typeof button.init === 'function') {
            // 创建关闭函数
            const closeNotification = () => {
                const naiveNotification = activeNotifications.value.get(notificationId);
                if (naiveNotification) {
                    naiveNotification.destroy();
                    activeNotifications.value.delete(notificationId);
                    notificationButtonsMap.value.delete(notificationId);
                }
            };

            // 执行按钮的 init 函数
            try {
                button.init(closeNotification);
            } catch (error) {
                console.error('Button init function error:', error);
            }
        }
    }
    console.log('Button clicked:', notificationId, buttonIndex);
}

// 全局方法
declare global {
    interface Window {
        createNotification: typeof createNotification;
        handleNotificationButton: typeof handleNotificationButton;
    }
}

window.createNotification = createNotification;
window.handleNotificationButton = handleNotificationButton;

// Chrome 消息监听
interface ChromeNotificationRequest {
    diffuseNotification?: {
        injectPage?: Partial<NotificationConfig>;
        progressBar?: {
            status: string;
            filename: string;
        };
    };
}

chrome.runtime.onMessage.addListener((request: ChromeNotificationRequest) => {
    if (!request.diffuseNotification) return;
    const { injectPage, progressBar } = request.diffuseNotification;
    if (injectPage) {
        createNotification(injectPage);
    }
    if (progressBar) {
        const status = progressBar.status;
        const type = status == "2" ? "success" : status == "1" ? "warning" : status == "0" ? "error" : "info";
        const title = status == "2" ? "上传成功" : status == "1" ? "上传中..." : status == "0" ? "上传失败" : "上传失败";
        const duration = status == "2" ? 15000 : 0;
        const saved = status == "2" ? false : status == "1" ? true : false;
        createNotification({
            title: title,
            type: type,
            content: progressBar.filename,
            duration: duration,
            saved: saved,
        });
    }
});

// Window 消息监听
interface PLNotificationEvent {
    data: {
        type: string;
        data: Partial<NotificationConfig> | string;
    };
}

window.addEventListener('message', (event: PLNotificationEvent) => {
    if (event.data.type === 'PLNotification') {
        const data = typeof event.data.data === "object"
            ? event.data.data as Partial<NotificationConfig>
            : JSON.parse(event.data.data as string) as Partial<NotificationConfig>;
        createNotification(data);
    }
});

// 初始化
onMounted(() => {
    getSavedNotifications((savedNotifications) => {
        savedNotifications.forEach(notification => {
            createNotification(notification);
        });
    });
});
</script>

<style scoped>
/* Naive UI 会处理大部分样式，这里只需要基本的容器样式 */
</style>
