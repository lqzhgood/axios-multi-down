import * as fs from 'fs';
import axiosBase from 'axios';

import { describe, expect, jest, test } from '@jest/globals';

import { makeBigFile, md5File, md5String } from './utils';

import axiosMultiDown from '../src/index';

const testFile = (f = '') => 'test/files/' + f;
const testUrl = (f = '', useRange = false) => `http://127.0.0.1:${(global as any).PORT}/${testFile(f)}?${useRange && 'useRange=1'}`;

describe('test down method', () => {
    describe('test big file', () => {
        const axios = axiosBase.create({});
        axiosMultiDown(axios, {
            blockSize: 10 * 1024 * 1024,
        });

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
            const { data, isMulti } = await axios.down(url, { responseType: 'text' });
            const _md5String = md5String(data);
            expect(isMulti).toBe(false);
            expect(_md5File).toBe(_md5String);
        });
    });

    describe('test json', () => {
        const axios = axiosBase.create({});
        axiosMultiDown(axios, {
            blockSize: 10 * 1024 * 1024,
        });

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
            const { data, isMulti } = await axios.down(
                url,
                {},
                {
                    blockSize: 1,
                },
            ); // default  responseType: 'json'
            expect(isMulti).toBe(true);
            expect(o).toStrictEqual(data);
        });

        test('range not support', async () => {
            const url = testUrl(fileName, false);
            const { data, isMulti } = await axios.down(
                url,
                {},
                {
                    blockSize: 1,
                },
            ); // default  responseType: 'json'
            expect(isMulti).toBe(false);
            expect(o).toStrictEqual(data);
        });
    });
});
