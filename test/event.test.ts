import * as fs from 'fs';
import axiosBase from 'axios';

import { describe, expect, it } from '@jest/globals';

import axiosMultiDown from '../src/index';
import { TEST_METHOD } from '../src/const';
import AxiosMultiDown from '../src/index';

const testFile = (f = '') => 'test/files/' + f;
const testUrl = (f = '', useRange = false) =>
    `http://127.0.0.1:${(global as any).PORT}/${testFile(f)}?${useRange && 'useRange=1'}`;

const fileName = 'test.txt';

const f = testFile(fileName);
const txt = new Array(100).fill('a').join('');
fs.writeFileSync(f, txt);

describe('event', () => {
    const axios = axiosBase.create({});
    axiosMultiDown(axios, {
        testMethod: TEST_METHOD.SELF,
    });

    it('on end', down => {
        const url = testUrl(fileName, true);
        const emitter = new AxiosMultiDown.EventEmitter();

        emitter.on('end', () => {
            down();
        });

        axios.down(url, { responseType: 'text' }, { emitter });
    });
});
