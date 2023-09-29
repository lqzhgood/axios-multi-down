import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface IDownOptions {
	max: number;
	blockSize: number;
	testMethod?: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

interface IBlockState {
	s: number;
	e: number;
	data?: Uint8Array;
}

interface IAxiosDownResponse<T = any, D = any> extends AxiosResponse<T, D> {
	isMulti: boolean;
	queue: IBlockState[];
	downOptions: IDownOptions;
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
