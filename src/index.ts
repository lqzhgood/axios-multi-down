import { AxiosInstance, AxiosRequestConfig, ResponseType } from 'axios';
import { checkDownConfig, concatUint8Array, splitArr } from './utils';
import { TEST_METHOD, downConfigDefault } from './const';
import type { IAxiosDownResponse, IBlockState, IDownConfig, testContentLength } from './types/axios-down';

function AxiosMultiDown(axios: AxiosInstance, downConfigGlobal: Partial<IDownConfig> = downConfigDefault): AxiosInstance {
	axios.down = async function <T = any, D = any>(configOrUrl: string | AxiosRequestConfig<D>, config?: AxiosRequestConfig<D> | Partial<IDownConfig>, downConfig?: Partial<IDownConfig>): Promise<IAxiosDownResponse<T, D>> {
		let axiosConfig: AxiosRequestConfig<D> = {};
		let downConfigUse: IDownConfig = { ...downConfigDefault, ...downConfigGlobal };

		if (arguments.length === 1) {
			if (typeof configOrUrl === 'string') {
				axiosConfig = { url: configOrUrl };
			} else {
				axiosConfig = configOrUrl;
			}
		}

		if (arguments.length === 2) {
			if (typeof configOrUrl === 'string') {
				// url axiosConfig
				axiosConfig = { ...config, url: configOrUrl };
			} else {
				// axiosConfig downConfigs
				axiosConfig = configOrUrl;
				downConfigUse = { ...downConfigUse, ...config };
			}
		}

		if (arguments.length === 3) {
			axiosConfig = { ...config, url: configOrUrl as string };
			downConfigUse = { ...downConfigUse, ...downConfig };
		}

		checkDownConfig(downConfigUse);

		const contentLength = await testRangeSupport<D>(axios, downConfigUse, axiosConfig);

		if (!contentLength) {
			const r = await downByOne<T, D>(axios, axiosConfig, downConfigUse);
			return r;
		} else {
			const queueRes = splitArr(contentLength, downConfigUse.blockSize);
			downConfigUse.max = downConfigUse.max <= queueRes.length ? downConfigUse.max : queueRes.length;
			let r;
			if (downConfigUse.max === 1) {
				r = await downByOne<T, D>(axios, axiosConfig, downConfigUse);
			} else {
				r = await downByMulti<T, D>(axios, axiosConfig, downConfigUse, queueRes);
			}
			return r;
		}
	};

	return axios;
}

async function testRangeSupport<D>(axios: AxiosInstance, downConfig: IDownConfig, axiosConfig: AxiosRequestConfig<D>) {
	const { testMethod } = downConfig;
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

async function downByOne<T, D>(axios: AxiosInstance, axiosConfig: AxiosRequestConfig<D>, downConfig: IDownConfig): Promise<IAxiosDownResponse<T>> {
	const res = await axios<T, any>(axiosConfig);
	const queueRes: IBlockState[] = [{ s: 0, e: res.headers['content-length'] - 1, data: res.data }];
	const downResponse = { ...res, isMulti: false, downConfig, queue: queueRes };
	return downResponse;
}

function downByMulti<T = any, D = any>(axios: AxiosInstance, axiosConfig: AxiosRequestConfig<D>, downConfig: IDownConfig, queueRes: IBlockState[]): Promise<IAxiosDownResponse<T>> {
	return new Promise((resolveAll, rejectAll) => {
		let downResponse: IAxiosDownResponse<T>;
		const defaultResponseType: ResponseType = axiosConfig.responseType || 'json';

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
									downConfig,
									queue: queueRes,
								};
							}

							// 最后一个请求
							if (curr === queueDown.length && active === 1) {
								res.data = concatUint8Array(queueRes.map(v => v.data!));
								switch (defaultResponseType) {
									case 'json':
										{
											try {
												res.data = new TextDecoder('utf-8').decode(res.data);
												res.data = JSON.parse(res.data);
												res.config.responseType = defaultResponseType;
											} catch (error: any) {}
										}
										break;
									case 'text': {
										res.data = new TextDecoder('utf-8').decode(res.data);
										res.config.responseType = defaultResponseType;
									}
									default:
										break;
								}

								downResponse.config = res.config;
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
							if (curr < queueDown.length && (active < downConfig.max || downConfig.max === 1)) {
								queueDown[curr]();
							}
						});
				});

			return fn;
		});

		for (let i = 0; i < downConfig.max; i++) {
			queueDown[i]();
		}
	});
}

// setTimeout(() => {}, 1000000);

export default AxiosMultiDown;
