import { testServer } from './utils/http-server';
const testFile = './test/100M.test';
const url = `http://127.0.0.1:3000/${testFile}`;
console.log('url', url);

testServer();
