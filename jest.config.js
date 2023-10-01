/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // transform: {
    //     '^.+\\.(ts|tsx)$': 'ts-jest',
    // },
    globals: {
        PORT: 3000,
    },
    globalSetup: './test/utils/jest.globalSetup.ts',
    globalTeardown: './test/utils/jest.teardown.ts',
};
