import * as fs from 'fs';
import * as crypto from 'crypto';

export function md5(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash('md5');
		const stream = fs.createReadStream(filePath);

		stream.on('data', data => {
			hash.update(data);
		});

		stream.on('end', () => {
			const md5sum = hash.digest('hex');
			resolve(md5sum);
		});

		stream.on('error', error => {
			reject(error);
		});
	});
}

// const filePath = './test/100M.test';

// (async () => {
// 	const s = await md5(filePath);
// 	console.log('s', s);
// })();
