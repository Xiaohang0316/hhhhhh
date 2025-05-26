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
