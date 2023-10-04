import { AxiosInstance, AxiosRequestConfig, ResponseType, AxiosResponse } from 'axios';
import { checkDownConfig, concatUint8Array, platform, splitArr } from './utils';
import { PLATFORM, TEST_METHOD, downConfigDefault } from './const';
import type { IAxiosDownResponse, IBlockData, IDownConfig, rangeSupportRes } from './types/axios-down';
import { EventEmitter } from './event';

function AxiosMultiDown(
    axios: AxiosInstance,
    downConfigGlobal: Partial<IDownConfig> = downConfigDefault,
): AxiosInstance {
    axios.down = async function <T = any, D = any>(
        configOrUrl: string | AxiosRequestConfig<D>,
        config?: AxiosRequestConfig<D> | Partial<IDownConfig>,
        downConfig?: Partial<IDownConfig>,
    ): Promise<IAxiosDownResponse<T, D>> {
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

        const [isSupport, contentLength] = await testRangeSupport<D>(axios, downConfigUse, axiosConfig);

        if (!isSupport || !contentLength) {
            const r = await downByOne<T, D>(axios, axiosConfig, downConfigUse);
            return r;
        } else {
            const queue = splitArr(contentLength, downConfigUse.blockSize);
            downConfigUse.max = downConfigUse.max <= queue.length ? downConfigUse.max : queue.length;

            downConfigUse.emitter?.emit('preDown', queue, downConfigUse);
            let r;
            if (downConfigUse.max === 1) {
                r = await downByOne<T, D>(axios, axiosConfig, downConfigUse);
            } else {
                r = await downByMulti<T, D>(axios, axiosConfig, downConfigUse, queue, contentLength);
            }
            return r;
        }
    };

    return axios;
}

async function testRangeSupport<D>(
    axios: AxiosInstance,
    downConfig: IDownConfig,
    axiosConfig: AxiosRequestConfig<D>,
): Promise<rangeSupportRes> {
    const { testMethod } = downConfig;
    const headers = {
        ...axiosConfig.headers,
        Range: 'bytes=0-0',
    };

    const testAxiosConfig: AxiosRequestConfig = {
        ...axiosConfig,
        headers,
    };

    let resp: AxiosResponse;

    if (testMethod === TEST_METHOD.HEAD || platform === PLATFORM.Browser) {
        resp = await testByHead(axios, testAxiosConfig);
    } else {
        resp = await testBySelf(axios, testAxiosConfig);
    }

    if (resp) {
        return rangeIsSupport(resp.headers);
    } else {
        return [false, null];
    }
}

function rangeIsSupport(headers: AxiosResponse['headers']): [boolean, number] {
    // 有些服务器返回的是全长， 且 head 中不返回 contentRange； 如 GithubPage

    const isAccept = headers['accept-ranges'] === 'bytes';
    const contentRange = headers['content-range']; // bytes 0-0/104857607
    const contentLength = Number(headers['content-length']);

    const isSupport = isAccept || !!contentRange || contentLength === 1;

    const length = contentRange ? Number(contentRange.split('/')[1]) : contentLength;

    return [isSupport, length];
}

function testByHead(axios: AxiosInstance, testAxiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise(resolve => {
        axios({ ...testAxiosConfig, method: TEST_METHOD.HEAD })
            .then(resp => {
                resolve(resp);
            })
            .catch(err => {
                resolve(err.response || null);
            });
    });
}

function testBySelf(axios: AxiosInstance, testAxiosConfig: AxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise(resolve => {
        const controller = new AbortController();

        axios({ ...testAxiosConfig, signal: controller.signal, responseType: 'stream' })
            .then(resp => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                resp.data.on('data', (chunk: unknown) => {
                    resolve(resp);
                    controller.abort();
                });
            })
            .catch(err => {
                resolve(err.response || null);
            });
    });
}

async function downByOne<T, D>(
    axios: AxiosInstance,
    axiosConfig: AxiosRequestConfig<D>,
    downConfig: IDownConfig,
): Promise<IAxiosDownResponse<T>> {
    const resp = await axios<T, any>(axiosConfig);
    const blockData: IBlockData = { s: 0, e: resp.headers['content-length'] - 1, i: 0, resp: resp };
    const queue: IBlockData[] = [blockData];

    downConfig.emitter?.emit('data', blockData, queue, downConfig);
    downConfig.emitter?.emit('end', queue, downConfig);

    const downResponse = { ...resp, isMulti: false, downConfig, queue: queue };

    return downResponse;
}

function downByMulti<T = any, D = any>(
    axios: AxiosInstance,
    axiosConfig: AxiosRequestConfig<D>,
    downConfig: IDownConfig,
    queue: IBlockData[],
    totalContentLength: number,
): Promise<IAxiosDownResponse<T>> {
    return new Promise(resolveAll => {
        let downResponse: IAxiosDownResponse<T>;
        const defaultResponseType: ResponseType = axiosConfig.responseType || 'json';

        let curr = 0;
        let active = 0;

        queue.forEach(block => {
            const fn = (): Promise<IAxiosDownResponse<T>> =>
                new Promise(resolve => {
                    curr++;
                    active++;

                    const headers = {
                        ...(axiosConfig?.headers || {}),
                        Range: `bytes=${block.s}-${block.e}`,
                    };

                    axios<any>({ ...axiosConfig, headers, responseType: 'arraybuffer' })
                        .then(resp => {
                            resp.data = resp.data instanceof ArrayBuffer ? new Uint8Array(resp.data) : resp.data;

                            block.resp = resp;
                            downConfig.emitter?.emit('data', block, queue, downConfig);

                            // 第一个请求作为 down response
                            if (!downResponse) {
                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue: queue,
                                };
                            }

                            // 最后一个请求
                            if (curr === queue.length && active === 1) {
                                downConfig.emitter?.emit('end', queue, downConfig);
                                resp.data = concatUint8Array(
                                    queue.map(v => {
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
                                            } catch (error: any) {
                                                // ignore error
                                            }
                                        }
                                        break;
                                    case 'text': {
                                        resp.data = new TextDecoder('utf-8').decode(resp.data);
                                        resp.config.responseType = defaultResponseType;
                                    }
                                    // eslint-disable-next-line no-fallthrough
                                    default:
                                        break;
                                }

                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue,
                                };

                                downResponse.status = 200;
                                downResponse.statusText = 'OK';
                                downResponse.headers['content-type'] = totalContentLength;
                                resolveAll(downResponse);
                            }

                            resolve(downResponse);
                        })
                        .catch(err => {
                            console.log('down block err', block, err);
                        })
                        .finally(() => {
                            active--;
                            if (curr < queue.length && (active < downConfig.max || downConfig.max === 1)) {
                                queue[curr].down!();
                            }
                        });
                });

            block.down = fn;
        });

        for (let i = 0; i < downConfig.max; i++) {
            queue[i].down!();
        }
    });
}

AxiosMultiDown.EventEmitter = EventEmitter;

export default AxiosMultiDown;
