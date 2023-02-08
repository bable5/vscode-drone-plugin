import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class DronePipelineProvider implements vscode.TreeDataProvider<Dependency> {

    constructor(private workspaceRoot: string | undefined) {

    }

    onDidChangeTreeData?: vscode.Event<Dependency> | undefined;
    refresh(): void {

        // this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: Dependency): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependencies in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        }

        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

        if (this.pathExists(packageJsonPath)) {
            return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        }

        vscode.window.showInformationMessage("Workspace has no package.json");
        return Promise.resolve([]);
    }

    private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
        const workspaceRoot = this.workspaceRoot;
        if (this.pathExists(packageJsonPath) && workspaceRoot) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const toDep = (moduleName: string, version: string): Dependency => {
                if (this.pathExists(path.join(workspaceRoot, 'node_modules', moduleName))) {
                    return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                }
                return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
                    command: 'extension.openPackageOnNpm',
                    title: '',
                    arguments: [moduleName]
                });
            };

            const deps = packageJson.dependencies ?
                Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
                : [];

            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
                : [];

            return deps.concat(devDeps);
        }

        return [];
    }

    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p); // COULD BE ASYNC
        } catch (err) {
            return false;
        }

        return true;
    }
}

export class Dependency extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;

        this.description = this.version;
    }

    iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}
