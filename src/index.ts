import { AxiosInstance, AxiosRequestConfig, CancelToken, Method } from 'axios';
import { concatUint8Array, splitRangeArr } from './utils';

enum TEST_METHOD {
	HEAD = 'head',
	SELF = 'self',
}

interface IDownOptions {
	max: number;
	testMethod: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

const defaultOptions: IDownOptions = {
	max: 3,
	testMethod: TEST_METHOD.SELF,
};

declare module 'axios' {
	interface AxiosInstance {
		down: any;
	}
}

// d.info.hns5j.com/100M.test
export default function axiosMultiDown(axios: AxiosInstance, options: IDownOptions = defaultOptions): AxiosInstance {
	axios.down = async function <D = any>(axiosConfig: AxiosRequestConfig<D>) {
		const downOptions: IDownOptions = { ...defaultOptions, ...options };

		const contentLength = await testRangeSupport(axios, downOptions, axiosConfig);

		let defaultResponseType = axiosConfig.responseType || 'json';

		// not support
		if (!contentLength) {
			const data = await axios(axiosConfig);
			return data;
		} else {
			const rangeArr = splitRangeArr(contentLength, downOptions.max);

			const data = await Promise.all(
				rangeArr.map(r => {
					const headers = {
						...axiosConfig.headers,
						Range: `bytes=${r}`,
					};

					return axios({ ...axiosConfig, headers, responseType: 'arraybuffer' });
				}),
			);
			const uArr = concatUint8Array(data.map(v => v.data));
			const string = new TextDecoder('utf-8').decode(uArr);

			if (defaultResponseType === 'json') {
				try {
					return JSON.parse(string);
				} catch (error) {
					return string;
				}
			}
			return string;
		}
	};

	return axios;
}

type testContentLength = number | null;

async function testRangeSupport<D>(axios: AxiosInstance, downOptions: IDownOptions, axiosConfig: AxiosRequestConfig<D>) {
	const { testMethod } = downOptions;
	const headers = {
		...axiosConfig.headers,
		Range: 'bytes=0-0',
	};

	const testAxiosConfig: AxiosRequestConfig = {
		...axiosConfig,
		headers,
	};

	let contentLength: testContentLength = null;

	if (testMethod === TEST_METHOD.HEAD) {
		contentLength = await testByHead(axios, testAxiosConfig);
	} else {
		contentLength = await testBySelf(axios, testAxiosConfig);
	}

	return contentLength;
}

function testByHead(axios: AxiosInstance, testAxiosConfig: AxiosRequestConfig): Promise<testContentLength> {
	return new Promise(resolve => {
		axios({ ...testAxiosConfig, method: TEST_METHOD.HEAD })
			.then(resp => {
				// head  -> body = empty
				const contentRange = resp.headers['content-range']; // bytes 0-0/104857607
				const contentLength: 1 | '1' | undefined = resp.headers['content-length'];

				if (contentLength == 1 && contentRange) {
					resolve(Number(contentRange.split('/')[1]));
				} else {
					resolve(null);
				}
			})
			.catch(err => {
				resolve(null);
			});
	});
}

function testBySelf(axios: AxiosInstance, testAxiosConfig: AxiosRequestConfig): Promise<testContentLength> {
	return new Promise((resolve, reject) => {
		const controller = new AbortController();

		axios({ ...testAxiosConfig, signal: controller.signal, responseType: 'stream' })
			.then(resp => {
				resp.data.on('data', (chunk: any) => {
					const contentRange = resp.headers['content-range']; // bytes 0-0/104857607
					const contentLength: 1 | '1' | undefined = resp.headers['content-length'];

					if (contentLength == 1 && contentRange) {
						resolve(Number(contentRange.split('/')[1]));
					} else {
						resolve(null);
					}
					controller.abort();
				});
			})
			.catch(() => {
				resolve(null);
			});
	});
}

setTimeout(() => {}, 1000000);
