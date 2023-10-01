module.exports = async function (globalConfig: any, projectConfig: any) {
    await (globalThis as any).__SERVER__.close();
};
