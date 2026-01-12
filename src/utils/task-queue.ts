import { reactive, watch } from 'vue'

export type TaskStatus = 'pending' | 'processing' | 'success' | 'error' | 'paused'

export interface ITask {
    id: string
    status: TaskStatus
    [key: string]: any
}

export type TaskProcessor<T> = (task: T) => Promise<void>

export class TaskQueue<T extends ITask> {
    public items = reactive<T[]>([])
    private concurrency: number
    private processor: TaskProcessor<T>
    private activeCount = 0
    private isPaused = false
    private autoStart = true

    constructor(processor: TaskProcessor<T>, concurrency = 3, autoStart = true) {
        this.processor = processor
        this.concurrency = concurrency
        this.autoStart = autoStart
        this.isPaused = !autoStart
    }

    add(task: T) {
        if (!task.status) {
            task.status = 'pending'
        }
        // 使用 markRaw 避免 Vue 将传入的 task 转为 Ref，确保 push 的是原始对象
        (this.items as any).push(task)
        if (this.autoStart) {
            this.processNext()
        }
    }

    remove(id: string) {
        const index = this.items.findIndex(i => i.id === id)
        if (index > -1) {
            this.items.splice(index, 1)
        }
    }

    clear() {
        // Only clear non-processing items or force clear?
        // Usually clear completed or all. 
        // Let's clear all except processing for safety, or just all.
        // If we remove processing items, we can't stop the promise but we can remove reference.
        this.items.splice(0, this.items.length)
        this.activeCount = 0
    }

    async start() {
        this.isPaused = false
        this.processNext()
    }

    pause() {
        this.isPaused = true
    }

    retry(id: string) {
        const task = this.items.find(i => i.id === id)
        if (task) {
            // 如果是自动模式，设为 pending 并尝试 processNext
            // 如果是手动模式（autoStart=false），通常 retry 意味着我们想重试这一个
            // 但 retry 方法语义通常是“重置状态”。
            // 如果要立即重试，应该调 trigger。
            // 这里我们只重置状态。
            task.status = 'pending'
            if (!this.isPaused) {
                this.processNext()
            }
        }
    }

    retryAllFailed() {
        this.items.forEach(task => {
            if (task.status === 'error') {
                task.status = 'pending'
            }
        })
        this.start()
    }

    private async runTask(task: T) {
        this.activeCount++
        task.status = 'processing'

        try {
            await this.processor(task)
            task.status = 'success'
        } catch (error) {
            console.error('Task failed:', error)
            task.status = 'error'
        } finally {
            this.activeCount--
            this.processNext()
        }
    }

    private async processNext() {
        if (this.isPaused) return
        if (this.activeCount >= this.concurrency) return

        const nextTask = this.items.find(t => t.status === 'pending')
        if (!nextTask) return

        // Use runTask but without re-checking conditions (already checked)
        // But runTask is async and we don't await it here to allow concurrency loop
        this.runTask(nextTask as T)
        
        // Try to schedule more if concurrency allows
        if (this.activeCount < this.concurrency) {
            this.processNext() 
        }
    }
    
    // Manual trigger for a specific task
    trigger(id: string) {
        const task = this.items.find(t => t.id === id)
        if (task && task.status !== 'processing') {
             // 强制运行，绕过 isPaused 检查
             // 允许稍微突破并发限制以响应用户操作
             this.runTask(task as T)
        }
    }
}
