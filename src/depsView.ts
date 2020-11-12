import * as vscode from "vscode"
import { Arborist, Node } from "@npmcli/arborist"
import { ArboristProvider } from "./depsTree"
import { ReportWebView } from "./reportWebView"
import { TreeAnalyzer } from "./treeAnalyzer"

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
    arb.loadActual().then(async (tree) => {
      const treeAnalyzer = new TreeAnalyzer(
        tree,
        context.globalState,
        (processed, total) => {
          // Show progress in the status bar, hiding the status element when complete
          if (processed === total) {
            status.hide()
          } else {
            status.text = `Analyzing: ${processed} / ${total}`
            status.show()
          }
        }
      )
      const treeDataProvider = new ArboristProvider(treeAnalyzer)
      const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
      context.subscriptions.push(status)
      status.show()

      // Create the tree view
      const treeView = vscode.window.createTreeView("nodeDependencies", {
        treeDataProvider,
        showCollapseAll: true,
      })
      context.subscriptions.push(treeView)
      vscode.window.registerTreeDataProvider("nodeDependencies", treeDataProvider)

      // Create a web view
      if (vscode.window.registerWebviewPanelSerializer) {
        // Make sure we register a serializer in activation event
        vscode.window.registerWebviewPanelSerializer(ReportWebView.viewType, {
          async deserializeWebviewPanel(/* webviewPanel: vscode.WebviewPanel, state: unknown */) {
            // TODO: handle reviving the web view
            // console.log(`Got state: ${state}`)
            // ReportWebView.revive(webviewPanel, context.extensionUri);
          },
        })
      }

      // Register commands for the tree view
      // prettier-ignore
      {
      vscode.commands.registerCommand("nodeDependencies.refreshEntry", () => treeDataProvider.refresh() )
      vscode.commands.registerCommand("extension.openPackageOnNpm", (moduleName) => vscode.commands.executeCommand( "vscode.open", vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`) ) )
      vscode.commands.registerCommand("nodeDependencies.addEntry", () => vscode.window.showInformationMessage(`Successfully called add entry.`) )
      vscode.commands.registerCommand("nodeDependencies.deleteEntry", (node: Node) => vscode.window.showInformationMessage( `Successfully called delete entry on ${node.name}.` ) )
      }
      vscode.commands.registerCommand(
        "nodeDependencies.selectEntry",
        async (node: Node) => {
          const analysis = treeAnalyzer.get(node)
          if (!analysis) {
            vscode.window.showInformationMessage(`Analysis not available for ${node.name}`)
            return
          }

          ReportWebView.createOrShow(context.extensionUri, analysis, node)
        }
      )
    })
  }
}
