#!/bin/bash

# 获取Node.js版本信息的脚本

# 检查是否安装了nvm
check_nvm() {
    if command -v nvm &> /dev/null; then
        return 0
    elif [ -s "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        return 0
    elif [ -s "/usr/local/opt/nvm/nvm.sh" ]; then
        source "/usr/local/opt/nvm/nvm.sh"
        return 0
    else
        return 1
    fi
}

# 获取当前Node版本
get_current_version() {
    if command -v node &> /dev/null; then
        node --version 2>/dev/null || echo "未安装"
    else
        echo "未安装"
    fi
}

# 获取已安装的版本
get_installed_versions() {
    # if check_nvm; then
    #     # 使用nvm获取已安装版本
    #     nvm list --no-colors 2>/dev/null | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/[^v0-9.]//g' | grep -v "^$" | head -10
    # fi
    n list
}

# 获取可用的最新版本
get_available_versions() {
    # if check_nvm; then
    #     # 获取最新的LTS和stable版本
    #     {
    #         # 最新LTS版本
    #         nvm list-remote --lts --no-colors 2>/dev/null | tail -5 | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/.*\(v[0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/'
    #         # 最新stable版本
    #         nvm list-remote --no-colors 2>/dev/null | tail -5 | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/.*\(v[0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/'
    #     } | sort -V | uniq | tail -5
    # else
    #     # 如果没有nvm，尝试从Node.js官网获取版本信息
    #     curl -s https://nodejs.org/dist/index.json 2>/dev/null | grep -o '"version":"[^"]*"' | head -5 | cut -d'"' -f4 2>/dev/null || echo ""
    # fi
    n list-remote --lts
}

# 输出结果
echo "CURRENT:$(get_current_version)"
echo "AVAILABLE:"
get_available_versions
echo "INSTALLED:"
get_installed_versions


