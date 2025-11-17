// EdgeOne 随机图片API - Node.js服务器版本
const http = require('http');
const url = require('url');

// 配置项
var CONFIG = {
  maxHorizontalImageNumber: 901,  // 横屏图片最大编号
  maxVerticalImageNumber: 3306     // 竖屏图片最大编号
};

// 根据文件扩展名获取MIME类型
function getMimeType(filename) {
  var ext = filename.toLowerCase().split('.').pop();
  var mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/webp';
}

// 检测是否为移动设备
function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  
  var mobileKeywords = [
    'Mobile', 'Android', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 
    'Windows Phone', 'Opera Mini', 'IEMobile', 'Mobile Safari',
    'webOS', 'Kindle', 'Silk', 'Fennec', 'Maemo', 'Tablet'
  ];
  
  var lowerUserAgent = userAgent.toLowerCase();
  
  // 检查移动设备关键词
  for (var i = 0; i < mobileKeywords.length; i++) {
    if (lowerUserAgent.includes(mobileKeywords[i].toLowerCase())) {
      return true;
    }
  }
  
  // 检查移动设备正则表达式
  var mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent);
}

// 发起反代请求
async function fetchImage(proxyUrl, userAgent, isMobile) {
  try {
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return { error: `获取图片失败: ${response.status} ${response.statusText}`, status: response.status };
    }
    
    const imageData = await response.arrayBuffer();
    const headers = {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    };
    
    return { data: imageData, headers };
  } catch (error) {
    return { error: `网络请求失败: ${error.message}`, status: 500 };
  }
}

// 处理请求
async function handleRequest(request, response) {
  try {
    const parsedUrl = url.parse(request.url, true);
    const imgType = parsedUrl.query.img;
    
    if (imgType === 'h') {
      // 横屏图片
      const randomNum = Math.floor(Math.random() * CONFIG.maxHorizontalImageNumber) + 1;
      const proxyUrl = `https://cnb.cool/2x.nz/r3/-/git/raw/main/ri/h/${randomNum}.webp`;
      
      const result = await fetchImage(proxyUrl, request.headers['user-agent']);
      
      if (result.error) {
        response.writeHead(result.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(result.error);
        return;
      }
      
      response.writeHead(200, {
        ...result.headers,
        'X-Image-Number': randomNum.toString(),
        'X-Proxy-Url': proxyUrl
      });
      response.end(Buffer.from(result.data));
      
    } else if (imgType === 'v') {
      // 竖屏图片
      const randomNum = Math.floor(Math.random() * CONFIG.maxVerticalImageNumber) + 1;
      const proxyUrl = `https://cnb.cool/2x.nz/r3/-/git/raw/main/ri/v/${randomNum}.webp`;
      
      const result = await fetchImage(proxyUrl, request.headers['user-agent']);
      
      if (result.error) {
        response.writeHead(result.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(result.error);
        return;
      }
      
      response.writeHead(200, {
        ...result.headers,
        'X-Image-Number': randomNum.toString(),
        'X-Proxy-Url': proxyUrl
      });
      response.end(Buffer.from(result.data));
      
    } else if (imgType === 'ua') {
      // 根据设备类型自动选择
      const userAgent = request.headers['user-agent'] || '';
      const isMobile = isMobileDevice(userAgent);
      
      const randomNum = Math.floor(Math.random() * (isMobile ? CONFIG.maxVerticalImageNumber : CONFIG.maxHorizontalImageNumber)) + 1;
      const proxyUrl = `https://cnb.cool/2x.nz/r3/-/git/raw/main/ri/${isMobile ? 'v' : 'h'}/${randomNum}.webp`;
      
      const result = await fetchImage(proxyUrl, userAgent);
      
      if (result.error) {
        response.writeHead(result.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(result.error);
        return;
      }
      
      response.writeHead(200, {
        ...result.headers,
        'X-Image-Number': randomNum.toString(),
        'X-Proxy-Url': proxyUrl,
        'X-Device-Type': isMobile ? 'mobile' : 'desktop'
      });
      response.end(Buffer.from(result.data));
      
    } else {
      // 显示使用说明
      const helpText = `🖼️ 随机图片展示器

使用方法:
• ?img=h - 获取横屏随机图片
• ?img=v - 获取竖屏随机图片
• ?img=ua - 根据设备类型自动选择图片

配置信息:
• 横屏图片最大编号: ${CONFIG.maxHorizontalImageNumber}
• 竖屏图片最大编号: ${CONFIG.maxVerticalImageNumber}
• 上次爬图：2025/11/9 15:00`;

      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      response.end(helpText);
    }

  } catch (error) {
    const errorDetails = `❌ 内部错误

错误消息: ${error.message}
请求地址: ${request.url}
时间戳: ${new Date().toISOString()}`;
    
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(errorDetails);
  }
}

// 创建服务器
const server = http.createServer((req, res) => {
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }
  
  handleRequest(req, res);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🎯 EdgeOne PicAPI 服务器已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🖼️ API端点:`);
  console.log(`   - 横屏图片: http://localhost:${PORT}?img=h`);
  console.log(`   - 竖屏图片: http://localhost:${PORT}?img=v`);
  console.log(`   - 智能选择: http://localhost:${PORT}?img=ua`);
  console.log(`📋 使用说明: http://localhost:${PORT}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = server;