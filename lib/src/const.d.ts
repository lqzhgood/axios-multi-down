import type { IDownConfig } from './types/axios-down';
export declare enum TEST_METHOD {
    HEAD = 'head',
    SELF = 'self',
}
export declare enum PLATFORM {
    NODE = 0,
    Browser = 1,
}
export declare const downConfigDefault: IDownConfig;
