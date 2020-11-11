import * as vscode from "vscode"
import * as path from "path"
import { Node } from "@npmcli/arborist"

// Event is emitted when the tree data changes
type Event = Node | void

export class ArboristProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Event>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event

  constructor(private readonly root: Node) {}

  // getChildren returns the children of the given `element` or the root children
  // iff `element` is `undefined`
  async getChildren(element?: Node): Promise<Node[]> {
    const node = element ?? this.root
    return Array.from(node.edgesOut.values())
      .filter((edge) => edge.type === "prod")
      .map((edge) => edge.to)
  }

  // getTreeItem returns a `vscode.TreeItem` for the given `Node`
  getTreeItem({ name, edgesOut, package: pkg }: Node): vscode.TreeItem {
    const version = pkg?.version ?? ""

    if (edgesOut.size === 0) {
      return new Dependency(name, version, vscode.TreeItemCollapsibleState.None, {
        command: "extension.openPackageOnNpm",
        title: "",
        arguments: [name],
      })
    }

    return new Dependency(name, version, vscode.TreeItemCollapsibleState.Collapsed)
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

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  }

  contextValue = "dependency"
}
