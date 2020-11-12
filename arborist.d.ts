// TypeScript definition for @npmcli/arborist
// NOTE: This is a partial definition, containing only those pieces actually
// needed by the extension. It is NOT intended to be a comprehensive definition.

declare module "@npmcli/arborist" {
  export class Arborist {
    constructor(opt?: Options)

    // loadActual reads the actual contents of node_modules
    loadActual(): Promise<Node>

    // loadVirtual reads the package-lock.json/npm-shrinkwrap
    loadVirtual(): Promise<Node>
  }

  // Options object
  interface Options {
    // where we're doing stuff.  defaults to cwd.
    path?: string
  }

  interface Node {
    // name of this node's folder in `node_modules`
    name: string

    // package in whose `node_modules` folder this package lives; `null` if node
    // is top of tree
    parent: string | null

    // map of packages located in the node's `node_modules` folder
    children: Map<string, Node>

    // contents of this node's `package.json` file
    package: {
      name?: string
      description?: string
      version?: string
      repository?: {
        type?: string
        url?: string
      }
    }

    // edges in the graph that this node depends on
    edgesOut: Map<string, Edge>

    // edges in the graph that depend on this node
    edgesIn: Map<string, Edge>
  }

  interface Edge {
    // node that has the dependency
    from: Node

    // the depended-upon node
    to: Node

    // type of dependency
    type: "prod" | "dev" | "peer" | "optional"

    // name of the dependency from `package.json` dependencies
    name: string

    // npm specifier; a version, range, tag name, git url, or tarball URL
    spec: string

    // indicator of any problem or `null` if no errors
    error: "DETACHED" | "MISSING" | "PEER LOCAL" | "INVALID" | null
  }
}
