# 版本信息查看器

这是一个VS Code插件，用于显示当前系统中VS Code、Node.js、Git等工具的版本信息。

## 功能特性
- 📊 显示 VS Code 版本
- 🟢 显示 Node.js 版本
- 📁 显示 Git 版本
- 📦 显示 NPM 版本
- 💻 显示操作系统信息
- 🔄 支持手动刷新
- 🎨 美观的界面设计

## 安装方法
1. 克隆或下载此项目
2. 在项目根目录运行 `npm install`
3. 按 F5 启动开发模式
4. 在新窗口中测试插件功能

## 使用方法
1. 安装插件后，在VS Code资源管理器侧边栏会出现"版本信息"面板
2. 使用 `Ctrl+Shift+P`（或 `Cmd+Shift+P`）打开命令面板
3. 输入"显示版本信息"或"刷新版本信息"来执行相应操作

## 技术栈
- TypeScript
- VS Code Extension API
- Bash/Batch 脚本

## 项目结构
```plaintext
/Users/xiaohang/Desktop/hhhhhh/version-info-extension123
├── .gitignore
├── .vscode/
│   ├── launch.json
│   └── settings.json
├── README.md
├── cancel_red.svg
├── image-1.png
├── image-2.png
├── image.png
├── install-and-run.sh
├── package-lock.json
├── package.json
├── scripts/
│   ├── get-node-versions.sh
│   ├── get-versions.sh
│   └── switch-node-version.sh
├── src/
│   ├── extension.ts
│   ├── versionProvider.ts
│   └── webview/
└── tsconfig.json