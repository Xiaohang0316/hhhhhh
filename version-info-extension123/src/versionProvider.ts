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
