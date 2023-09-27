import * as http from 'http';
import * as fs from 'fs';
import axiosBase from 'axios';
import _ from 'lodash';

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

import { testServer } from './utils/http-server';
import { makeBigFile, md5File, md5String } from './utils';

import axiosMultiDown from '../src/index';

const testFile = (f = '') => 'test/files/' + f;
const testUrl = (f = '') => `http://127.0.0.1:3000/${testFile(f)}`;

let server: http.Server;

beforeAll(async () => {
	server = await testServer();
	if (!fs.existsSync('../test/files')) {
		fs.mkdirSync('../test/files');
	}
});

afterAll(() => {
	server.close();
});

describe('Range is support', () => {
	const axios = axiosBase.create({});
	axiosMultiDown(axios);

	test('big file is ok', async () => {
		const f = testFile('100M.test');
		const url = testUrl('100M.test');
		makeBigFile(f, 100 * 1024 * 1024);
		const data = await axios.down({ url, responseType: 'text' });
		const _md5File = await md5File(f);
		const _md5String = md5String(data);
		expect(_md5File === _md5String).toBe(true);
	});

	test('json is ok', async () => {
		const f = testFile('sample.json');
		const url = testUrl('sample.json');
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
		const data = await axios.down({ url }); // default  responseType: 'json'
		expect(_.isEqual(o, data)).toBe(true);
	});
});
