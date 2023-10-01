import { describe, expect, it } from '@jest/globals';

import { blockSizeValue, splitArr, splitRangeArr } from '../src/utils';

describe('splitRangeArr', () => {
	it('10 / 1', () => {
		expect(splitRangeArr(10, 1)).toStrictEqual(['0-9']);
	});
	it('10 / 2', () => {
		expect(splitRangeArr(10, 2)).toStrictEqual(['0-4', '5-9']);
	});
	it('10 / 3', () => {
		expect(splitRangeArr(10, 3)).toStrictEqual(['0-3', '4-6', '7-9']);
	});
	it('10 / 4', () => {
		expect(splitRangeArr(10, 4)).toStrictEqual(['0-2', '3-5', '6-7', '8-9']);
	});
	it('10 / 5', () => {
		expect(splitRangeArr(10, 5)).toStrictEqual(['0-1', '2-3', '4-5', '6-7', '8-9']);
	});
	it('10 / 6', () => {
		expect(splitRangeArr(10, 6)).toStrictEqual(['0-1', '2-3', '4-5', '6-7', '8-8', '9-9']);
	});
	it('10 / 7', () => {
		expect(splitRangeArr(10, 7)).toStrictEqual(['0-1', '2-3', '4-5', '6-6', '7-7', '8-8', '9-9']);
	});
	it('10 / 8', () => {
		expect(splitRangeArr(10, 8)).toStrictEqual(['0-1', '2-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	it('10 / 9', () => {
		expect(splitRangeArr(10, 9)).toStrictEqual(['0-1', '2-2', '3-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	it('10 / 10', () => {
		expect(splitRangeArr(10, 10)).toStrictEqual(['0-0', '1-1', '2-2', '3-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	it('10 / 11', () => {
		expect(splitRangeArr(10, 11)).toStrictEqual(['0-']);
	});
});
describe('splitArr', () => {
	it('10 / 1', () => {
		expect(splitArr(10, 1)).toStrictEqual([
			{ s: 0, e: 0 },
			{ s: 1, e: 1 },
			{ s: 2, e: 2 },
			{ s: 3, e: 3 },
			{ s: 4, e: 4 },
			{ s: 5, e: 5 },
			{ s: 6, e: 6 },
			{ s: 7, e: 7 },
			{ s: 8, e: 8 },
			{ s: 9, e: 9 },
		]);
	});
	it('10 / 2', () => {
		expect(splitArr(10, 2)).toStrictEqual([
			{ s: 0, e: 1 },
			{ s: 2, e: 3 },
			{ s: 4, e: 5 },
			{ s: 6, e: 7 },
			{ s: 8, e: 9 },
		]);
	});
	it('10 / 3', () => {
		expect(splitArr(10, 3)).toStrictEqual([
			{ s: 0, e: 2 },
			{ s: 3, e: 5 },
			{ s: 6, e: 8 },
			{ s: 9, e: 9 },
		]);
	});
	it('10 / 4', () => {
		expect(splitArr(10, 4)).toStrictEqual([
			{ s: 0, e: 3 },
			{ s: 4, e: 7 },
			{ s: 8, e: 9 },
		]);
	});
	it('10 / 5', () => {
		expect(splitArr(10, 5)).toStrictEqual([
			{ s: 0, e: 4 },
			{ s: 5, e: 9 },
		]);
	});
	it('10 / 6', () => {
		expect(splitArr(10, 6)).toStrictEqual([
			{ s: 0, e: 5 },
			{ s: 6, e: 9 },
		]);
	});
	it('10 / 7', () => {
		expect(splitArr(10, 7)).toStrictEqual([
			{ s: 0, e: 6 },
			{ s: 7, e: 9 },
		]);
	});
	it('10 / 8', () => {
		expect(splitArr(10, 8)).toStrictEqual([
			{ s: 0, e: 7 },
			{ s: 8, e: 9 },
		]);
	});
	it('10 / 9', () => {
		expect(splitArr(10, 9)).toStrictEqual([
			{ s: 0, e: 8 },
			{ s: 9, e: 9 },
		]);
	});
	it('10 / 10', () => {
		expect(splitArr(10, 10)).toStrictEqual([{ s: 0, e: 9 }]);
	});
	it('10 / 11', () => {
		expect(splitArr(10, 11)).toStrictEqual([{ s: 0, e: 9 }]);
	});
});


describe('blockSizeValue', () => {
    it('number',() => {
        expect(blockSizeValue(100)).toBe(100);
    })
    it('100K',() => {
        expect(blockSizeValue('100K')).toBe(100*1024);
    })
    it('100M',() => {
        expect(blockSizeValue('100M')).toBe(100*1024*1024);
    })
    it('100G',() => {
        expect(blockSizeValue('100G')).toBe(100*1024*1024*1024);
    })
    it('100T',() => {
        expect(blockSizeValue('100T')).toBe(100*1024*1024*1024*1024);
    })
})
