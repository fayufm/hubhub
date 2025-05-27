// 该段内容需要用户自行调整GitHub访问令牌

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'renderer.js');

let content = fs.readFileSync(targetFile, 'utf-8');

// 按行分割
let lines = content.split(/\r?\n/);

// 过滤掉包含'token'（不区分大小写）的所有行
let filtered = lines.filter(line => !/token/i.test(line));

// 插入注释
filtered.unshift('// 该段内容需要用户自行调整GitHub访问令牌');

// 合并并写回文件
fs.writeFileSync(targetFile, filtered.join('\n'), 'utf-8');

console.log('已自动删除所有包含token的行，并插入注释。'); 