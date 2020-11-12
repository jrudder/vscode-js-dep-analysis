import * as vscode from "vscode"
import { Arborist, Node } from "@npmcli/arborist"
import { ArboristProvider, Element } from "./depsTree"
import { Doc } from "./doc"

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
      // Create the tree view
      const treeDataProvider = new ArboristProvider([null, tree], context.globalState)
      const treeView = vscode.window.createTreeView("nodeDependencies", {
        treeDataProvider,
        showCollapseAll: true,
      })
      context.subscriptions.push(treeView)
      vscode.window.registerTreeDataProvider("nodeDependencies", treeDataProvider)

      // Create the virtual document view
      const scheme = "js-sec-maybe"
      const doc = new Doc(treeDataProvider.elements)
      context.subscriptions.push( vscode.workspace.registerTextDocumentContentProvider(scheme, doc) )

      // Register commands for the tree view
      vscode.commands.registerCommand("nodeDependencies.refreshEntry", () => treeDataProvider.refresh() )
      vscode.commands.registerCommand("extension.openPackageOnNpm", (moduleName) => vscode.commands.executeCommand( "vscode.open", vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`) ) )
      vscode.commands.registerCommand("nodeDependencies.addEntry", () => vscode.window.showInformationMessage(`Successfully called add entry.`) )
      vscode.commands.registerCommand("nodeDependencies.editEntry", (node: Node) => vscode.window.showInformationMessage( `Successfully called edit entry on ${node.name}.` ) )
      vscode.commands.registerCommand("nodeDependencies.deleteEntry", (node: Node) => vscode.window.showInformationMessage( `Successfully called delete entry on ${node.name}.` ) )

      // Register commands for the document
      vscode.commands.registerCommand("nodeDependencies.select",
        async (element: Element) => {
          const [analysis, { name }] = element

          if (analysis === null) {
            vscode.window.showInformationMessage(`Analysis not available for ${name}`)
            return
          }

          const uri = vscode.Uri.parse(`${scheme}:${analysis.data.url}`)
          const doc = await vscode.workspace.openTextDocument(uri)
          await vscode.window.showTextDocument(doc, { preview: false })
        }
      )
    })
  }
}
