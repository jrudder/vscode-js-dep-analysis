import { Octokit } from "@octokit/rest"
import { ReposGetResponseData } from "@octokit/types"

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
  forks: number
  stars: number
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

const octokit = new Octokit()

// Analyze the given repository URL to determine trust level
export async function Analyze(url: string | undefined, cache: Cache): Promise<Trust> {
  if (!url) {
    return "indeterminate"
  }

  const data = await getRepoData(url, cache)
  if (!data) {
    return "indeterminate"
  }

  if (data.forks >= 500) {
    return "high"
  }

  return "indeterminate"
}

// getRepoData extracts information about the given repository URL
// TODO: handle additional sources and make this more robust to malformed input
async function getRepoData(url: string, cache: Cache): Promise<RepoData | null> {
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

  if (!(owner === "kelektiv" && repo === "node-uuid")) {
    console.log(`Skipping ${owner}/${repo} for now`)
    return null
  }

  // If we have valid cache data, use it
  const cacheKey = `github/${owner}/${repo}`
  const cached = cache.get<CacheEntry<ReposGetResponseData>>(cacheKey)
  if (cached && Date.now() < cached.timestamp + 1 * DAYS) {
    return extractRepoData(cached.data)
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

  return extractRepoData(data)
}

// extract `RepoData` from `ReposGetResponseData`
function extractRepoData(data: ReposGetResponseData): RepoData {
  return {
    forks: data.forks_count,
    stars: data.stargazers_count,
  }
}
