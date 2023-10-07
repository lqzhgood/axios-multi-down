import { AxiosInstance, AxiosRequestConfig, ResponseType, AxiosResponse } from 'axios';
import { capitalizeFirstLetter, checkDownConfig, concatUint8Array, platform, splitArr } from './utils';
import { ERROR_MODE, PLATFORM, TEST_METHOD, downConfigDefault } from './const';
import type {
    EventsDefault,
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

        // 参数处理
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

        // begin
        const downConfigUse = checkDownConfig(_downConfigUse);

        const [isSupport, contentLength] = await testRangeSupport<D>(axios, downConfigUse, axiosConfig);

        if (!isSupport || !contentLength) {
            const r = await downByOne<T, D>(axios, axiosConfig, downConfigUse);
            return r;
        } else {
            const queue = splitArr(contentLength, downConfigUse.blockSize as number);
            downConfigUse.max = downConfigUse.max <= queue.length ? downConfigUse.max : queue.length;

            downEventAndHook(downConfigUse, 'preDown', queue, downConfigUse);

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
    const blockData: IBlockData = {
        s: 0,
        e: 0,
        i: 0,
        retryCount: 0,
    };
    const queue: IBlockData[] = [blockData];
    let downResponse = { isMulti: false, downConfig, queue: queue };

    return new Promise((resolve, reject) => {
        function fn() {
            return axios<T>(axiosConfig)
                .then(resp => {
                    blockData.isDown = true;
                    blockData.e = resp.headers['content-length'] - 1;
                    blockData.resp = resp;

                    downEventAndHook(downConfig, 'data', blockData, queue, downConfig);
                    downEventAndHook(downConfig, 'end', queue, downConfig);

                    downResponse = { ...resp, ...downResponse };
                    resolve(downResponse as IAxiosDownResponse<T>);
                    return downResponse as IAxiosDownResponse<T>;
                })
                .catch(err => {
                    blockData.isDown = false;

                    downEventAndHook(downConfig, 'blockError', blockData, queue, downConfig);

                    if (blockData.retryCount < downConfig.maxRetries) {
                        blockData.retryCount++;
                        setTimeout(() => {
                            fn();
                        }, downConfig.retryInterval);
                    } else {
                        if (err.response) {
                            downResponse = { ...err.response, downResponse };
                        }
                        err.downResponse = downResponse;
                        if (downConfig.errMode !== ERROR_MODE.WAIT) {
                            reject(err as IAxiosDownRejectError<T, D>);
                        }
                        downEventAndHook(
                            downConfig,
                            'finishErr',
                            queue.filter(v => !v.resp),
                            queue,
                            downConfig,
                        );
                    }
                    return downResponse as IAxiosDownResponse<T>;
                });
        }
        blockData.down = fn;
        fn();
    });
}

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
                        // retry 是延迟且异步的，所以 active 在异步之时已经赋值
                        active++;
                    }
                    block.isDown = true;

                    const headers = {
                        ...(axiosConfig?.headers || {}),
                        Range: `bytes=${block.s}-${block.e}`,
                    };

                    axios<any>({ ...axiosConfig, headers, responseType: 'arraybuffer' })
                        .then(resp => {
                            resp.data = resp.data instanceof ArrayBuffer ? new Uint8Array(resp.data) : resp.data;

                            // 赋值代表这个 block 下载成功
                            block.resp = resp;

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

                            downEventAndHook(downConfig, 'data', block, queue, downConfig);

                            resolve(downResponse);
                        })
                        .catch(err => {
                            downEventAndHook(downConfig, 'blockError', block, queue, downConfig);

                            resolve(downResponse);
                            return err;
                        })
                        .then(err => {
                            active--;
                            block.isDown = false;
                            if (active >= downConfig.max) {
                                return;
                            }

                            // 先执行正常下载队列
                            if (curr < queue.length) {
                                queue[curr].down!();
                                return;
                            }

                            // 最后再查找之前下载失败的， 进行重试
                            const fail = queue.find(v => !v.resp && !v.isDown && v.retryCount < downConfig.maxRetries);
                            if (fail) {
                                active++;
                                fail.retryCount++;
                                fail.isDown = true;
                                setTimeout(() => {
                                    fail.down!(true);
                                }, downConfig.retryInterval);
                                return;
                            }

                            // 全部下载完成
                            if (active !== 0) {
                                return;
                            }

                            // 全部下完 但 有一些失败 返回结果
                            if (queue.filter(v => !v.resp).length !== 0) {
                                if (downConfig.errMode !== ERROR_MODE.WAIT) {
                                    // 如果最后还有没下载完的 抛出异常
                                    err.downResponse = downResponse;
                                    rejectAll(err as IAxiosDownRejectError<T, D>);
                                }
                                downEventAndHook(
                                    downConfig,
                                    'finishErr',
                                    queue.filter(v => !v.resp),
                                    queue,
                                    downConfig,
                                );
                                return;
                            }

                            // 全部下载成功，返回结果
                            downEventAndHook(downConfig, 'end', queue, downConfig);

                            (downResponse as IAxiosDownResponse<Uint8Array>).data = concatUint8Array(
                                queue.map(v => {
                                    return v.resp!.data;
                                }),
                            );

                            convertResponseType(downResponse, defaultResponseType);

                            downResponse.status = 200;
                            downResponse.statusText = 'OK';
                            downResponse.headers['content-type'] = totalContentLength;
                            resolveAll(downResponse);
                        });
                });

            block.down = fn;
        });

        for (let i = 0; i < downConfig.max; i++) {
            queue[i].down!();
        }
    });
}

function downEventAndHook<K extends keyof EventsDefault>(
    downConfig: IDownConfig,
    name: K,
    ...args: Parameters<EventsDefault[K]>
) {
    downConfig.emitter?.emit(name, ...args);

    const onHookName = ('on' + capitalizeFirstLetter<K>(name)) as `on${Capitalize<K>}`;
    const onHookFn = downConfig[onHookName] as EventsDefault[K];
    // @ts-ignore
    onHookFn && onHookFn(...args);

    const onceHookName = ('once' + capitalizeFirstLetter<K>(name)) as `once${Capitalize<K>}`;
    const onceHookFn = downConfig[onceHookName] as EventsDefault[K];
    // @ts-ignore
    onceHookFn && onceHookFn(...args);
    downConfig[onceHookName] = undefined;
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

function RetryQueue(errQueue: IBlockData[], config: IDownConfig): void {
    errQueue = errQueue.filter(v => !v.resp);

    for (let i = 0; i < errQueue.length; i++) {
        const b = errQueue[i];
        b.retryCount = 0;
    }
    for (let i = 0; i < Math.min(config.max, errQueue.length); i++) {
        const b = errQueue[i];
        b.down!();
    }
}

AxiosMultiDown.EventEmitter = EventEmitter;
AxiosMultiDown.RetryQueue = RetryQueue;
AxiosMultiDown.const = {
    ERROR_MODE,
    TEST_METHOD,
};

export default AxiosMultiDown;
