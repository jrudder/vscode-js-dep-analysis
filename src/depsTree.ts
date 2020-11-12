import * as vscode from "vscode"
import { Node } from "@npmcli/arborist"
import { TreeAnalyzer } from "./treeAnalyzer"
import { Trust } from "./analyze"

// Event is emitted when the tree data changes
type Event = Node | void

const TRUST_LABELS: { [key in Trust | "pending"]: string } = {
  high: "▲",
  indeterminate: "-",
  low: "▼",
  pending: ".",
}

export class ArboristProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Event>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  constructor(private readonly treeAnalyzer: TreeAnalyzer) {}

  // getChildren returns the children of the given `node` or the root children
  // iff `node` is `undefined`
  async getChildren(node: Node = this.treeAnalyzer.tree): Promise<Node[]> {
    const children = this.treeAnalyzer.children(node)
    this.treeAnalyzer.analyze(children, (node: Node) => {
      this._onDidChangeTreeData.fire(node)
    })
    return children
  }

  // getTreeItem returns a `vscode.TreeItem` for the given `Node`
  getTreeItem(node: Node): vscode.TreeItem {
    const analysis = this.treeAnalyzer.get(node)

    const { name, edgesOut, package: pkg } = node

    const version = pkg?.version ?? ""
    const label = `${TRUST_LABELS[analysis?.trust ?? "pending"]} ${name}`
    const command = {
      command: "nodeDependencies.selectEntry",
      title: "",
      arguments: [node],
    }

    if (edgesOut.size === 0) {
      return new Dependency(label, version, vscode.TreeItemCollapsibleState.None, command)
    }

    return new Dependency(label, version, vscode.TreeItemCollapsibleState.Collapsed)
  }

  // refresh notifies VS Code that we want to refresh
  refresh(): void {
    this._onDidChangeTreeData.fire()
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState)

    this.tooltip = `${this.label}-${this.version}`
    this.description = this.version
  }

  contextValue = "dependency"
}
