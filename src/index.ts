import { AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType } from 'axios';
import { concatUint8Array, splitArr, splitRangeArr } from './utils';
import type { IAxiosDownResponse, IBlockState, IDownOptions, testContentLength } from './types/axios-down';

enum TEST_METHOD {
	HEAD = 'head',
	SELF = 'self',
}

const defaultOptions: IDownOptions = {
	max: 3,
	blockSize: 10 * 1024 * 1024, // 10M
	testMethod: TEST_METHOD.HEAD,
};

function AxiosMultiDown(axios: AxiosInstance, options: Partial<IDownOptions> = defaultOptions): AxiosInstance {
	// @ts-ignore
	axios.down = async function <T = any, D = any>(configOrUrl: string | AxiosRequestConfig<D>, axiosConfig: AxiosRequestConfig<D>): Promise<R> {
		if (typeof configOrUrl === 'string') {
			axiosConfig = axiosConfig || {};
			axiosConfig.url = configOrUrl;
		} else {
			axiosConfig = configOrUrl || {};
		}

		const downOptions: IDownOptions = { ...defaultOptions, ...options };

		const contentLength = await testRangeSupport<D>(axios, downOptions, axiosConfig);

		if (!contentLength) {
			// server not support range
			const res = await axios<T, any>(axiosConfig);
			const queueRes: IBlockState[] = [{ s: 0, e: res.headers['content-length'] - 1, data: res.data }];
			const downResponse = { ...res, isMulti: false, downOptions, queue: queueRes };
			return downResponse;
		} else {
			const r = await downByMulti<T, D>(axios, contentLength, axiosConfig, downOptions);
			return r;
		}
	};

	return axios;
}

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
			.catch(() => {
				resolve(null);
			});
	});
}

function testBySelf(axios: AxiosInstance, testAxiosConfig: AxiosRequestConfig): Promise<testContentLength> {
	return new Promise(resolve => {
		const controller = new AbortController();

		axios({ ...testAxiosConfig, signal: controller.signal, responseType: 'stream' })
			.then(resp => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				resp.data.on('data', (chunk: unknown) => {
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

function downByMulti<T = any, D = any>(axios: AxiosInstance, contentLength: number, axiosConfig: AxiosRequestConfig<D>, downOptions: IDownOptions): Promise<IAxiosDownResponse<T>> {
	return new Promise((resolveAll, rejectAll) => {
		let downResponse: IAxiosDownResponse<T>;

		const defaultResponseType: ResponseType = axiosConfig.responseType || 'json';

		const queueRes = splitArr(contentLength, downOptions.blockSize);
		const max = downOptions.max <= queueRes.length ? downOptions.max : queueRes.length;

		let curr = 0;
		let active = 0;
		const queueDown: (() => Promise<IAxiosDownResponse<T>>)[] = queueRes.map(r => {
			const fn = (): Promise<IAxiosDownResponse<T>> =>
				new Promise((resolve, reject) => {
					curr++;
					active++;

					const headers = {
						...(axiosConfig?.headers || {}),
						Range: `bytes=${r.s}-${r.e}`,
					};

					axios<ArrayBuffer, any>({ ...axiosConfig, headers, responseType: 'arraybuffer' })
						.then(res => {
							// TODO add emit

							r.data = res.data instanceof ArrayBuffer ? new Uint8Array(res.data) : res.data;

							// 第一个请求作为 down response
							if (!downResponse) {
								// 部分 data 没意义 清除
								res.data = null;
								downResponse = {
									...res,
									isMulti: true,
									downOptions,
									queue: queueRes,
								};
							}

							// 最后一个请求
							if (curr === queueDown.length && active === 1) {
								res.data = concatUint8Array(queueRes.map(v => v.data!));
								if (defaultResponseType === 'json') {
									try {
										res.data = new TextDecoder('utf-8').decode(res.data);
										res.data = JSON.parse(res.data);
									} catch (error: any) {
										console.log('is not json error.message', error.message);
									}
								}

								downResponse.data = res.data;
								downResponse.status = 200;
								resolveAll(downResponse);
							}

							resolve(downResponse);
						})
						.catch(err => {
							//
							rejectAll(err);
						})
						.finally(() => {
							active--;
							if (curr < queueDown.length && (active < max || max === 1)) {
								queueDown[curr]();
							}
						});
				});

			return fn;
		});

		for (let i = 0; i < max; i++) {
			queueDown[i]();
		}
	});
}

// setTimeout(() => {}, 1000000);

export default AxiosMultiDown;
