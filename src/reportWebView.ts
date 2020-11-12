import * as vscode from "vscode"
import { Node } from "@npmcli/arborist"
import { Analysis } from "./analyze"

export class ReportWebView {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ReportWebView | undefined

  public static readonly viewType = "catCoding"

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private _disposables: vscode.Disposable[] = []

  private analysis: Analysis
  private node: Node

  public static createOrShow(
    extensionUri: vscode.Uri,
    analysis: Analysis,
    node: Node
  ): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined

    // If we already have a panel, show it.
    if (ReportWebView.currentPanel) {
      const currentPanel = ReportWebView.currentPanel
      currentPanel.analysis = analysis
      currentPanel.node = node
      currentPanel._panel.title = node.name
      currentPanel._panel.reveal(column)
      currentPanel._update()
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      ReportWebView.viewType,
      node.name,
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      }
    )

    ReportWebView.currentPanel = new ReportWebView(panel, extensionUri, analysis, node)
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    analysis: Analysis,
    node: Node
  ): void {
    ReportWebView.currentPanel = new ReportWebView(panel, extensionUri, analysis, node)
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    analysis: Analysis,
    node: Node
  ) {
    this._panel = panel
    this._extensionUri = extensionUri
    this.analysis = analysis
    this.node = node

    // Set the webview's initial html content
    this._update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update()
        }
      },
      null,
      this._disposables
    )

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text)
            return
        }
      },
      null,
      this._disposables
    )
  }

  public doRefactor(): void {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" })
  }

  public dispose(): void {
    ReportWebView.currentPanel = undefined

    // Clean up our resources
    this._panel.dispose()

    while (this._disposables.length) {
      const x = this._disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  private _update() {
    const webview = this._panel.webview
    this._panel.title = this.node.name
    this._panel.webview.html = this._getHtmlForWebview(webview)
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, "media", "main.js")

    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk)

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    )

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath)
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath)

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce()

    const { url, owner, repo, forks, stars } = this.analysis.data
    const pkg = this.node.package.name ?? ""

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
				<title>Cat Coding</title>
			</head>
			<body>
        <h1>${this.node?.name}</h1>
        <p>${this.node.package.description}
        <ul>
          <li>URL: ${url}</li>
          <li>Package: ${pkg}</li>
          <li>Owner: ${owner}</li>
          <li>Repo: ${repo}</li>
          <li>Forks: ${forks}</li>
          <li>Stars: ${stars}</li>
        </ul>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`
  }
}

function getNonce() {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
