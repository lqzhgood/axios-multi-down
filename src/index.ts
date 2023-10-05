import { AxiosInstance, AxiosRequestConfig, ResponseType, AxiosResponse } from 'axios';
import { checkDownConfig, concatUint8Array, platform, splitArr } from './utils';
import { PLATFORM, TEST_METHOD, downConfigDefault } from './const';
import type {
    IAxiosDownRejectError,
    IAxiosDownResponse,
    IBlockData,
    IDownConfig,
    rangeSupportRes,
} from './types/axios-down';
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

function downByOne<T, D>(
    axios: AxiosInstance,
    axiosConfig: AxiosRequestConfig<D>,
    downConfig: IDownConfig,
): Promise<IAxiosDownResponse<T>> {
    let retryCount = 0;

    return new Promise((resolve, reject) => {
        function fn() {
            axios<T>(axiosConfig)
                .then(resp => {
                    const blockData: IBlockData = {
                        s: 0,
                        e: resp.headers['content-length'] - 1,
                        i: 0,
                        resp: resp,
                        retryCount: retryCount,
                    };
                    const queue: IBlockData[] = [blockData];

                    downConfig.emitter?.emit('data', blockData, queue, downConfig);
                    downConfig.emitter?.emit('end', queue, downConfig);

                    const downResponse: IAxiosDownResponse<T> = { ...resp, isMulti: false, downConfig, queue: queue };
                    resolve(downResponse);
                })
                .catch((err: IAxiosDownRejectError<T, D>) => {
                    if (retryCount < downConfig.maxRetries) {
                        setTimeout(() => {
                            fn();
                        }, downConfig.retryInterval);
                    } else {
                        reject(err);
                    }
                    retryCount++;
                });
        }
        fn();
    });
}
let first = 0;

function downByMulti<T = any, D = any>(
    axios: AxiosInstance,
    axiosConfig: AxiosRequestConfig<D>,
    downConfig: IDownConfig,
    queue: IBlockData[],
    totalContentLength: number,
): Promise<IAxiosDownResponse<T>> {
    return new Promise((resolveAll, rejectAll) => {
        let downResponse: IAxiosDownResponse<T>;
        const defaultResponseType: ResponseType = axiosConfig.responseType || 'json';

        let curr = 0;
        let active = 0;

        queue.forEach(block => {
            const fn = (isRetry: boolean = false): Promise<IAxiosDownResponse<T>> =>
                new Promise(resolve => {
                    if (!isRetry) {
                        // retry 在队列末尾额外进行，curr 仅表示正常下载队列的下标
                        curr++;
                        // retry 是延迟且异步的，所以 active 在异步之前已经赋值
                        active++;
                    }

                    const headers = {
                        ...(axiosConfig?.headers || {}),
                        Range: `bytes=${block.s}-${block.e}`,
                    };

                    axios<any>({ ...axiosConfig, headers, responseType: 'arraybuffer' })
                        .then(resp => {
                            if (block.i === 0 && first == 0) {
                                first++;
                                throw new Error('i=0');
                                return;
                            }

                            resp.data = resp.data instanceof ArrayBuffer ? new Uint8Array(resp.data) : resp.data;

                            // 赋值代表这个 block 下载成功
                            block.resp = resp;
                            downConfig.emitter?.emit('data', block, queue, downConfig);

                            // 第一个请求作为 down response;
                            // i==0 可能不是第一个下完的
                            if (!downResponse) {
                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue: queue,
                                };
                            }

                            // 最后一个请求
                            if (block.i === queue.length - 1) {
                                downResponse = {
                                    ...resp,
                                    isMulti: true,
                                    downConfig,
                                    queue: queue,
                                };
                            }
                            resolve(downResponse);
                        })
                        .catch(err => {
                            block.retryCount++;
                            resolve(downResponse);
                            console.log('down block err', block, err);
                            return err;
                        })
                        .then((err: IAxiosDownRejectError<T, D>) => {
                            active--;

                            if (active < downConfig.max) {
                                // 先执行正常下载的
                                if (curr < queue.length) {
                                    queue[curr].down!();
                                } else {
                                    // 最后再查找之前未下载完成的
                                    const fail = queue.find(v => !v.resp && v.retryCount < downConfig.maxRetries);
                                    if (fail) {
                                        active++;
                                        setTimeout(() => {
                                            fail.down!(true);
                                        }, downConfig.retryInterval);
                                    } else {
                                        // 全部下完
                                        if (active === 0) {
                                            if (queue.filter(v => !v.resp).length !== 0) {
                                                // 如果最后还有没下载完的 抛出异常
                                                err.downResponse = downResponse;
                                                rejectAll(err);
                                            } else {
                                                downConfig.emitter?.emit('end', queue, downConfig);

                                                (downResponse as IAxiosDownResponse<Uint8Array>).data =
                                                    concatUint8Array(
                                                        queue.map(v => {
                                                            return v.resp!.data;
                                                        }),
                                                    );

                                                convertResponseType(downResponse, defaultResponseType);

                                                downResponse.status = 200;
                                                downResponse.statusText = 'OK';
                                                downResponse.headers['content-type'] = totalContentLength;
                                                resolveAll(downResponse);
                                            }
                                        }
                                    }
                                }
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

function convertResponseType(resp: AxiosResponse, defaultResponseType: ResponseType) {
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
    return resp;
}

AxiosMultiDown.EventEmitter = EventEmitter;

export default AxiosMultiDown;
