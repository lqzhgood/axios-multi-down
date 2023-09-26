/**
 * @name:切割符合 Range 格式的数组
 * @description: 尽量均分，多余的分配到前 m 项中
 * @example
 *       n=100 m=6 ['0-16', '17-33', '34-50', '51-67', '68-83', '84-99']
 * @param {number} n 要切割的数量
 * @param {number} m 要切割的份数
 * @return {string[]}  Range 格式数组
 */
export function splitInteger(n: number, m: number): string[] {
	if (m <= 0) {
		return [];
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
