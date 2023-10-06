import { AxiosInstance } from 'axios';
import { ERROR_MODE, TEST_METHOD } from './const';
import type { IBlockData, IDownConfig } from './types/axios-down';
declare function AxiosMultiDown(axios: AxiosInstance, downConfigGlobal?: Partial<IDownConfig>): AxiosInstance;
declare namespace AxiosMultiDown {
    export var EventEmitter: typeof import("./event").EventEmitter;
    export var RetryQueue: (errQueue: IBlockData[], config: IDownConfig) => void;
    var _a: {
        ERROR_MODE: typeof ERROR_MODE;
        TEST_METHOD: typeof TEST_METHOD;
    };
    export { _a as const };
}
export default AxiosMultiDown;
