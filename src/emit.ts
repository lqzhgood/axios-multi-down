export class EventEmitter {
    private events: Record<string, Array<Function>> = {};

    // 添加事件监听器
    on(event: string, listener: (...args: any[]) => void) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    // 移除事件监听器
    off(event: string, listener: (...args: any[]) => void) {
        if (this.events[event]) {
            const index = this.events[event].indexOf(listener);
            if (index !== -1) {
                this.events[event].splice(index, 1);
            }
        }
    }

    // 触发事件
    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            for (const listener of this.events[event]) {
                listener(...args);
            }
        }
    }
}
