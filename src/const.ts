import type { IDownConfig } from './types/axios-down';

export enum TEST_METHOD {
	HEAD = 'head',
	SELF = 'self',
}

export const downConfigDefault: IDownConfig = {
	max: 3,
	blockSize: 10 * 1024 * 1024, // 10M
	testMethod: TEST_METHOD.HEAD,
};
