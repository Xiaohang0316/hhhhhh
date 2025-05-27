import * as vscode from 'vscode';
import * as path from 'path';
import { VersionProvider } from '../versionProvider';
import { NodeVersionPanel } from './nodeVersionPanel';


export class VersionPanel {
    public static currentPanel: VersionPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private versionProvider: VersionProvider;

    public static readonly viewType = 'versionInfo';

    constructor(private readonly context: vscode.ExtensionContext, public nodeVersionPanel: NodeVersionPanel) {
        this.versionProvider = new VersionProvider(context);
    }

    public createOrShow(): void {
        const column = vscode.ViewColumn.Two;

        if (VersionPanel.currentPanel) {
            VersionPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            VersionPanel.viewType,
            '版本信息',
            column,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webview'))
                ]
            }
        );

        VersionPanel.currentPanel = new VersionPanel(this.context);
        VersionPanel.currentPanel._panel = panel;
        VersionPanel.currentPanel._update();

        panel.onDidDispose(() => this.dispose(), null, this._disposables);
       
    }

    public refresh(): void {
        if (VersionPanel.currentPanel) {
            VersionPanel.currentPanel._update();
        }
    }

    public dispose(): void {
        VersionPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.title = '版本信息';
        const nodeVersionInfo = await this.versionProvider.getNodeVersionInfo()
        this._panel.webview.html = this._getHtmlForWebview(webview, nodeVersionInfo);
    }

    private _getHtmlForWebview(webview: vscode.Webview, nodeVersionInfo: any) {
        const versionInfo = this.versionProvider.getVersionInfo();
        const nodeVersionPlan = this.nodeVersionPanel
        

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>版本信息 - 多标签切换</title>
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
    <style>
        body {
            font-family: var(--vscode-font-family, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
            font-size: var(--vscode-font-size, 14px);
            color: var(--vscode-foreground, #333);
            background-color: var(--vscode-editor-background, #fff);
            padding: 20px;
            margin: 0;
        }
        .version-container {
            max-width: 600px;
            margin: 0 auto;
        }
        .version-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border, #ccc);
        }

        /* Tab 样式 */
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border, #ccc);
            margin-bottom: 20px;
        }
        .tab {
            flex: 1;
            text-align: center;
            padding: 10px 0;
            cursor: pointer;
            background-color: var(--vscode-editor-background, #fff);
            border: 1px solid transparent;
            border-bottom: none;
            user-select: none;
            font-weight: 600;
            color: var(--vscode-button-background, #007acc);
        }
        .tab.active {
            border: 1px solid var(--vscode-button-background, #007acc);
            border-bottom: 1px solid var(--vscode-editor-background, #fff);
            background-color: var(--vscode-editor-inactiveSelectionBackground, #e6f1fb);
            color: var(--vscode-button-foreground, #fff);
        }

        /* Tab 内容 */
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }

        .version-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground, #f3f3f3);
            border-radius: 6px;
            border-left: 4px solid var(--vscode-button-background, #007acc);
        }
        .version-label {
            font-weight: bold;
            color: var(--vscode-button-background, #007acc);
        }
        .version-value {
            font-family: var(--vscode-editor-font-family, monospace);
            color: var(--vscode-textLink-foreground, #0066cc);
        }
        .timestamp {
            text-align: center;
            color: var(--vscode-descriptionForeground, #666);
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="version-container">
        <div class="version-header">
            <h1>系统版本信息</h1>
            <p>当前开发环境版本详情</p>
        </div>

        <div class="tabs">
            <div class="tab active" data-tab="vscode">Version</div>
            <div class="tab" data-tab="node">Node.js</div>
            <div class="tab" data-tab="git">Git</div>
            <div class="tab" data-tab="npm">NPM</div>
        </div>

        <div id="vscode" class="tab-content active">
            <div class="version-item">
                <span class="version-label">VS Code</span>
                <span class="version-value">${versionInfo.vscode || '获取中...'}</span>
            </div>
            <div class="version-item">
                <span class="version-label">Node.js</span>
                <span class="version-value">${versionInfo.node || '获取中...'}</span>
            </div>
            <div class="version-item">
                <span class="version-label">Git</span>
                <span class="version-value">${versionInfo.git || '获取中...'}</span>
            </div>
            <div class="version-item">
                <span class="version-label">NPM</span>
                <span class="version-value">${versionInfo.npm || '获取中...'}</span>
            </div>
            <div class="version-item">
                <span class="version-label">操作系统</span>
                <span class="version-value">${versionInfo.os || '获取中...'}</span>
            </div>
        </div>

        <div id="node" class="tab-content">
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
        </div>
        </div>

        <div id="git" class="tab-content">
            <div class="function-section">
                <div class="section-header">
                    <h3 class="section-title">当前文件函数</h3>
                    <div class="function-controls">
                        <button class="control-btn" onclick="getFunctions()">获取函数</button>
                        <button class="control-btn" onclick="foldAll()">全部折叠</button>
                        <button class="control-btn" onclick="expandAll()">全部展开</button>
                    </div>
                </div>
                
                <div id="functionList" class="function-list">
                    <div class="empty-state">
                        <p>点击"获取函数"按钮来获取当前文件的函数列表</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="npm" class="tab-content">
            emmmmmmmm
        </div>

  

        <div class="timestamp">
            最后更新: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>

    <script>
        // Tab 切换逻辑
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 先移除所有 tab 和内容的 active
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // 当前点击的 tab 激活
                tab.classList.add('active');
                // 通过 data-tab 找到对应的内容区激活
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });
    </script>
</body>
</html>
`;
    }
}
