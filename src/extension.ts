import * as vscode from 'vscode';
import { DronePipelineProvider } from './DronePipelineProvider';
import * as fs from 'fs';
import * as path from 'path';


const EXTENSION_NAME = 'drone-viewer.droneDependencies';

function findDroneFile(rootPath?: string): string | undefined {
	function traceDroneFilePath<A>(droneFile: A): A {
		console.log(`Drone File Path: ${JSON.stringify(droneFile)}`);
		return droneFile;
	}

	function pathExists(fsPath: string): string | undefined {
		try {
			fs.accessSync(fsPath);
		} catch (err) {
			return undefined;
		}
		return fsPath;
	}

	return traceDroneFilePath(
		rootPath && (pathExists(path.join(rootPath, '.drone.yml')) || pathExists(path.join(rootPath, '.drone.yaml')))
	);
}



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const rootPath = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const droneFilePath = findDroneFile(rootPath);

	// TODO: Can we control activation, predicated on if .drone.y(a?)ml exists?
	if (droneFilePath) {
		const dronePipelineProvider = new DronePipelineProvider(droneFilePath);

		vscode.window.registerTreeDataProvider(`${EXTENSION_NAME}`, dronePipelineProvider);
		vscode.commands.registerCommand(`${EXTENSION_NAME}.refreshEntry`, () => dronePipelineProvider.refresh());
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mooneyware-drone-viewer" is now active!');


}

// This method is called when your extension is deactivated
export function deactivate() { }
