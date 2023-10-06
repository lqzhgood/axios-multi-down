import { EventsDefault } from './types/axios-down';
export declare class EventEmitter<T extends Record<string, any> = EventsDefault> {
    private events;
    on<K extends keyof T>(event: K, listener: T[K]): void;
    once<K extends keyof T>(event: K, listener: T[K]): void;
    off<K extends keyof T>(event: K, listener: T[K]): void;
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void;
}
