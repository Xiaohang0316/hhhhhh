set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

update_package_json() {
    log_info "更新package.json文件..."
    
    # 更新package.json
    cat > "package.json" << 'EOF'
{
    "name": "version-info-extension123",
    "displayName": "版本信息插件",
    "description": "一个用于显示和管理版本信息的VS Code插件",
    "version": "1.0.0",
    "publisher": "your-publisher-name",
    "engines": {
        "vscode": "^1.60.0"
    },
    "activationEvents": [
        "onCommand:versionInfo.show",
        "onCommand:versionInfo.refresh",
        "onCommand:versionInfo.showNodeVersions"
    ],
    "main": "./out/extension.js",
    "contributes": {
        "commands": [
            {
                "command": "versionInfo.show",
                "title": "显示版本信息"
            },
            {
                "command": "versionInfo.refresh",
                "title": "刷新版本信息"
            },
            {
                "command": "versionInfo.showNodeVersions",
                "title": "显示Node.js版本管理"
            }
        ],
        "views": {
            "explorer": [
                {
                    "id": "versionInfoView",
                    "name": "版本信息"
                }
            ]
        }
    },
    "scripts": {
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./"
    },
    "devDependencies": {
        "@types/vscode": "^1.60.0",
        "@types/node": "^14.14.31",
        "typescript": "^4.3.5"
    }
}
EOF
    log_success "更新package.json完成"
}



update_typescript_files() {
    log_info "更新TypeScript文件..."
    
    # 更新extension.ts
    cat > "src/extension.ts" << 'EOF'
import * as vscode from 'vscode';
import { VersionProvider } from './versionProvider';
import { VersionPanel } from './webview/versionPanel';
import { NodeVersionPanel } from './webview/nodeVersionPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('版本信息插件已激活');

    const versionProvider = new VersionProvider(context);
    const versionPanel = new VersionPanel(context);

    // 注册树视图提供者
    vscode.window.registerTreeDataProvider('versionInfoView', versionProvider);

    // 注册命令
    const showCommand = vscode.commands.registerCommand('versionInfo.show', () => {
        versionPanel.createOrShow();
    });

    const refreshCommand = vscode.commands.registerCommand('versionInfo.refresh', () => {
        versionProvider.refresh();
        versionPanel.refresh();
    });

    // 新增：注册Node版本管理命令
    const showNodeVersionsCommand = vscode.commands.registerCommand('versionInfo.showNodeVersions', () => {
        NodeVersionPanel.createOrShow(context);
    });

    context.subscriptions.push(showCommand, refreshCommand, showNodeVersionsCommand);

    // 自动显示面板
    versionPanel.createOrShow();
}

export function deactivate() {}
EOF
    log_success "更新extension.ts完成"

    # 更新versionProvider.ts
    cat > "src/versionProvider.ts" << 'EOF'
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface VersionInfo {
    vscode: string;
    node: string;
    git: string;
    npm: string;
    os: string;
}

export interface NodeVersionInfo {
    current: string;
    available: string[];
    installed: string[];
}

