import * as http from 'http';
import axiosBase from 'axios';

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

import { testServer } from './utils/http-server';
import { makeBigFile, md5File, md5String } from './utils';

import axiosMultiDown from '../src/index';

const testFile = (f = '') => 'test/files/' + f;
const testUrl = (f = '') => `http://127.0.0.1:3000/${testFile(f)}`;

let server: http.Server;

beforeAll(async () => {
	server = await testServer();
});

afterAll(() => {
	server.close();
});

describe('Range is support', () => {
	const axios = axiosBase.create({});
	axiosMultiDown(axios);

	test('file is same as ajax', async () => {
		const f = testFile('100M.test');
		const url = testUrl('100M.test');
		makeBigFile(f, 100 * 1024 * 1024);
		const data = await axios.down({ url });
		const _md5File = await md5File(f);
		const _md5String = md5String(data);
		expect(_md5File === _md5String).toBe(true);
	});
});
