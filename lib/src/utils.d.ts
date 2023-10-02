import { PLATFORM } from './const';
import { IBlockData, IDownConfig } from './types/axios-down';
export declare const platform: PLATFORM | undefined;
/**
 * @name:切割符合 Range 格式的数组
 * @description: 尽量均分，多余的分配到前 m 项中
 * @example
 *       n=100 m=6 ['0-16', '17-33', '34-50', '51-67', '68-83', '84-100']
 * @param {number} n 要切割的数量
 * @param {number} m 要切割的份数
 * @return {string[]}  Range 格式数组
 */
export declare function splitRangeArr(n: number, m: number): string[];
export declare function splitArr(l: number, size: number): IBlockData[];
export declare function concatUint8Array(arr: Uint8Array[]): Uint8Array;
export declare function checkDownConfig(o: IDownConfig): IDownConfig<number>;
export declare function blockSizeValue(size: string | number): number;
