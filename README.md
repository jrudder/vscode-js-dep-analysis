# Heuristic Security Analysis of JavaScript Dependencies

## 🔧 Work-in-progress

This is a work-in-progress. If it indicates that a particular package has low trust, don't take it personally. Instead, consider how the analysis could be optimized to produce a more accurate result, and open a pull request or issue.

## Overview

This [Visual Studio Code](https://code.visualstudio.com/) extension performs heuristic security analysis of JavaScript depdendencies by examining various
properties of each dependency.

At a high level, the extension:

- activates when the workspace root contains `package-lock.json`
- gathers information about each dependency (see [Data](#data))
- analyzes the data (see [Analysis](#analysis) and [Rules](#rules))
- adds an explorer view that:
  - shows the dependency tree
  - supports filtering the tree:
    - Type: All / Direct / Indirect
    - Trust: Low / Indeterminate / High
- adds gutter info in `package.json` for each dependency

## Results

There are three possible results:

- 🔒 — analysis produced one or more positive results and no negatives
- ❓ — analysis was indeterminate; no positive or negative results
- 🚫 — analysis produced one or more negative results

## Data

The data used for analysis is gathered from:

- GitHub
  - owner
  - stars
  - forks
  - issues
  - pull requests
  - commits
- NPM Audit
  - status

## Analysis

Analysis of a given dependency is done by using one or more analyzers, each of which can be configured by specifying the rules (see [Rules](#rules)). Each analyzer returns a score of `high`, `low`, or `indeterminate`.

The results from each analyzer are gathered and combined to return an overall result as follows:

- if any analzer returns `low` → `low`
- if no analyzer returns `low` and any returns `high` → `high`
- if all return `indeterminate` → `indeterminate`

## Rules

```
{
  "collectors": {
    "npm-audit": {
      "low-watermark": [1.0, "ever"],
      "high-watermark": [1.0, "per-major"]
    },
    "repo-activity": {
      "contributors": {
        "good-better-best": [2, 5, 10],
        "timeframe": [1.0, "year"]
      },
      "issues": {
        "open-to-close-ratio": [1.0]
      }
    }
  }
}
```


## TODO

- [X] Draft the README
- [ ] Create `package.json`
- [ ] Activate when workspace contains `package-lock.json`
- [ ] Icon in sidebar to go to view
- [ ] Show dependency tree in explorer view
- [ ] Show webview when selecting a dependency in the tree view
- [ ] Simulate data gathering for each node
- [ ] Cache data (simple as via URL and wrap fetch?)
- [ ] Show result in dependency tree
- [ ] Show analysis (in webview? editor-style?)
- [ ] Show analysis when viewing a `package.json`
- [ ] For this project's `package.json`, set the value of `engines.vscode` value appropriately based on the APIs we're using