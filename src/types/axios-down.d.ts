import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IDownOptions {
	max: number;
	testMethod: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

type testContentLength = number | null;

// TODO return is not AxiosResponse
interface AxiosDownMethod {
	<T = any, R = AxiosResponse<T>, D = any>(configOrUrl: string | AxiosRequestConfig<D>, config?: AxiosRequestConfig<D>): Promise<string>;
}

declare module 'axios' {
	interface AxiosInstance {
		down: AxiosDownMethod;
	}
}
