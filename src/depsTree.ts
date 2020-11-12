import * as vscode from "vscode"
import * as path from "path"
import { Node } from "@npmcli/arborist"
import { Analyze, Analysis, Cache, Trust } from "./analyze"

// Element is the type of the items help by this TreeDataProvider
export type Element = [Analysis, Node]

// Event is emitted when the tree data changes
type Event = Element | void

const TRUST_LABELS: { [key in Trust]: string } = {
  high: "▲",
  indeterminate: "?",
  low: "▼",
}

export class ArboristProvider implements vscode.TreeDataProvider<Element> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Event>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  readonly elements = new Map<string, Element>()

  constructor(private readonly root: Element, private readonly cache: Cache) {}

  // getChildren returns the children of the given `element` or the root children
  // iff `element` is `undefined`
  async getChildren(element?: Element): Promise<Element[]> {
    const [, node] = element ?? this.root

    const result = Promise.all(
      Array.from(node.edgesOut.values())
        .filter((edge) => edge.type === "prod")
        .map(
          async (edge): Promise<Element> => {
            const analysis = await Analyze(edge.to, this.cache)
            const result: Element = [analysis, edge.to]

            // Make the element available through `elements`
            const url = analysis?.data.url
            if (url) {
              this.elements.set(url, result)
            }

            return result
          }
        )
    )

    return result
  }

  // getTreeItem returns a `vscode.TreeItem` for the given `Element`
  getTreeItem(element: Element): vscode.TreeItem {
    const [analysis, { name, edgesOut, package: pkg }] = element

    const version = pkg?.version ?? ""
    const label = `${TRUST_LABELS[analysis?.trust ?? "indeterminate"]} ${name}`
    const command = {
      command: "nodeDependencies.select",
      title: "",
      arguments: [element],
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

  iconPath = {
    light: path.join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: path.join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  }

  contextValue = "dependency"
}
