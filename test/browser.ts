import axiosBase from 'axios';

import AxiosMultiDown from '../src/index';

const axios = axiosBase.create({});

AxiosMultiDown(axios, {
	max: 3,
});

axios
	.down('http://127.0.0.1:3000/test/files/100M.test')
	.then(d => {
		console.log('d', d[0]);
	})
	.catch(err => {
		console.log('err', err);
	});
