import * as http from 'http';
import * as fs from 'fs';
import axiosBase from 'axios';
import _ from 'lodash';

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

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
	axiosMultiDown(axios, {
		blockSize: 10 * 1024 * 1024,
	});

	describe('test big file', () => {
		const fileName = '100M.test';

		const f = testFile(fileName);
		makeBigFile(f, 100 * 1024 * 1024);
		const _md5File = md5File(f);

		jest.setTimeout(5 * 1000);

		test('range support', async () => {
			const url = testUrl(fileName, true);
			const { data, isMulti } = await axios.down(url, { responseType: 'text' });
			const _md5String = md5String(data);
			expect(isMulti).toBe(true);
			expect(_md5File).toBe(_md5String);
		});

		test('range not support', async () => {
			const url = testUrl(fileName, false);
			const { data, isMulti } = await axios.down({ url, responseType: 'text' });
			const _md5String = md5String(data);
			expect(isMulti).toBe(false);
			expect(_md5File).toBe(_md5String);
		});
	});

	describe('test json', () => {
		const fileName = 'sample.json';

		const f = testFile(fileName);
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
			const url = testUrl(fileName, true);
			const { data, isMulti } = await axios.down(url); // default  responseType: 'json'
			expect(isMulti).toBe(true);
			expect(o).toStrictEqual(data);
		});

		test('range not support', async () => {
			const url = testUrl(fileName, false);
			const { data, isMulti } = await axios.down({ url }); // default  responseType: 'json'
			expect(isMulti).toBe(false);
			expect(o).toStrictEqual(data);
		});
	});
});
