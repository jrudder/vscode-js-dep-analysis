import * as vscode from "vscode"
import { Arborist, Node } from "@npmcli/arborist"
import { ArboristProvider } from "./depsTree"

// DepsView setups up the view for the `DepNodeProvider`
export default class DepsView {
  constructor(context: vscode.ExtensionContext) {
    const folders = vscode.workspace.workspaceFolders
    if (folders === undefined) {
      return
    }

    // TODO: handle case where URI points to a non-local path
    // TODO: handle case where there are multiple workspace folders
    const arb = new Arborist({
      path: folders[0].uri.path,
    })
    arb.loadActual().then((tree) => {
      // Create the data provider and view
      const treeDataProvider = new ArboristProvider(tree)
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
      vscode.commands.registerCommand("nodeDependencies.editEntry", (node: Node) =>
        vscode.window.showInformationMessage(
          `Successfully called edit entry on ${node.name}.`
        )
      )
      vscode.commands.registerCommand("nodeDependencies.deleteEntry", (node: Node) =>
        vscode.window.showInformationMessage(
          `Successfully called delete entry on ${node.name}.`
        )
      )
    })
  }
}