export class VersionProvider implements vscode.TreeDataProvider<VersionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VersionItem | undefined | null | void> = new vscode.EventEmitter<VersionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<VersionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private versionInfo: VersionInfo = {
        vscode: '',
        node: '',
        git: '',
        npm: '',
        os: ''
    };

    constructor(private context: vscode.ExtensionContext) {
        this.loadVersionInfo();
    }

    refresh(): void {
        this.loadVersionInfo();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: VersionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: VersionItem): Thenable<VersionItem[]> {
        if (!element) {
            return Promise.resolve([
                new VersionItem('VS Code', this.versionInfo.vscode, vscode.TreeItemCollapsibleState.None),
                new VersionItem('Node.js', this.versionInfo.node, vscode.TreeItemCollapsibleState.None, 'node'),
                new VersionItem('Git', this.versionInfo.git, vscode.TreeItemCollapsibleState.None),
                new VersionItem('NPM', this.versionInfo.npm, vscode.TreeItemCollapsibleState.None),
                new VersionItem('操作系统', this.versionInfo.os, vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    }

    private async loadVersionInfo(): Promise<void> {
        try {
            // 获取 VS Code 版本
            this.versionInfo.vscode = vscode.version;

            // 使用 bash 脚本获取其他版本信息
            const scriptPath = this.getScriptPath();
            const result = await this.executeScript(scriptPath);
            
            if (result) {
                this.parseScriptOutput(result);
            }
        } catch (error) {
            console.error('获取版本信息失败:', error);
        }
    }

    private getScriptPath(): string {
        const scriptName = 'get-versions.sh';
        return path.join(this.context.extensionPath, 'scripts', scriptName);
    }

    private executeScript(scriptPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const command = `bash "${scriptPath}"`;
            
            cp.exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                if (error) {
                    console.error('脚本执行错误:', error);
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    private parseScriptOutput(output: string): void {
        const lines = output.split('\n');
        lines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            switch (key) {
                case 'NODE':
                    this.versionInfo.node = value || '未安装';
                    break;
                case 'GIT':
                    this.versionInfo.git = value || '未安装';
                    break;
                case 'NPM':
                    this.versionInfo.npm = value || '未安装';
                    break;
                case 'OS':
                    this.versionInfo.os = value || '未知';
                    break;
            }
        });
    }

    getVersionInfo(): VersionInfo {
        return this.versionInfo;
    }

    // 新增：获取Node版本信息
    async getNodeVersionInfo(): Promise<NodeVersionInfo> {
        try {
            const scriptPath = this.getNodeVersionScriptPath();
            const result = await this.executeScript(scriptPath);
            return this.parseNodeVersionOutput(result);
        } catch (error) {
            console.error('获取Node版本信息失败:', error);
            return {
                current: '未知',
                available: [],
                installed: []
            };
        }
    }

    private getNodeVersionScriptPath(): string {
        const scriptName = 'get-node-versions.sh';
        return path.join(this.context.extensionPath, 'scripts', scriptName);
    }

    private parseNodeVersionOutput(output: string): NodeVersionInfo {
        const lines = output.split('\n').filter(line => line.trim());
        const result: NodeVersionInfo = {
            current: '未知',
            available: [],
            installed: []
        };

        let section = '';
        lines.forEach(line => {
            if (line.startsWith('CURRENT:')) {
                result.current = line.replace('CURRENT:', '').trim();
            } else if (line.startsWith('AVAILABLE:')) {
                section = 'available';
            } else if (line.startsWith('INSTALLED:')) {
                section = 'installed';
            } else if (line.trim() && section) {
                if (section === 'available') {
                    result.available.push(line.trim());
                } else if (section === 'installed') {
                    result.installed.push(line.trim());
                }
            }
        });

        return result;
    }

    // 新增：切换Node版本
    async switchNodeVersion(version: string): Promise<boolean> {
        try {
            const scriptPath = this.getSwitchNodeVersionScriptPath();
            const command = `bash "${scriptPath}" ${version}`;
            
            await new Promise<void>((resolve, reject) => {
                cp.exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('切换Node版本失败:', error);
                        reject(error);
                        return;
                    }
                    console.log('切换Node版本成功:', stdout);
                    resolve();
                });
            });

            // 刷新版本信息
            this.refresh();
            return true;
        } catch (error) {
            console.error('切换Node版本失败:', error);
            return false;
        }
    }

    private getSwitchNodeVersionScriptPath(): string {
        const scriptName = 'switch-node-version.sh';
        return path.join(this.context.extensionPath, 'scripts', scriptName);
    }
}

class VersionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly itemType?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}: ${this.version}`;
        this.description = this.version;
        
        // 为Node.js项添加点击命令
        if (itemType === 'node') {
            this.command = {
                command: 'versionInfo.showNodeVersions',
                title: '查看Node版本管理',
                arguments: []
            };
        }
    }
}
EOF
    log_success "更新versionProvider.ts完成"

    # 创建nodeVersionPanel.ts
    cat > "src/webview/nodeVersionPanel.ts" << 'EOF'
import * as vscode from 'vscode';
import * as path from 'path';
import { VersionProvider, NodeVersionInfo } from '../versionProvider';

export class NodeVersionPanel {
    public static currentPanel: NodeVersionPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private versionProvider: VersionProvider;

    public static readonly viewType = 'nodeVersionInfo';

    constructor(private readonly context: vscode.ExtensionContext) {
        this.versionProvider = new VersionProvider(context);
    }

    public static createOrShow(context: vscode.ExtensionContext): void {
        const column = vscode.ViewColumn.Two;

        if (NodeVersionPanel.currentPanel) {
            NodeVersionPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NodeVersionPanel.viewType,
            'Node.js 版本管理',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
                ]
            }
        );

        NodeVersionPanel.currentPanel = new NodeVersionPanel(context);
        NodeVersionPanel.currentPanel._panel = panel;
        NodeVersionPanel.currentPanel._update();

        panel.onDidDispose(() => NodeVersionPanel.currentPanel?.dispose(), null, NodeVersionPanel.currentPanel._disposables);

        // 处理来自webview的消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'switchVersion':
                        NodeVersionPanel.currentPanel?.handleSwitchVersion(message.version);
                        break;
                    case 'refresh':
                        NodeVersionPanel.currentPanel?._update();
                        break;
                }
            },
            null,
            NodeVersionPanel.currentPanel._disposables
        );
    }

    public dispose(): void {
        NodeVersionPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async handleSwitchVersion(version: string): Promise<void> {
        try {
            // 显示进度提示
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `正在切换到 Node.js ${version}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 50 });
                
                const success = await this.versionProvider.switchNodeVersion(version);
                
                progress.report({ increment: 100 });
                
                if (success) {
                    vscode.window.showInformationMessage(`成功切换到 Node.js ${version}`);
                    // 刷新面板
                    setTimeout(() => this._update(), 1000);
                } else {
                    vscode.window.showErrorMessage(`切换到 Node.js ${version} 失败`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`切换版本时发生错误: ${error}`);
        }
    }

    private async _update(): Promise<void> {
        const webview = this._panel.webview;
        this._panel.title = 'Node.js 版本管理';
        
        try {
            const nodeVersionInfo = await this.versionProvider.getNodeVersionInfo();
            this._panel.webview.html = this._getHtmlForWebview(webview, nodeVersionInfo);
        } catch (error) {
            console.error('更新Node版本面板失败:', error);
            this._panel.webview.html = this._getErrorHtml();
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, nodeVersionInfo: NodeVersionInfo): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node.js 版本管理</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .current-version {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        .version-section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-button-background);
        }
        .version-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .version-item {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            transition: all 0.2s ease;
        }
        .version-item:hover {
            background-color: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-button-background);
        }
        .version-number {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .version-current {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .version-installed {
            border-color: var(--vscode-textLink-foreground);
        }
        .switch-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s ease;
        }
        .switch-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .switch-btn:disabled {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: not-allowed;
        }
        .refresh-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 20px;
        }
        .refresh-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .timestamp {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-top: 20px;
        }
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            margin-left: 8px;
        }
        .status-current {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .status-installed {
            background-color: var(--vscode-textLink-foreground);
            color: var(--vscode-button-foreground);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Node.js 版本管理</h1>
            <p>使用 NVM 管理 Node.js 版本</p>
        </div>
        
        <div class="current-version">
            <h2>当前版本: ${nodeVersionInfo.current}</h2>
        </div>

        ${nodeVersionInfo.installed.length > 0 ? `
        <div class="version-section">
            <h3 class="section-title">已安装版本</h3>
            <div class="version-grid">
                ${nodeVersionInfo.installed.map(version => `
                    <div class="version-item ${version === nodeVersionInfo.current ? 'version-current' : 'version-installed'}">
                        <div class="version-number">
                            ${version}
                            ${version === nodeVersionInfo.current ? '<span class="status-badge status-current">当前</span>' : '<span class="status-badge status-installed">已安装</span>'}
                        </div>
                        <button class="switch-btn" ${version === nodeVersionInfo.current ? 'disabled' : ''} onclick="switchVersion('${version}')">
                            ${version === nodeVersionInfo.current ? '当前版本' : '切换使用'}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${nodeVersionInfo.available.length > 0 ? `
        <div class="version-section">
            <h3 class="section-title">最新可用版本 (前5个)</h3>
            <div class="version-grid">
                ${nodeVersionInfo.available.slice(0, 5).map(version => `
                    <div class="version-item">
                        <div class="version-number">${version}</div>
                        <button class="switch-btn" onclick="switchVersion('${version}')">
                            安装并使用
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : `
        <div class="empty-state">
            <p>无法获取可用版本信息</p>
            <p>请确保已安装 NVM</p>
        </div>
        `}

        <div style="text-align: center;">
            <button class="refresh-btn" onclick="refresh()">刷新版本信息</button>
        </div>
        
        <div class="timestamp">
            最后更新: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function switchVersion(version) {
            vscode.postMessage({
                command: 'switchVersion',
                version: version
            });
        }

        function refresh() {
            vscode.postMessage({
                command: 'refresh'
            });
        }
    </script>
</body>
</html>`;
    }

    private _getErrorHtml(): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Node.js 版本管理 - 错误</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            text-align: center;
        }
        .error-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px;
        }
        .error-icon {
            font-size: 48px;
            color: var(--vscode-errorForeground);
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2>无法加载 Node.js 版本信息</h2>
        <p>可能的原因：</p>
        <ul style="text-align: left; display: inline-block;">
            <li>NVM 未安装或未配置</li>
            <li>网络连接问题</li>
            <li>权限不足</li>
        </ul>
        <button onclick="location.reload()" style="
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
        ">重试</button>
    </div>
</body>
</html>`;
    }
}
EOF
    log_success "创建nodeVersionPanel.ts完成"
}



