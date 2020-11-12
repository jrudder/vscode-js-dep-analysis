import * as vscode from "vscode"
import { Octokit } from "@octokit/rest"
import { ReposGetResponseData } from "@octokit/types"
import { Node } from "@npmcli/arborist"

// Analysis contains the information gathered and calculated about a repository
export type Analysis = {
  trust: Trust
  data: RepoData
} | null

export type Trust = "low" | "high" | "indeterminate"

// Cache to store analytics data across extension activations and workspaces
export interface Cache {
  get: <T>(key: string) => T | undefined
  update: <T>(key: string, value: T) => unknown
}

interface CacheEntry<T> {
  timestamp: number
  data: T
}

interface RepoData {
  url: string
  owner: string
  repo: string
  forks: number
  stars: number
  version: string
  dependencies: number
}

// Time consts for use with cache expiration
const MILLISECONDS = 1
const SECONDS = 1000 * MILLISECONDS
const MINUTES = 60 * SECONDS
const HOURS = 60 * MINUTES
const DAYS = 24 * HOURS

// Regex for parsing a repository URL of the form:
// scheme://user@host/owner/repo.git
// The captured groups are:
//   0: scheme
//   1: user (including the trailing @)
//   2: host
//   3: owner
//   4: repo
const REPO_REGEX = /^(.*):\/\/([^@]*@)?(.*)\/(.*)\/(.*).git$/

// TODO: find a better way / place to store this; this doesn't feel right for a token
// TODO: reconfigure auth when the configuration value changes
const octokit = new Octokit({
  auth: vscode.workspace
    .getConfiguration("")
    .get<string>("javascriptDependencyAnalysis.gitHubToken"),
})

// Analyze the given repository URL to determine trust level
export async function Analyze(node: Node | undefined, cache: Cache): Promise<Analysis> {
  if (!node) {
    return null
  }

  const url = node?.package?.repository?.url
  if (!url) {
    return null
  }

  const data = await getRepoData(node, url, cache)
  if (!data) {
    return null
  }

  if (data.forks >= 500 || data.stars >= 500) {
    return {
      trust: "high",
      data,
    }
  }
  const version = node.package.version ?? "0.0.0"
  if (data.forks === 0 || data.stars === 0 || version.split(".")[0] === "0") {
    return {
      trust: "low",
      data,
    }
  }

  return {
    trust: "indeterminate",
    data,
  }
}

// getRepoData extracts information about the given repository URL
// TODO: handle additional sources and make this more robust to malformed input
async function getRepoData(
  node: Node,
  url: string,
  cache: Cache
): Promise<RepoData | null> {
  const [matched, , , host, owner, repo] = REPO_REGEX.exec(url)?.map(
    (e) => e?.toLowerCase() ?? ""
  ) ?? ["", "", "", "", "", ""]
  if (matched !== url.toLowerCase()) {
    console.log(`${url} does not look like a URL`)
    return null
  }
  if (host !== "github.com") {
    console.log(`${url} does not look like a GitHub URL`)
    return null
  }
  if (owner === "" || repo === "") {
    console.log(`${url} does not look like a valid GitHub URL`)
    return null
  }

  // If we have valid cache data, use it
  const cacheKey = `github/${owner}/${repo}`
  const cached = cache.get<CacheEntry<ReposGetResponseData>>(cacheKey)
  if (cached && Date.now() < cached.timestamp + 1 * DAYS) {
    console.log("Returning cached data")
    return extractRepoData(cached.data, node)
  }

  // TODO: handle lookup failures
  const { data } = await octokit.repos.get({
    owner,
    repo,
  })

  // Cache the response
  const toCache: NonNullable<typeof cached> = {
    timestamp: Date.now(),
    data,
  }
  cache.update(cacheKey, toCache)

  return extractRepoData(data, node)
}

// extract `RepoData` from `ReposGetResponseData`
function extractRepoData(data: ReposGetResponseData, node: Node): RepoData {
  return {
    url: data.clone_url,
    owner: data.owner.login,
    repo: data.name,
    forks: data.forks_count,
    stars: data.stargazers_count,
    version: node.package?.version ?? "0.0.0",
    dependencies: node.edgesOut.size,
  }
}
