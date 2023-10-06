import axiosBase from 'axios';

const axios = axiosBase.create({});

import AxiosMultiDown from '../../src/index';
AxiosMultiDown(axios, {
    max: 5,
    blockSize: 20 * 1024 * 1024,
});

console.time('use range');
let retry = 0;
axios
    .down(
        {
            url: 'http://127.0.0.1:3000/test/files/sample.json?useRange=1',
            // url: 'http://127.0.0.1:3000/test/files/100M.test?useRange=1',
            // responseType: 'text',
        },
        {
            max: 1,
            maxRetries: 3,
            blockSize: 1,
            // errMode: 'WAIT',

            onData(block) {
                // @ts-ignore
                if (!window.aa) {
                    block.resp = undefined; // 模拟下载出错
                    throw new Error('i=0');
                }
            },
            onBlockError(block) {
                retry = block.retryCount;
            },
            onFinishErr(eQ, queue, config) {
                console.log(eQ);

                setTimeout(() => {
                    console.log(11111111);
                    AxiosMultiDown.RetryQueue(eQ, config);
                }, 5 * 1000);

                setTimeout(() => {
                    window.aa = 1;
                }, 50 * 1000);
            },
        },
    )
    .then(d => {
        console.log('ddddddddddddddddddddddddd', d);
    })
    .catch(err => {
        console.log('errrrrrrrrrrrrrrrrrrrrrrrr', err);
    })
    .finally(() => {
        console.timeEnd('use range');
        console.log(retry);
    });

// console.time('not use range');
// axios
//     .down('http://127.0.0.1:3000/test/files/100M.test')
//     .then(d => {
//         console.log('d', d);
//     })
//     .catch(err => {
//         console.log('err', err);
//     })
//     .finally(() => {
//         console.timeEnd('not use range');
//     });
