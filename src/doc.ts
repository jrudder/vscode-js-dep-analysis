import { EventEmitter, TextDocumentContentProvider, Uri } from "vscode"
import { Node } from "@npmcli/arborist"
import { Element } from "./depsTree"
import { Analysis } from "./analyze"

export class Doc implements TextDocumentContentProvider {
  // emitter and its event
  onDidChangeEmitter = new EventEmitter<Uri>()
  onDidChange = this.onDidChangeEmitter.event

  constructor(private readonly elements: Map<string, Element>) {}

  async provideTextDocumentContent(uri: Uri): Promise<string> {
    const path = uri.path
    const element = this.elements.get(path)
    if (!element) {
      return `Data not available for ${path}`
    }
    const [analysis, node] = element
    if (!analysis) {
      return `Analysis not available for ${path}`
    }

    return render(analysis, node)
  }
}

// render returns a string representation of the analysis for display as a
// text document in a readonly editor window
function render(analysis: NonNullable<Analysis>, node: Node): string {
  const { url, owner, repo, forks, stars } = analysis.data
  const pkg = node.package.name ?? ""
  return `Analysis of ${url}:

Package: ${pkg}
Owner: ${owner}
Repo: ${repo}
Forks: ${forks}
Stars: ${stars}
`
}
