import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IDownOptions {
	max: number;
	testMethod?: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

interface IAxiosDownResponse<T = any, D = any> {
	data: T;
	status: number;
	statusText: string;
	headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
	config: InternalAxiosRequestConfig<D>;
	request?: any;
	isMulti: boolean;
}

type testContentLength = number | null;

interface AxiosDownMethod {
	<T = any, R = IAxiosDownResponse<T>, D = any>(configOrUrl: string | AxiosRequestConfig<D>, config?: AxiosRequestConfig<D>): Promise<R>;
}

declare module 'axios' {
	interface AxiosInstance {
		down: AxiosDownMethod;
	}
}
