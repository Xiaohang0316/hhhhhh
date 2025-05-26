#!/bin/bash

# 获取版本信息的 Bash 脚本

echo "正在获取版本信息..."

# 获取 Node.js 版本
NODE_VERSION=""
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version 2>/dev/null)
fi

# 获取 Git 版本
GIT_VERSION=""
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version 2>/dev/null | sed 's/git version //')
fi

# 获取 NPM 版本
NPM_VERSION=""
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version 2>/dev/null)
fi

# 获取操作系统信息
OS_INFO=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_INFO="Linux $(uname -r)"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_INFO="macOS $(sw_vers -productVersion)"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS_INFO="Windows $(cmd //c ver 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')"
else
    OS_INFO="Unknown OS"
fi

# 输出结果
echo "NODE: ${NODE_VERSION:-未安装}"
echo "GIT: ${GIT_VERSION:-未安装}"
echo "NPM: ${NPM_VERSION:-未安装}"
echo "OS: ${OS_INFO:-未知}"
