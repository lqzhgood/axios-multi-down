import { AxiosInstance } from 'axios';
import type { IDownConfig } from './types/axios-down';
declare function AxiosMultiDown(axios: AxiosInstance, downConfigGlobal?: Partial<IDownConfig>): AxiosInstance;
declare namespace AxiosMultiDown {
    var EventEmitter: typeof import("./emit").EventEmitter;
}
export default AxiosMultiDown;
