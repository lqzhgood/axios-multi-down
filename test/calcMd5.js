const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

function md5File(filePath) {
    const file = fs.readFileSync(filePath, 'utf-8');
    return md5String(file);
}

function md5String(s) {
    // 创建一个 MD5 散列对象
    const md5Hash = crypto.createHash('md5');

    // 更新散列对象以包含要散列的数据
    md5Hash.update(s, 'utf-8');

    // 计算并获取 MD5 散列的十六进制表示
    const md5Hex = md5Hash.digest('hex');

    return md5Hex;
}

console.log('1m md5', md5File('./1m.demo'));
console.log('10m md5', md5File('./10m.demo'));
console.log('99m md5', md5File('./99m.demo'));
