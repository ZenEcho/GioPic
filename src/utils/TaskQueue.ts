class TaskQueue {
    private static instance: TaskQueue;
    private queue: Array<() => Promise<any>> = [];
    private isRunning: boolean = false;

    constructor() {
        if (!TaskQueue.instance) {
            this.queue = [];
            this.isRunning = false;
            TaskQueue.instance = this;
        }
        return TaskQueue.instance;
    }

    // 添加任务到队列并返回任务结果
    enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const wrappedTask = async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            this.queue.push(wrappedTask);
            this.run();
        });
    }

    private async run(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    console.error('任务执行出错:', error);
                }
            }
        }
        this.isRunning = false;
    }
}

const taskQueueInstance = new TaskQueue();
export function taskQueue<T>(task: () => Promise<T>): Promise<T> {
    return taskQueueInstance.enqueue(task);
}