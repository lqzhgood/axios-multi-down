import * as http from 'http';
import * as fs from 'fs';
import axiosBase from 'axios';
import _ from 'lodash';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';

import { testServer } from './utils/http-server';

import axiosMultiDown from '../src/index';
import { TEST_METHOD } from '../src/const';

const PORT = 3001;
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

const fileName = 'test.txt';

const f = testFile(fileName);
const txt = new Array(100).fill('a').join('');
fs.writeFileSync(f, txt);

describe('Test downOptions', () => {
	const axios = axiosBase.create({});
	axiosMultiDown(axios, {
		testMethod: TEST_METHOD.SELF,
	});

	it('downConfig merger', async () => {
		const url = testUrl(fileName, true);
		const { config, data, isMulti, downConfig } = await axios.down({ url, headers: { test: 'test' } }, { blockSize: 1 });
		expect(isMulti).toBe(true);
		expect(txt).toStrictEqual(data);
		expect(config).toMatchObject({ url, headers: { test: 'test' } });
		expect(downConfig).toStrictEqual({ max: 3, testMethod: TEST_METHOD.SELF, blockSize: 1 });
	});
});

describe('Test input parameters', () => {
	const axios = axiosBase.create({});
	axiosMultiDown(axios, {
		blockSize: 1,
	});

	describe('1 param', () => {
		it('url', async () => {
			const url = testUrl(fileName, true);
			const { data, isMulti, downConfig } = await axios.down(url);
			expect(isMulti).toBe(true);
			expect(txt).toStrictEqual(data);
			expect(downConfig).toStrictEqual({ max: 3, blockSize: 1, testMethod: TEST_METHOD.HEAD });
		});

		it('axiosConfig', async () => {
			const url = testUrl(fileName, true);
			const { config, data, isMulti } = await axios.down({ url, headers: { test: 'test' } });
			expect(isMulti).toBe(true);
			expect(txt).toStrictEqual(data);
			expect(config).toMatchObject({ url, headers: { test: 'test' } });
		});
	});

	describe('2 param', () => {
		it('url axiosConfig', async () => {
			const url = testUrl(fileName, true);
			const { config, data, isMulti } = await axios.down(url, { headers: { test: 'test' } });
			expect(isMulti).toBe(true);
			expect(txt).toStrictEqual(data);
			expect(config).toMatchObject({ url, headers: { test: 'test' } });
		});

		it('axiosConfig downConfig', async () => {
			const url = testUrl(fileName, true);
			const { config, data, isMulti, downConfig } = await axios.down({ url, headers: { test: 'test' } }, { max: 2 });
			expect(isMulti).toBe(true);
			expect(txt).toStrictEqual(data);
			expect(config).toMatchObject({ url, headers: { test: 'test' } });
			expect(downConfig).toMatchObject({ max: 2, blockSize: 1 });
		});
	});

	describe('3 param', () => {
		it('url axiosConfig downConfig', async () => {
			const url = testUrl(fileName, true);
			const { config, data, isMulti, downConfig } = await axios.down(url, { headers: { test: 'test' } }, { max: 2 });
			expect(isMulti).toBe(true);
			expect(txt).toStrictEqual(data);
			expect(config).toMatchObject({ url, headers: { test: 'test' } });
			expect(downConfig).toMatchObject({ max: 2, blockSize: 1 });
		});
	});
});
