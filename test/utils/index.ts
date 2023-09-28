import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { execSync } from 'child_process';

export function md5File(filePath: string): string {
	const file = fs.readFileSync(filePath, 'utf-8');
	return md5String(file);
}

export function md5String(s: string): string {
	// 创建一个 MD5 散列对象
	const md5Hash = crypto.createHash('md5');

	// 更新散列对象以包含要散列的数据
	md5Hash.update(s, 'utf-8');

	// 计算并获取 MD5 散列的十六进制表示
	const md5Hex = md5Hash.digest('hex');

	return md5Hex;
}

export function makeBigFile(testFile: string, size: number = 100 * 1024 * 1024): void {
	if (!fs.existsSync(path.normalize(testFile))) {
		execSync(`fsutil file createnew ${testFile} ${size}`);
	}
}