# 创建bash脚本
create_bash_scripts() {
    log_info "创建bash脚本..."
    
    # 创建get-node-versions.sh
    cat > "scripts/get-node-versions.sh" << 'EOF'
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
    if check_nvm; then
        # 使用nvm获取已安装版本
        nvm list --no-colors 2>/dev/null | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/[^v0-9.]//g' | grep -v "^$" | head -10
    fi
}

# 获取可用的最新版本
get_available_versions() {
    if check_nvm; then
        # 获取最新的LTS和stable版本
        {
            # 最新LTS版本
            nvm list-remote --lts --no-colors 2>/dev/null | tail -5 | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/.*\(v[0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/'
            # 最新stable版本
            nvm list-remote --no-colors 2>/dev/null | tail -5 | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | sed 's/.*\(v[0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/'
        } | sort -V | uniq | tail -5
    else
        # 如果没有nvm，尝试从Node.js官网获取版本信息
        curl -s https://nodejs.org/dist/index.json 2>/dev/null | grep -o '"version":"[^"]*"' | head -5 | cut -d'"' -f4 2>/dev/null || echo ""
    fi
}

# 输出结果
echo "CURRENT:$(get_current_version)"
echo "AVAILABLE:"
get_available_versions
echo "INSTALLED:"
get_installed_versions


EOF
    log_success "创建get-node-versions.sh脚本"


# 创建nodeVersionPanel.ts
cat > "scripts/switch-node-version.sh" << 'EOF'
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

# 加载nvm
if ! load_nvm; then
    exit 1
fi

# 确保版本号以v开头
if [[ ! $VERSION =~ ^v ]]; then
    VERSION="v$VERSION"
fi

echo "正在切换到Node.js $VERSION..."

# 检查版本是否已安装
if nvm list | grep -q "$VERSION"; then
    echo "版本 $VERSION 已安装，正在切换..."
    nvm use "$VERSION"
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
    nvm install "$VERSION"
    if [ $? -eq 0 ]; then
        echo "成功安装并切换到 Node.js $VERSION"
        echo "当前版本: $(node --version)"
        echo "当前NPM版本: $(npm --version)"
        
        # 设置为默认版本
        nvm alias default "$VERSION"
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

EOF
    log_success "创建get-node-versions.sh脚本"

}

cd ./version-info-extension789
create_bash_scripts
update_typescript_files
update_package_json
log_info "TypeScript文件更新完成"
