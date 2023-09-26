import { AxiosInstance, AxiosRequestConfig, CancelToken, Method } from 'axios';

enum TEST_METHOD {
	HEAD = 'head',
	SELF = 'self',
}

interface IOptions {
	max: number;
	testMethod: TEST_METHOD.HEAD | TEST_METHOD.SELF;
}

const defaultOptions: IOptions = {
	max: 3,
	testMethod: TEST_METHOD.HEAD,
};

// declare module 'axios' {
// 	interface AxiosInstance {
// 		down: any;
// 	}
// }

// d.info.hns5j.com/100M.test
export default function axiosMultiDown(axios: AxiosInstance, options: IOptions = defaultOptions): AxiosInstance {
	const { max, testMethod }: IOptions = { ...defaultOptions, ...options };

	axios.down = async function <D = any>(config: AxiosRequestConfig<D>) {
		// test 1 byte
		const controller = new AbortController();
		const headers = {
			...config.headers,
			Range: 'bytes=0-0',
		};

		let contentLength;

		if (testMethod === TEST_METHOD.HEAD) {
			const resp = await testByHead();
		} else if (testMethod === TEST_METHOD.SELF) {
			try {
				axios({
					...config,
					headers,
					signal: controller.signal,
					responseType: 'stream',
				}).then(resp => {
					resp.data.on('data', (chunk: any) => {
						const contentRange = resp.headers['content-range']; // bytes 0-0/104857607
						if (chunk.length === 1 && contentRange) {
							contentLength = contentRange.split('/')[1];
							console.log('contentRange', contentRange, length);
						}
						controller.abort();
					});
				});
			} catch (error) {
				console.log('error', error);
			}
		}
	};

	return axios;
}

async function testByHead() {}

function testBySelf(axios: AxiosInstance) {}

setTimeout(() => {}, 1000000);
