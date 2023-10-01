import axiosBase from 'axios';

const axios = axiosBase.create({});

import AxiosMultiDown from '../src/index';
AxiosMultiDown(axios, {
	max: 5,
	blockSize: 20 * 1024 * 1024,
});

console.time('use range');
axios
	.down({
		url: 'http://127.0.0.1:3000/test/files/100M.test?useRange=1',
		responseType: 'text',
	})
	// .down('http://127.0.0.1:3000/test/files/sample.json?useRange=1')
	.then(d => {
		console.log('d', d);
	})
	.catch(err => {
		console.log('err', err);
	})
	.finally(() => {
		console.timeEnd('use range');
	});

// console.time('not use range');
// axios
// 	.down('http://127.0.0.1:3000/test/files/100M.test')
// 	.then(d => {
// 		console.log('d', d);
// 	})
// 	.catch(err => {
// 		console.log('err', err);
// 	})
// 	.finally(() => {
// 		console.timeEnd('not use range');
// 	});

// axios({
// 	url: 'http://127.0.0.1:3000/test/files/100M.test?useRange=1',
// 	headers: {
// 		Range: 'bytes=0-100000',
// 	},
// 	responseType: 'arraybuffer',
// }).then(resp => {
// 	console.log('resp.data', resp.data);
// 	console.log('resp', resp);
// 	console.log('resp.reuest', resp.config.responseType);
// 	console.log('resp.data.on', resp.data.on);
// 	// resp.data.on('data', (chunk: any) => {
// 	// 	console.log('chunk', chunk);
// 	// });
// });

// axios({
// 	...config,
// 	headers,
// 	signal: controller.signal,
// 	responseType: 'stream',
// }).then(resp => {
// 	resp.data.on('data', (chunk: any) => {
// 		const contentRange = resp.headers['content-range']; // bytes 0-0/104857607
// 		if (chunk.length === 1 && contentRange) {
// 			contentLength = contentRange.split('/')[1];
// 			console.log('contentRange', contentRange, length);
// 		}
// 		controller.abort();
// 	});
// });
