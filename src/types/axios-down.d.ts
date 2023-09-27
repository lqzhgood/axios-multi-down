import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IDownOptions {
	max: number;
	testMethod?: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

type testContentLength = number | null;

// TODO return is not AxiosResponse
interface AxiosDownMethod {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	<T = unknown, R = AxiosResponse<T>, D = unknown>(configOrUrl: string | AxiosRequestConfig<D>, config?: AxiosRequestConfig<D>): Promise<string>;
}

declare module 'axios' {
	interface AxiosInstance {
		down: AxiosDownMethod;
	}
}
