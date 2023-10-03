import axiosBase from 'axios';

const axios = axiosBase.create({});

import AxiosMultiDown from '../src/index';
AxiosMultiDown(axios, {
    max: 5,
    blockSize: 20 * 1024 * 1024,
});

console.time('use range');

axios
    .down(
        {
            // url: 'http://127.0.0.1:3000/test/files/sample.json?useRange=1',
            url: 'http://127.0.0.1:3000/test/files/100M.test?useRange=1',
            responseType: 'text',
        },
        {
            testMethod: 'self',
            blockSize: 1,
            // emitter,
        },
    )
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
