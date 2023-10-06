import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { EventEmitter } from '../event';

interface EventsDefault {
    preDown: (queue: IBlockData[], config: IDownConfig) => void;
    data: (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void;
    blockError: (block: IBlockData, queue: IBlockData[], config: IDownConfig) => void;
    end: (queue: IBlockData[], config: IDownConfig) => void;
    finishErr: (errQueue: IBlockData[], queue: IBlockData[], config: IDownConfig) => void;
}

type IDownConfigOnHook = { [K in keyof EventsDefault as `on${Capitalize<K & string>}`]?: EventsDefault[K] };
type IDownConfigOnceHook = { [K in keyof EventsDefault as `once${Capitalize<K & string>}`]?: EventsDefault[K] };

//  extends IDownConfigHook
interface IDownConfig extends IDownConfigOnHook, IDownConfigOnceHook {
    max: number;
    blockSize: number | string;
    testMethod: TEST_METHOD;
    emitter?: EventEmitter;
    maxRetries: number;
    retryInterval: number;
    errMode: ERROR_MODE;
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
