import axiosBase from 'axios';

const axios = axiosBase.create({});

import axiosMultiDown from '../../src/index';

axiosMultiDown(axios);

import { testServer } from '../utils/http-server';

testServer(3333);

axios.down({
    url: 'http://127.0.0.1:3000/test/files/100M.test',
});
axios.down({
    url: 'http://127.0.0.1:3000/test/files/100M.test?useRange=1',
});
