import type { IDownConfig } from './types/axios-down';

export enum ERROR_MODE {
    RETURN = 'RETURN',
    WAIT = 'WAIT',
}

export enum TEST_METHOD {
    HEAD = 'HEAD',
    SELF = 'SELF',
}

export enum PLATFORM {
    NODE,
    Browser,
}

export const downConfigDefault: IDownConfig = {
    max: 3,
    blockSize: '10M', // 10 * 1024 * 1024
    testMethod: TEST_METHOD.HEAD,
    maxRetries: 3,
    retryInterval: 1000,
    errMode: ERROR_MODE.RETURN,
};
