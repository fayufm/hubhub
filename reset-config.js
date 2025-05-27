const Store = require('electron-store');
const store = new Store({
    name: 'config',
    encryptionKey: 'chengren_secure_encryption_key'
});

// 该段内容需要用户自行调整GitHub访问令牌

// 备份当前token
const currentToken = store.get('github_token');

// 重置为默认设置
store.clear();

// 恢复token如果不是默认token且不为空
if (currentToken && 
    !currentToken.includes('{{YOUR_GITHUB_TOKEN}}') && 
    currentToken !== '' && 
    currentToken.length > 10) {
    store.set('github_token', currentToken);
    console.log('已保留用户自定义GitHub Token');
} else {
    store.set('github_token', '');
    console.log('已清除无效的GitHub Token，请在设置中添加您自己的Token');
}

// 设置默认值
store.set('theme', 'light');
store.set('language', 'zh_CN');
store.set('card_display', 'grid');
store.set('hide_badges', true);
store.set('daily_visits', 0);
store.set('last_visit_date', new Date().toDateString());

console.log('配置已重置为默认值'); 