import * as fs from 'fs';
import path from 'path';
import { testServer } from './http-server';

module.exports = async function (globalConfig: any, projectConfig: any) {
    if (!fs.existsSync(path.join(__dirname, '../files'))) {
        fs.mkdirSync(path.join(__dirname, '../files'));
    }

    const PORT = 3000;
    const server = await testServer(PORT);

    (globalThis as any).__SERVER__ = server;
};
