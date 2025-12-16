#!/bin/bash

# ============================================
# SSH 免密登录设置脚本
# 服务器: 1.94.14.212
# ============================================

SERVER_IP="1.94.14.212"
SERVER_USER="root"
SERVER_PASS="Why_701208"
KEY_NAME="id_rsa_release_diary"
SSH_HOST="release-diary"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   SSH 免密登录设置${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否已经可以免密登录
echo -e "\n${YELLOW}检查当前连接状态...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_HOST} "echo 'OK'" 2>/dev/null; then
    echo -e "${GREEN}✓ 免密登录已配置，无需重复设置${NC}"
    exit 0
fi

# 生成专用密钥（如果不存在）
if [ ! -f ~/.ssh/${KEY_NAME} ]; then
    echo -e "\n${YELLOW}生成 SSH 密钥...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/${KEY_NAME} -N "" -C "release-diary@${SERVER_IP}"
fi

# 检查 sshpass 是否安装
if ! command -v sshpass &> /dev/null; then
    echo -e "\n${YELLOW}安装 sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

# 复制公钥到服务器
echo -e "\n${YELLOW}复制公钥到服务器...${NC}"
sshpass -p "${SERVER_PASS}" ssh-copy-id -i ~/.ssh/${KEY_NAME}.pub -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP}

# 配置 SSH config
echo -e "\n${YELLOW}配置 SSH config...${NC}"
if ! grep -q "Host ${SSH_HOST}" ~/.ssh/config 2>/dev/null; then
    cat >> ~/.ssh/config << EOF

# 释放日记服务器
Host ${SSH_HOST}
    HostName ${SERVER_IP}
    User ${SERVER_USER}
    IdentityFile ~/.ssh/${KEY_NAME}
    IdentitiesOnly yes
EOF
    echo -e "${GREEN}✓ SSH config 已添加${NC}"
else
    echo -e "${GREEN}✓ SSH config 已存在${NC}"
fi

# 验证
echo -e "\n${YELLOW}验证免密登录...${NC}"
if ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_HOST} "echo 'SSH 免密登录成功'" 2>/dev/null; then
    echo -e "${GREEN}✓ 免密登录设置成功！${NC}"
    echo -e "\n现在可以运行 ${YELLOW}./deploy.sh${NC} 进行部署"
else
    echo -e "${RED}✗ 免密登录设置失败，请手动检查${NC}"
    exit 1
fi
