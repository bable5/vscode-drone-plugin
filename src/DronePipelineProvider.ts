import * as vscode from 'vscode';
import { parseAllDocuments, Document, ParsedNode } from 'yaml';
import * as fs from 'fs';

const NODE_TYPE_PIPELINE = "NODE_TYPE_PIPELINE";
const NODE_TYPE_STEPS = "NODE_TYPE_STEPS";
const NODE_TYPE_STEP = "NODE_TYPE_STEP";
const NODE_TYPE_LABEL = "NODE_TYPE_LABEL";
const NODE_TYPE_COMMANDS = "NODE_TYPE_COMMANDS";

type NodeType = typeof NODE_TYPE_PIPELINE
    | typeof NODE_TYPE_STEPS
    | typeof NODE_TYPE_STEP
    | typeof NODE_TYPE_LABEL
    | typeof NODE_TYPE_COMMANDS;

async function parseDroneFile(droneFilePath: string): Promise<Document.Parsed<ParsedNode>[] | undefined> {
    try {
        const droneFile = await fs.promises.readFile(droneFilePath, 'utf-8');
        const pipeline = parseAllDocuments(droneFile);
        return pipeline as Document.Parsed<ParsedNode>[]; // TODO: Handle the EmptyStream case.
    } catch (err) {
        vscode.window.showErrorMessage(`Failed to load ${droneFilePath}`);
        console.error(err);
        return undefined;
    }
}

export class DronePipelineProvider implements vscode.TreeDataProvider<DroneNode> {

    constructor(private droneFilePath: string) {

    }

    onDidChangeTreeData?: vscode.Event<any> | undefined;
    refresh(): void {

        // this._onDidChangeTreeData.fire();
    }
    getTreeItem(element: any): vscode.TreeItem {
        return element;
    }
    getChildren(element?: DroneNode): Thenable<DroneNode[]> {
        if (!element) {
            return parseDroneFile(this.droneFilePath)
                .then(dronePipeline => dronePipeline ? dronePipeline.map(d => {
                    const asJson = d.contents?.toJSON();
                    const kind = asJson["kind"];
                    const prefix = kind ? `${kind}: ` : "";
                    return new DroneNode(`${prefix}${asJson["name"]}`, vscode.TreeItemCollapsibleState.Collapsed, NODE_TYPE_PIPELINE, asJson);
                })  : [] // falsy to empty list.
                );
        }

        if (element.nodeType === NODE_TYPE_PIPELINE) {
            return this.childrenOfPipeline(element);
        }

        if (element.nodeType === NODE_TYPE_STEPS) {
            return this.pipelineSteps(element);
        }

        if (element.nodeType === NODE_TYPE_STEP) {
            return this.pipelineStep(element);
        }

        if (element.nodeType === NODE_TYPE_COMMANDS) {
            return this.commands(element);
        }

        return Promise.resolve([]);
    }

    childrenOfPipeline(element: DroneNode): Thenable<DroneNode[]> {
        const nodes = [] as DroneNode[];
        const children = element.children;


        //Triggers
        //Steps
        const steps = children["steps"];

        nodes.push(
            new DroneNode("steps", vscode.TreeItemCollapsibleState.Collapsed, NODE_TYPE_STEPS, steps)
        );

        return Promise.resolve(nodes);
    }

    pipelineSteps(element: DroneNode): Thenable<DroneNode[]> {
        const children = element.children;

        return Promise.resolve(
            children.map((step: any) => {
                //TODO: Handle no name? Can drone allow that? Bad drone files do.
                //TODO: Handle no image?
                return new DroneNode(
                    `${step["name"]}: ${step["image"]}`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    NODE_TYPE_STEP,
                    {
                        commands: step["commands"],
                        dependsOn: step["depends_on"]
                    }
                );
            }));
    }

    pipelineStep(element: DroneNode): Thenable<DroneNode[]> {
        const commands = new DroneNode(
            "commands",
            vscode.TreeItemCollapsibleState.Expanded,
            NODE_TYPE_COMMANDS,
            element.children["commands"]
        );

        return Promise.resolve([commands]);
    }

    commands(element: DroneNode): Thenable<DroneNode[]> {
        return Promise.resolve(
            element.children.map((step: any) => new DroneNode(
                step,
                vscode.TreeItemCollapsibleState.None,
                NODE_TYPE_LABEL,
                step
            ))
        );
    }
}

class DroneNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly nodeType: NodeType,
        public readonly children: any
    ) {
        super(label, collapsibleState);
    }
}
