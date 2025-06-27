const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5174;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
    
    // 安全检查
    if (!filePath.startsWith(DIST_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 如果文件不存在，返回 index.html (SPA 路由)
                fs.readFile(path.join(DIST_DIR, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(500);
                        res.end('Server Error');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`开发服务器运行在 http://localhost:${PORT}`);
    console.log(`服务目录: ${DIST_DIR}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭开发服务器...');
    server.close(() => {
        console.log('开发服务器已关闭');
        process.exit(0);
    });
});
