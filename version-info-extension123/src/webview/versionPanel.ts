import * as vscode from 'vscode';
import * as path from 'path';
import { VersionProvider } from '../versionProvider';

export class VersionPanel {
    public static currentPanel: VersionPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private versionProvider: VersionProvider;

    public static readonly viewType = 'versionInfo';

    constructor(private readonly context: vscode.ExtensionContext) {
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

    private _update(): void {
        const webview = this._panel.webview;
        this._panel.title = '版本信息';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const versionInfo = this.versionProvider.getVersionInfo();

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>版本信息 - 多标签切换</title>
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
            <div class="current-version">
            <h2>当前版本: ${versionInfo.node}</h2>
        </div>
        </div>

        <div id="git" class="tab-content">
            嘿嘿嘿
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
