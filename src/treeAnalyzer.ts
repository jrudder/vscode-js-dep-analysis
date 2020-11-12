import { Node } from "@npmcli/arborist"
import { Analyze, Analysis, Cache } from "./analyze"

// onProgress callback definition
type onProgress = (done: number, total: number) => void

// TreeAnalyzer analyzes an Arborist tree, providing feedback on progress and
// methods for extracting analysis from sections of the tree
export class TreeAnalyzer {
  private analysis = new Map<Node, Analysis>()

  constructor(
    public readonly tree: Node,
    private readonly cache: Cache,
    private readonly progress: onProgress
  ) {}

  // get the analysis for a given `Node`
  get(node: Node): Analysis | null {
    return this.analysis.get(node) ?? null
  }

  // children returns the the `edgesOut` of the node, filtered by type==="prod"
  // TODO: support checking/excluding certain dep types (e.g. prod or optional)
  children(node: Node): Node[] {
    const children = Array.from(node.edgesOut.values())
      .filter((edge) => edge.type === "prod")
      .map((edge) => edge.to)

    // this.analyze(children)

    return children
  }

  // analyze the given nodes, storing results in the `analysis` map and
  // calling the progress callback with status
  async analyze(nodes: Node[], onAnalyzed: (n: Node) => void): Promise<void> {
    let processed = 0
    const total = nodes.length

    // TODO: run in parallel with a configurable concurrency level
    this.progress(0, total)
    for (const node of nodes) {
      if (!this.analysis.get(node)) {
        const analysis = await Analyze(node, this.cache)
        this.analysis.set(node, analysis)
        onAnalyzed(node)
      }
      processed += 1
      this.progress(processed, total)
    }
  }
}
