import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const DIR_PUBLIC = '../../';

export function testServer(): Promise<http.Server> {
	return new Promise(resolve => {
		const s = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
			// 获取请求的文件路径
			const filePath: string = path.join(__dirname, DIR_PUBLIC, req.url || '');

			// 读取文件
			fs.readFile(filePath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
				if (err) {
					if (err.code === 'ENOENT') {
						// 文件不存在
						res.statusCode = 404;
						res.end('File Not Found');
					} else {
						// 其他错误
						res.statusCode = 500;
						res.end('Internal Server Error');
					}
				} else {
					// 设置响应头，支持Range属性
					res.setHeader('Accept-Ranges', 'bytes');

					// 如果请求包含Range头，则处理部分内容请求
					const range: string | undefined = req.headers.range;
					if (range) {
						const [start, end] = range.replace('bytes=', '').split('-') as [string, string];
						const totalLength: number = data.length;
						const partialData: Buffer = data.subarray(parseInt(start), parseInt(end) + 1);

						res.statusCode = 206; // Partial Content
						res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
						res.setHeader('Content-Length', partialData.length.toString());
						res.end(partialData);
					} else {
						// 否则，发送整个文件
						res.statusCode = 200;
						res.setHeader('Content-Length', data.length.toString());
						res.end(data);
					}
				}
			});
		});

		const PORT: number = 3000;

		s.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
			resolve(s);
		});
	});
}
