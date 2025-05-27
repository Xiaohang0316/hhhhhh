#!/bin/bash

# 切换Node.js版本的脚本
# 参数: $1 = 目标版本号 (如: v18.17.0)

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "错误: 请提供版本号"
    exit 1
fi

# 检查并加载nvm
load_nvm() {
    if command -v nvm &> /dev/null; then
        return 0
    elif [ -s "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        return 0
    elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
        source "/usr/local/opt/nvm/nvm.sh"
        return 0
    else
        echo "错误: 未找到NVM，请先安装NVM"
        echo "安装命令: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
        exit 1
    fi
}

# # 加载nvm
# if ! load_nvm; then
#     exit 1
# fi

# 确保版本号以v开头
if [[ ! $VERSION =~ ^v ]]; then
    VERSION="v$VERSION"
fi

echo "正在切换到Node.js $VERSION..."

# 检查版本是否已安装
if n list | grep -q "$VERSION"; then
    echo "版本 $VERSION 已安装，正在切换..."
    n use "$VERSION"
    if [ $? -eq 0 ]; then
        echo "成功切换到 Node.js $VERSION"
        echo "当前版本: $(node --version)"
        echo "当前NPM版本: $(npm --version)"
    else
        echo "切换失败"
        exit 1
    fi
else
    echo "版本 $VERSION 未安装，正在下载并安装..."
    echo "000316" | sudo -S n install "$VERSION"
    if [ $? -eq 0 ]; then
        echo "成功安装并切换到 Node.js $VERSION"
        echo "当前版本: $(node --version)"
        echo "当前NPM版本: $(npm --version)"
        
        # 设置为默认版本
        # n alias default "$VERSION"
        echo "已设置 $VERSION 为默认版本"
    else
        echo "安装失败，请检查网络连接或版本号是否正确"
        exit 1
    fi
fi

# 验证安装
if command -v node &> /dev/null; then
    echo "验证成功: Node.js $(node --version) 已就绪"
else
    echo "警告: Node.js命令不可用，可能需要重启终端"
fi

