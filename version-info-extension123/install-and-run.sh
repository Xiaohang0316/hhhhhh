#!/bin/bash

echo "🔧 安装项目依赖..."
npm install

echo "🔨 编译 TypeScript..."
npm run compile

echo "✅ 项目创建完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在 VS Code 中打开项目文件夹"
echo "2. 按 F5 启动扩展调试模式"
echo "3. 在新窗口中测试插件功能"
echo ""
echo "🚀 或者直接运行: code . && code --extensionDevelopmentPath=."
