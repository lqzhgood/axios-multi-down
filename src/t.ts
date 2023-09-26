import axiosBase from 'axios';

const axios = axiosBase.create({});

import axiosMultiDown from './index';

axiosMultiDown(axios);

// @ts-ignore
axios.down({
	url: 'http://d.info.hns5j.com/100M.test',
});
