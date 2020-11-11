import * as vscode from "vscode"
import { DepNodeProvider, Dependency } from "./depsTree"

// DepsView setups up the view for the `DepNodeProvider`
export default class DepsView {
  constructor(context: vscode.ExtensionContext) {
    // Create the data provider and view
    const treeDataProvider = new DepNodeProvider(vscode.workspace.rootPath ?? "")
    const view = vscode.window.createTreeView("nodeDependencies", {
      treeDataProvider,
      showCollapseAll: true,
    })
    context.subscriptions.push(view)
    vscode.window.registerTreeDataProvider("nodeDependencies", treeDataProvider)

    // Register commands
    vscode.commands.registerCommand("nodeDependencies.refreshEntry", () =>
      treeDataProvider.refresh()
    )
    vscode.commands.registerCommand("extension.openPackageOnNpm", (moduleName) =>
      vscode.commands.executeCommand(
        "vscode.open",
        vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)
      )
    )
    vscode.commands.registerCommand("nodeDependencies.addEntry", () =>
      vscode.window.showInformationMessage(`Successfully called add entry.`)
    )
    vscode.commands.registerCommand("nodeDependencies.editEntry", (node: Dependency) =>
      vscode.window.showInformationMessage(
        `Successfully called edit entry on ${node.label}.`
      )
    )
    vscode.commands.registerCommand("nodeDependencies.deleteEntry", (node: Dependency) =>
      vscode.window.showInformationMessage(
        `Successfully called delete entry on ${node.label}.`
      )
    )
  }
}
