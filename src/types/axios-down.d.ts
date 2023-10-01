import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IDownConfig {
	max: number;
	blockSize: number;
	testMethod: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

interface IBlockState {
	s: number;
	e: number;
	data?: Uint8Array;
}

interface IAxiosDownResponse<T = any, D = any> extends AxiosResponse<T, D> {
	isMulti: boolean;
	queue: IBlockState[];
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
