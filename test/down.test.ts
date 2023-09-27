import * as http from 'http';
import * as fs from 'fs';
import axiosBase from 'axios';
import _ from 'lodash';

import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';

import { testServer } from './utils/http-server';
import { makeBigFile, md5File, md5String } from './utils';

import axiosMultiDown from '../src/index';

const PORT = 3000;
const testFile = (f = '') => 'test/files/' + f;
const testUrl = (f = '', useRange = false) => `http://127.0.0.1:${PORT}/${testFile(f)}?${useRange && 'useRange=1'}`;

let server: http.Server;

beforeAll(async () => {
	server = await testServer(PORT);
	if (!fs.existsSync('../test/files')) {
		fs.mkdirSync('../test/files');
	}
});

afterAll(() => {
	server.close();
});

describe('test down method', () => {
	const axios = axiosBase.create({});
	axiosMultiDown(axios);

	describe('test big file', () => {
		let _md5File: string;

		beforeEach(async () => {
			const f = testFile('100M.test');
			makeBigFile(f, 100 * 1024 * 1024);
			_md5File = await md5File(f);
		});

		test('range support', async () => {
			const url = testUrl('100M.test', true);
			const data = await axios.down(url, { responseType: 'text' });
			const _md5String = md5String(data);
			expect(_md5File === _md5String).toBe(true);
		});

		test('range not support', async () => {
			const url = testUrl('100M.test', false);
			const data = await axios.down({ url, responseType: 'text' });
			const _md5String = md5String(data);
			expect(_md5File === _md5String).toBe(true);
		});
	});

	describe('test json', () => {
		const f = testFile('sample.json');
		const o = {
			a: 123,
			b: true,
			c: 'string',
			d: ['1', 123, true],
			e: {
				a: 123,
				b: true,
				c: 'string',
			},
		};
		fs.writeFileSync(f, JSON.stringify(o));

		test('range support', async () => {
			const url = testUrl('sample.json', true);
			const data = await axios.down(url); // default  responseType: 'json'
			expect(_.isEqual(o, data)).toBe(true);
		});

		test('range not support', async () => {
			const url = testUrl('sample.json', false);
			const data = await axios.down({ url }); // default  responseType: 'json'
			expect(_.isEqual(o, data)).toBe(true);
		});
	});
});
