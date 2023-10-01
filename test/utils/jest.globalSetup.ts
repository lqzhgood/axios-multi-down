import * as fs from 'fs';

import { testServer } from './http-server';

module.exports = async function (globalConfig: any, projectConfig: any) {
    if (!fs.existsSync('../test/files')) {
        fs.mkdirSync('../test/files');
    }

    const PORT = 3000;
    const server = await testServer(PORT);

    (globalThis as any).__SERVER__ = server;
};
