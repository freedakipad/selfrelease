#!/bin/bash

# ============================================
# 释放日记 - 一键部署脚本
# 服务器: 1.94.14.212
# ============================================

set -e

# 配置
SERVER_HOST="release-diary"  # SSH config 中配置的主机别名
SERVER_IP="1.94.14.212"
REMOTE_DIR="/var/www/release-diary"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   释放日记 - 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查 SSH 连接
echo -e "\n${YELLOW}[1/5] 检查服务器连接...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_HOST} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH 连接正常${NC}"
else
    echo -e "${RED}✗ SSH 连接失败，请检查 SSH 配置${NC}"
    exit 1
fi

# 在服务器上创建目录并安装 nginx（如果需要）
echo -e "\n${YELLOW}[2/5] 准备服务器环境...${NC}"
ssh ${SERVER_HOST} << 'ENDSSH'
    # 创建目录
    mkdir -p /var/www/release-diary
    
    # 检查 nginx 是否安装
    if ! command -v nginx &> /dev/null; then
        echo "安装 nginx..."
        apt-get update -qq
        apt-get install -y nginx
    fi
    
    # 启动 nginx
    systemctl enable nginx
    systemctl start nginx
    
    echo "服务器环境准备完成"
ENDSSH
echo -e "${GREEN}✓ 服务器环境已准备${NC}"

# 同步文件
echo -e "\n${YELLOW}[3/5] 同步文件到服务器...${NC}"
rsync -avz --progress --delete \
    --exclude '.git' \
    --exclude '.gitignore' \
    --exclude 'deploy.sh' \
    --exclude 'setup-ssh.sh' \
    --exclude 'nginx.conf' \
    --exclude '*.md' \
    --exclude 'https_server.py' \
    --exclude 'vercel.json' \
    --exclude 'test.html' \
    "${LOCAL_DIR}/" ${SERVER_HOST}:${REMOTE_DIR}/

# 修复文件权限
ssh ${SERVER_HOST} "chown -R www-data:www-data ${REMOTE_DIR} && chmod -R 755 ${REMOTE_DIR}"

echo -e "${GREEN}✓ 文件同步完成${NC}"

# 安装和配置 API 代理服务
echo -e "\n${YELLOW}[4/5] 配置 API 代理服务...${NC}"
ssh ${SERVER_HOST} << 'ENDSSH'
    # 安装 Python 依赖
    apt-get install -y python3-pip python3-venv -qq
    
    # 创建虚拟环境
    cd /var/www/release-diary
    python3 -m venv venv 2>/dev/null || true
    source venv/bin/activate
    pip install -q -r requirements.txt
    
    # 创建 systemd 服务
    cat > /etc/systemd/system/release-diary-api.service << 'EOF'
[Unit]
Description=Release Diary API Proxy
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/release-diary
Environment=PATH=/var/www/release-diary/venv/bin
ExecStart=/var/www/release-diary/venv/bin/gunicorn -w 2 -b 127.0.0.1:5000 api_proxy:app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

    # 启动服务
    systemctl daemon-reload
    systemctl enable release-diary-api
    systemctl restart release-diary-api
    
    echo "API 代理服务已配置"
ENDSSH
echo -e "${GREEN}✓ API 代理服务已配置${NC}"

# 配置 nginx
echo -e "\n${YELLOW}[5/5] 配置 Web 服务器...${NC}"
ssh ${SERVER_HOST} << 'ENDSSH'
    # 创建 nginx 配置
    cat > /etc/nginx/sites-available/release-diary << 'EOF'
server {
    listen 80;
    server_name _;
    
    root /var/www/release-diary;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # API 代理 - 转发到后端服务
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # CORS 头
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key, X-API-Endpoint" always;
        
        if ($request_method = OPTIONS) {
            return 204;
        }
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|mp4|mp3|css|js)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 主路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

    # 启用站点
    ln -sf /etc/nginx/sites-available/release-diary /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    
    # 测试并重载配置
    nginx -t && systemctl reload nginx
    
    echo "Nginx 配置完成"
ENDSSH

echo -e "${GREEN}✓ Web 服务器配置完成${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "访问地址: ${YELLOW}http://${SERVER_IP}${NC}"
echo ""
