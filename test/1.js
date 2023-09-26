const fs = require('fs');

const t = fs.readFileSync('./100M.test', 'utf-8');
// fs.writeFileSync('./100M.test', 'aBcD123' + t);

console.log('', t.split(0, 10));
