import { AxiosInstance, AxiosRequestConfig, ResponseType } from 'axios';
import { checkDownConfig, concatUint8Array, platform, splitArr } from './utils';
import { PLATFORM, TEST_METHOD, downConfigDefault } from './const';
import type { IAxiosDownResponse, IBlockData, IDownConfig, testContentLength } from './types/axios-down';
import { EventEmitter } from './emit';

function AxiosMultiDown(axios: AxiosInstance, downConfigGlobal: Partial<IDownConfig> = downConfigDefault): AxiosInstance {
    axios.down = async function <T = any, D = any>(configOrUrl: string | AxiosRequestConfig<D>, config?: AxiosRequestConfig<D> | Partial<IDownConfig>, downConfig?: Partial<IDownConfig>): Promise<IAxiosDownResponse<T, D>> {
        let axiosConfig: AxiosRequestConfig<D> = {};
        let _downConfigUse: IDownConfig = { ...downConfigDefault, ...downConfigGlobal };

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
                _downConfigUse = { ..._downConfigUse, ...config };
            }
        }

        if (arguments.length === 3) {
            axiosConfig = { ...config, url: configOrUrl as string };
            _downConfigUse = { ..._downConfigUse, ...downConfig };
        }

        const downConfigUse = checkDownConfig(_downConfigUse);

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
                r = await downByMulti<T, D>(axios, axiosConfig, downConfigUse, queueRes, contentLength);
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

    if (testMethod === TEST_METHOD.HEAD || platform === PLATFORM.Browser) {
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
    const resp = await axios<T, any>(axiosConfig);
    const blockData: IBlockData = { s: 0, e: resp.headers['content-length'] - 1, i: 0, resp: resp };
    downConfig?.emitter.emit('data', blockData);
    downConfig?.emitter.emit('end');
    const queue: IBlockData[] = [blockData];
    const downResponse = { ...resp, isMulti: false, downConfig, queue: queue };

    return downResponse;
}

function downByMulti<T = any, D = any>(axios: AxiosInstance, axiosConfig: AxiosRequestConfig<D>, downConfig: IDownConfig, queueRes: IBlockData[], totalContentLength: number): Promise<IAxiosDownResponse<T>> {
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

                    axios<any>({ ...axiosConfig, headers, responseType: 'arraybuffer' })
                        .then(resp => {
                            resp.data = resp.data instanceof ArrayBuffer ? new Uint8Array(resp.data) : resp.data;

                            r.resp = resp;
                            downConfig?.emitter.emit('data', r);

                            // 第一个请求作为 down response
                            if (!downResponse) {
                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue: queueRes,
                                };
                            }

                            // 最后一个请求
                            if (curr === queueDown.length && active === 1) {
                                downConfig?.emitter.emit('end');
                                resp.data = concatUint8Array(
                                    queueRes.map(v => {
                                        return v.resp!.data;
                                    }),
                                );
                                switch (defaultResponseType) {
                                    case 'json':
                                        {
                                            try {
                                                resp.data = new TextDecoder('utf-8').decode(resp.data);
                                                resp.data = JSON.parse(resp.data);
                                                resp.config.responseType = defaultResponseType;
                                            } catch (error: any) {}
                                        }
                                        break;
                                    case 'text': {
                                        resp.data = new TextDecoder('utf-8').decode(resp.data);
                                        resp.config.responseType = defaultResponseType;
                                    }
                                    default:
                                        break;
                                }

                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue: queueRes,
                                };

                                downResponse.status = 200;
                                downResponse.statusText = 'OK';
                                downResponse.headers['content-type'] = totalContentLength;
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

AxiosMultiDown.EventEmitter = EventEmitter;

export default AxiosMultiDown;
