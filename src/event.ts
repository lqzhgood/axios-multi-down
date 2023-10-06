import { EventsDefault } from './types/axios-down';

export class EventEmitter<T extends Record<string, any> = EventsDefault> {
    private events: Record<keyof T, Array<(...args: any[]) => void>> = {} as any;

    // 添加事件监听器
    on<K extends keyof T>(event: K, listener: T[K]) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    once<K extends keyof T>(event: K, listener: T[K]) {
        const onceWrapper = (...args: Parameters<T[K]>) => {
            // 在第一次触发后移除监听器
            this.off(event, onceWrapper as T[K]);
            // 调用原始监听器
            listener(...args);
        };

        // 添加一次性监听器
        this.on(event, onceWrapper as T[K]);
    }

    // 移除事件监听器
    off<K extends keyof T>(event: K, listener: T[K]) {
        if (this.events[event]) {
            const index = this.events[event].indexOf(listener);
            if (index !== -1) {
                this.events[event].splice(index, 1);
            }
        }
    }

    // 触发事件
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
        if (this.events[event]) {
            for (const listener of this.events[event]) {
                listener(...args);
            }
        }
    }
}
