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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>版本信息</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .version-container {
            max-width: 600px;
            margin: 0 auto;
        }
        .version-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .version-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 6px;
            border-left: 4px solid var(--vscode-button-background);
        }
        .version-label {
            font-weight: bold;
            color: var(--vscode-button-background);
        }
        .version-value {
            font-family: var(--vscode-editor-font-family);
            color: var(--vscode-textLink-foreground);
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
    </style>
</head>
<body>
    <div class="version-container">
        <div class="version-header">
            <h1>系统版本信息</h1>
            <p>当前开发环境版本详情</p>
        </div>
        
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
        
        <div class="timestamp">
            最后更新: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>`;
    }
}
