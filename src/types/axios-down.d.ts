import { AxiosRequestConfig, AxiosResponse } from 'axios';

type EventEmitter = {
    on(event: string, listener: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    off(event: string, listener: (...args: any[]) => void): void;
};

interface IDownConfig<T = number | string> {
    max: number;
    blockSize: T;
    testMethod: TEST_METHOD;
    emitter?: EventEmitter;
}

interface IBlockData {
    s: number;
    e: number;
    i: number;
    resp?: AxiosResponse;
}

interface IAxiosDownResponse<T = any, D = any> extends AxiosResponse<T, D> {
    isMulti: boolean;
    queue: IBlockData[];
    downConfig: IDownConfig;
}

type testContentLength = number | null;

interface AxiosDownMethod {
    <T = any, R = IAxiosDownResponse<T>, D = any>(url: string): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(url: string, config: AxiosRequestConfig<D>): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(config: AxiosRequestConfig<D>, downConfig: Partial<IDownConfig> = downConfigGlobal): Promise<R>;
    <T = any, R = IAxiosDownResponse<T>, D = any>(url: string, config: AxiosRequestConfig<D>, downConfig: Partial<IDownConfig> = downConfigGlobal): Promise<R>;
}

declare module 'axios' {
    interface AxiosInstance {
        down: AxiosDownMethod;
    }
}
