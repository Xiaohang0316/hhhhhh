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
