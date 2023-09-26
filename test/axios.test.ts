import * as fs from 'fs';
const path = require('path');
import { execSync } from 'child_process';

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';

import { server } from './http-server';
import { md5 } from './utils';

// import { add } from '../src/index';

const testFile = './test/100M.test';
let testMd5;

beforeAll(async () => {
	if (!fs.existsSync(path.normalize(testFile))) {
		execSync(`fsutil file createnew ${testFile} ${100 * 1024 * 1024}`);
	}
	testMd5 = await md5(testFile);
});

describe('sum module', () => {
	test('adds 1 + 2 to equal 3', () => {
		expect(add(1, 2)).toBe(3);
	});
});

afterAll(() => {
	server.close();
});
