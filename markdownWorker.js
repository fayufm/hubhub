// Web Worker 用于在后台线程处理Markdown转换
// 导入Marked库
importScripts('https://cdn.jsdelivr.net/npm/marked/marked.min.js');

// 配置Marked选项，提高性能
marked.setOptions({
  headerIds: false,  // 关闭自动生成header IDs，减少处理时间
  mangle: false,     // 不处理header id，降低复杂度
  gfm: true,         // 使用GitHub风格Markdown
  breaks: true,      // 将换行符转换为<br>
  silent: true       // 忽略解析错误
});

// 监听来自主线程的消息
self.onmessage = function(e) {
  try {
    // 处理新格式的消息，包含请求ID
    const data = e.data;
    let markdownText;
    let requestId;
    
    // 检查是否为新格式消息（包含requestId）
    if (typeof data === 'object' && data !== null) {
      requestId = data.requestId;
      markdownText = data.markdown;
    } else {
      // 兼容旧格式
      requestId = null;
      markdownText = data;
    }
    
    // 检查输入是否为null或undefined
    if (markdownText === null || markdownText === undefined) {
      sendResponse(requestId, '<div class="error">Markdown处理失败: 输入数据为空</div>');
      return;
    }
    
    // 尝试将可能的对象转换为字符串
    if (typeof markdownText !== 'string') {
      try {
        // 如果是对象，尝试JSON.stringify
        markdownText = JSON.stringify(markdownText, null, 2);
      } catch (jsonError) {
        // 如果JSON序列化失败，使用toString
        markdownText = String(markdownText);
      }
    }
    
    // 检查转换后的文本是否为空
    if (!markdownText.trim()) {
      sendResponse(requestId, '<div class="no-results">README内容为空</div>');
      return;
    }
    
    // 使用marked库转换Markdown为HTML
    const html = marked.parse(markdownText);
    
    // 将结果发送回主线程
    sendResponse(requestId, html);
  } catch (error) {
    // 发送错误信息回主线程
    sendResponse(
      e.data?.requestId, 
      `<div class="error">Markdown处理失败: ${error.message}</div>`
    );
  }
};

// 统一响应函数
function sendResponse(requestId, html) {
  if (requestId) {
    // 新格式响应，包含请求ID
    self.postMessage({
      requestId: requestId,
      html: html
    });
  } else {
    // 兼容旧格式
    self.postMessage(html);
  }
} 