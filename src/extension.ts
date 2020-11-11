import * as vscode from "vscode"
import DepsView from "./depsView"

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Create a new view
  new DepsView(context)
}
