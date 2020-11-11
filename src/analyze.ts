import { Octokit } from "@octokit/rest"

export type Trust = "low" | "high" | "indeterminate"

interface RepoData {
  forks: number
  stars: number
}

const octokit = new Octokit()

// Analyze the given repository URL to determine trust level
export async function Analyze(url?: string): Promise<Trust> {
  if (!url) {
    return "indeterminate"
  }

  const data = await getRepoData(url)
  if (!data) {
    console.log(`repository data not extracted from ${url}`)
    return "indeterminate"
  }

  if (data.forks >= 500) {
    return "high"
  }

  return "indeterminate"
}

// getRepoData extracts information about the given repository URL
// TODO: handle additional sources and make this more robust to malformed input
async function getRepoData(url: string): Promise<RepoData | null> {
  const pos = url.indexOf("://github.com/")
  if (pos === -1) {
    console.log(`${url} does not look like a GitHub URL`)
    return null
  }

  const split = url.split("/")
  if (split.length < 4) {
    console.log(`${url} does not look like a valid GitHub URL`)
    return null
  }

  const ownerName = split[split.length - 2]
  const repoName = split[split.length - 1].replace(".git", "")

  if (!(ownerName === "kelektiv" && repoName === "node-uuid")) {
    console.log(`Skipping ${ownerName}/${repoName} for now`)
    return null
  }

  const repo = await octokit.repos.get({
    owner: ownerName,
    repo: repoName,
  })

  const result: RepoData = {
    forks: repo.data.forks_count,
    stars: repo.data.stargazers_count,
  }

  return result
}
