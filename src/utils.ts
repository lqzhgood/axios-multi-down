import { PLATFORM, TEST_METHOD } from './const';
import { IBlockData, IDownConfig } from './types/axios-down';

export const platform = (() => {
    if (typeof window === 'object') {
        return PLATFORM.Browser;
    } else if (Object.prototype.toString.call(process) === '[object process]') {
        return PLATFORM.NODE;
    }
})();

/**
 * @name:切割符合 Range 格式的数组
 * @description: 尽量均分，多余的分配到前 m 项中
 * @example
 *       n=100 m=6 ['0-16', '17-33', '34-50', '51-67', '68-83', '84-100']
 * @param {number} n 要切割的数量
 * @param {number} m 要切割的份数
 * @return {string[]}  Range 格式数组
 */
export function splitRangeArr(n: number, m: number): string[] {
    if (n <= 0 || m <= 0 || n < m) {
        return ['0-'];
    }

    const quotient = Math.floor(n / m); // 计算每份的整数部分
    const remainder = n % m; // 计算余数

    const result = [];
    let start = 0;
    let end = 0;

    for (let i = 0; i < m; i++) {
        end = start + quotient - 1;
        if (i < remainder) {
            end += 1; // 将余数分配给前面的若干份
        }
        result.push(`${start}-${end}`);
        start = end + 1;
    }

    return result;
}

export function splitArr(l: number, size: number): IBlockData[] {
    if (l <= 0 || size <= 0) {
        console.log('contentLength', l);
        console.log('blockSize', size);
        throw new Error('参数错误');
    }
    const result = [];

    const parts = Math.ceil(l / size);

    for (let i = 0; i < parts; i++) {
        if (i !== parts - 1) {
            result.push({ s: size * i, e: size * (i + 1) - 1, i, retryCount: 0 });
        } else {
            result.push({ s: size * i, e: l - 1, i, retryCount: 0 });
        }
    }

    return result;
}

export function concatUint8Array(arr: Uint8Array[]) {
    // if (platform === Platform.Browser) {
    // 	arr = (arr as ArrayBuffer[]).map(v => new Uint8Array(v));
    // }

    const length = arr.reduce((pre, cV) => pre + cV.length, 0);

    const mergedArray = new Uint8Array(length);
    let offset = 0;
    arr.forEach(v => {
        mergedArray.set(v, offset);
        offset += v.length;
    });

    return mergedArray;
}

export function checkDownConfig(o: IDownConfig) {
    if (typeof o.max !== 'number') {
        throw new Error(`downConfig.max must be number, got ${o.max}`);
    }
    o.blockSize = blockSizeValue(o.blockSize);
    if (![TEST_METHOD.HEAD, TEST_METHOD.SELF].includes(o.testMethod)) {
        throw new Error(`downConfig.testMethod must be head | self , got ${o.testMethod}`);
    }
    return o as IDownConfig<number>;
}

export function blockSizeValue(size: string | number): number {
    if (typeof size === 'number') {
        if (size <= 0) {
            throw new Error(`downConfig.blockSize number must be > 0 , got ${size}`);
        }
        return size;
    }
    if (/^\d+K$/.test(size)) {
        return Number(size.match(/\d+/)![0]) * 1024;
    }
    if (/^\d+M$/.test(size)) {
        return Number(size.match(/\d+/)![0]) * 1024 * 1024;
    }
    if (/^\d+G$/.test(size)) {
        return Number(size.match(/\d+/)![0]) * 1024 * 1024 * 1024;
    }
    if (/^\d+T$/.test(size)) {
        return Number(size.match(/\d+/)![0]) * 1024 * 1024 * 1024 * 1024;
    }
    throw new Error(`downConfig.blockSize string only supported K,M,G,T, got ${size}`);
}

export function sleep(t = 1000) {
    return new Promise(resolve => setTimeout(resolve, t));
}
