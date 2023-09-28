export enum Platform {
	NODE,
	Browser,
}

// @ts-ignore
export const platform = (() => {
	if (typeof window === 'object') {
		return Platform.Browser;
	} else if (Object.prototype.toString.call(process) === '[object process]') {
		return Platform.NODE;
	}
})();

console.log('platform', platform);

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

export function concatUint8Array(arr: Uint8Array[]) {
	if (platform === Platform.Browser) {
		arr = (arr as ArrayBuffer[]).map(v => new Uint8Array(v)) as Uint8Array[];
	}

	const length = arr.reduce((pre, cV) => pre + cV.length, 0);

	let mergedArray = new Uint8Array(length);
	let offset = 0;
	arr.forEach(v => {
		mergedArray.set(v, offset);
		offset += v.length;
	});

	return mergedArray;
}
