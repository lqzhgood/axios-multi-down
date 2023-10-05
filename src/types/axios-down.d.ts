import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { EventEmitter } from '../event';

interface EventsDefault {
    preDown: (queue: IBlockData[], config: IDownConfig) => void;
    data: (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void;
    blockError: (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void;
    end: (queue: IBlockData[], config: IDownConfig) => void;
}

type IDownConfigHook = { [K in keyof EventsDefault as `on${Capitalize<K & string>}`]?: EventsDefault[K] };

interface IDownConfig<T = number | string> extends IDownConfigHook {
    max: number;
    blockSize: T;
    testMethod: TEST_METHOD;
    emitter?: EventEmitter;
    maxRetries: number;
    retryInterval: number;
}

interface IBlockData {
    s: number;
    e: number;
    i: number;
    retryCount: number;
    resp?: AxiosResponse;
    down?: (isRetry: boolean = false) => Promise<IAxiosDownResponse<T>>;
    isDown?: boolean;
}

interface IAxiosDownResponse<T = any, D = any> extends AxiosResponse<T, D> {
    isMulti: boolean;
    queue: IBlockData[];
    downConfig: IDownConfig;
}

interface IAxiosDownRejectError<T = any, D = any> extends any {
    downResponse?: IAxiosDownResponse<T, D>;
}

type rangeSupportRes = [boolean, number | null];

interface AxiosDownMethod {
    <T = any, R = IAxiosDownResponse<T>>(url: string): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(url: string, config: AxiosRequestConfig<D>): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(
        config: AxiosRequestConfig<D>,
        downConfig: Partial<IDownConfig> = downConfigGlobal,
    ): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(
        url: string,
        config: AxiosRequestConfig<D>,
        downConfig: Partial<IDownConfig> = downConfigGlobal,
    ): Promise<R>;
}

declare module 'axios' {
    interface AxiosInstance {
        down: AxiosDownMethod;
    }
}
