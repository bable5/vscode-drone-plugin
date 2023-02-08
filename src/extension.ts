// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Dependency, DronePipelineProvider } from './DronePipelineProvider';

const EXTENSION_NAME = 'drone-viewer.droneDependencies';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log(vscode.workspace.workspaceFolders);


	const rootPath = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const nodeDependenciesProvider = new DronePipelineProvider(rootPath);

	vscode.window.registerTreeDataProvider(`${EXTENSION_NAME}`, nodeDependenciesProvider);
	vscode.commands.registerCommand(`${EXTENSION_NAME}.refreshEntry`, () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand(`${EXTENSION_NAME}.addEntry`, () => vscode.window.showInformationMessage('Successfully called add entry'));
	vscode.commands.registerCommand(`${EXTENSION_NAME}.editEntry`,  (node: Dependency) => vscode.window.showInformationMessage(`Successfully called edit entry on ${node.label}.`));
	vscode.commands.registerCommand(`${EXTENSION_NAME}.deleteEntry`, (node: Dependency) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mooneyware-drone-viewer" is now active!');


}

// This method is called when your extension is deactivated
export function deactivate() { }
