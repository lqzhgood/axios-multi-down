import { describe, expect, test } from '@jest/globals';

import { splitRangeArr } from '../src/utils';

describe('splitRangeArr', () => {
	test('10 / 1', () => {
		expect(splitRangeArr(10, 1)).toStrictEqual(['0-9']);
	});
	test('10 / 2', () => {
		expect(splitRangeArr(10, 2)).toStrictEqual(['0-4', '5-9']);
	});
	test('10 / 3', () => {
		expect(splitRangeArr(10, 3)).toStrictEqual(['0-3', '4-6', '7-9']);
	});
	test('10 / 4', () => {
		expect(splitRangeArr(10, 4)).toStrictEqual(['0-2', '3-5', '6-7', '8-9']);
	});
	test('10 / 5', () => {
		expect(splitRangeArr(10, 5)).toStrictEqual(['0-1', '2-3', '4-5', '6-7', '8-9']);
	});
	test('10 / 6', () => {
		expect(splitRangeArr(10, 6)).toStrictEqual(['0-1', '2-3', '4-5', '6-7', '8-8', '9-9']);
	});
	test('10 / 7', () => {
		expect(splitRangeArr(10, 7)).toStrictEqual(['0-1', '2-3', '4-5', '6-6', '7-7', '8-8', '9-9']);
	});
	test('10 / 8', () => {
		expect(splitRangeArr(10, 8)).toStrictEqual(['0-1', '2-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	test('10 / 9', () => {
		expect(splitRangeArr(10, 9)).toStrictEqual(['0-1', '2-2', '3-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	test('10 / 10', () => {
		expect(splitRangeArr(10, 10)).toStrictEqual(['0-0', '1-1', '2-2', '3-3', '4-4', '5-5', '6-6', '7-7', '8-8', '9-9']);
	});
	test('10 / 11', () => {
		expect(splitRangeArr(10, 11)).toStrictEqual(['0-']);
	});
});
