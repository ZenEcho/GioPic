import { defineStore } from 'pinia';
import { ref } from 'vue';


export const useAppSettings = defineStore('appSettings', () => {
    const DarkMode = ref<boolean>(localStorage.getItem('DarkMode') === 'true' || false); // 暗黑模式状态
    const SidebarCollapsed = ref<boolean>(localStorage.getItem('SidebarCollapsed') === 'true' || false); // 侧边栏开关状态
    const ConfigCollapsed = ref<boolean>(localStorage.getItem('ConfigCollapsed') === 'true' || false); // 配置记录侧边栏开关状态
    const ProgramInstallationStatus = ref<boolean>(false); //程序安装状态
    const SettingSwitchStatus = ref<boolean>(false); //设置开关状态

    function setDarkMode(value: boolean): void {
        DarkMode.value = value;
        localStorage.setItem('DarkMode', value.toString());
    }
    function setSidebarCollapsed(value: boolean): void {
        SidebarCollapsed.value = value;
        localStorage.setItem('SidebarCollapsed', value.toString());
    }
    function setConfigCollapsed(value: boolean): void {
        ConfigCollapsed.value = value;
        localStorage.setItem('ConfigCollapsed', value.toString());
    }
    function setProgramInstallationStatus(value: boolean): void {
        ProgramInstallationStatus.value = value;
    }
    function setSettingSwitchStatus(value: boolean): void {
        SettingSwitchStatus.value = value;
    }
    return {
        DarkMode,
        SidebarCollapsed,
        ConfigCollapsed,
        ProgramInstallationStatus,
        SettingSwitchStatus,
        setDarkMode,
        setSidebarCollapsed,
        setConfigCollapsed,
        setProgramInstallationStatus,
        setSettingSwitchStatus
    };
})


type MessageCallback = (response: any) => void
// 检测桌面端Socket
export const useDesktopAppSocket = defineStore('desktopAppOnline', () => {
    const ws = ref<WebSocket | null>(null)
    const isOnline = ref(false)
    const retryCount = ref(0)
    const maxRetries = 5
    let reconnectTimer: NodeJS.Timeout | null = null

    // 消息队列和回调映射
    const messageQueue = ref<string[]>([])
    const callbackMap = ref<Map<string, MessageCallback>>(new Map())

    // 初始化配置
    const config = {
        url: 'ws://localhost:12345',
        retryBaseDelay: 1000,
        heartbeatInterval: 30000,
        messageTimeout: 10000 // 消息超时时间
    }

    // 心跳检测
    let heartbeatTimer: NodeJS.Timeout

    // 主连接方法
    const connect = () => {
        cleanup() // 清理旧连接

        ws.value = new WebSocket(config.url)
        ws.value.onopen = () => {
            isOnline.value = true
            retryCount.value = 0
            startHeartbeat()
            flushMessageQueue() // 连接成功后发送缓存消息
        }

        ws.value.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'ping') {
                    ws.value?.send(JSON.stringify({ type: 'pong' }))
                } else if (data.requestId && callbackMap.value.has(data.requestId)) {
                    // 处理回调
                    const callback = callbackMap.value.get(data.requestId)!
                    callback(data)
                    callbackMap.value.delete(data.requestId)
                }
            } catch (e) {
                console.error('消息解析失败:', e)
            }
        }

        ws.value.onclose = (event) => {
            isOnline.value = false
            handleReconnect(event)
            stopHeartbeat()
        }

        ws.value.onerror = (error) => {
            console.error('WebSocket error:', error)
            ws.value?.close()
        }
    }

    // 发送消息（支持回调）
    const sendMessage = <T = any>(message: any, callback?: MessageCallback): Promise<T> => {
        return new Promise((resolve, reject) => {
            const requestId = generateRequestId()
            const payload = {
                ...message,
                requestId,
                timestamp: Date.now()
            }

            if (callback) {
                callbackMap.value.set(requestId, (response) => {
                    callback(response)
                    resolve(response)
                })
            } else {
                callbackMap.value.set(requestId, resolve)
            }

            if (ws.value?.readyState === WebSocket.OPEN) {
                ws.value.send(JSON.stringify(payload))
            } else {
                messageQueue.value.push(JSON.stringify(payload))
            }

            // 超时处理
            setTimeout(() => {
                if (callbackMap.value.has(requestId)) {
                    callbackMap.value.delete(requestId)
                    reject(new Error('消息响应超时'))
                }
            }, config.messageTimeout)
        })
    }

    // 生成唯一请求ID
    const generateRequestId = () => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // 发送缓存消息
    const flushMessageQueue = () => {
        while (messageQueue.value.length > 0) {
            const message = messageQueue.value.shift()!
            ws.value?.send(message)
        }
    }

    // 自动重连策略
    const handleReconnect = (event: CloseEvent) => {
        if (retryCount.value >= maxRetries) return

        const delay = config.retryBaseDelay * Math.pow(2, retryCount.value)
        retryCount.value++

        reconnectTimer = setTimeout(() => {
            connect()
        }, Math.min(delay, 30000)) // 最大延迟30秒
    }

    // 心跳机制
    const startHeartbeat = () => {
        heartbeatTimer = setInterval(() => {
            if (ws.value?.readyState === WebSocket.OPEN) {
                ws.value.send(JSON.stringify({ type: 'ping' }))
            }
        }, config.heartbeatInterval)
    }

    const stopHeartbeat = () => {
        clearInterval(heartbeatTimer)
    }

    // 资源清理
    const cleanup = () => {
        if (ws.value) {
            ws.value.onopen = null
            ws.value.onclose = null
            ws.value.onerror = null
            ws.value.close()
        }
        if (reconnectTimer) clearTimeout(reconnectTimer)
    }

    // 主动重连
    const reconnect = () => {
        retryCount.value = 0
        connect()
    }

    // 组件卸载时清理
    onUnmounted(() => {
        cleanup()
        stopHeartbeat()
    })
    connect() // 初始化连接
    return { isOnline, sendMessage, reconnect }
})
