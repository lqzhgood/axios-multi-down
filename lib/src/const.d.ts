import type { IDownConfig } from './types/axios-down';
export declare enum ERROR_MODE {
    RETURN = "RETURN",
    WAIT = "WAIT"
}
export declare enum TEST_METHOD {
    HEAD = "HEAD",
    SELF = "SELF"
}
export declare enum PLATFORM {
    NODE = 0,
    Browser = 1
}
export declare const downConfigDefault: IDownConfig;
