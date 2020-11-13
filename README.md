# Heuristic Trust Analysis of JavaScript Dependencies

## 🔧 Work-in-progress

This is a work-in-progress. If it indicates that a particular package has low trust, don't take it personally. Instead, consider how the analysis could be optimized to produce a more accurate result, and open a pull request or issue.

## Overview

This [Visual Studio Code](https://code.visualstudio.com/) extension performs heuristic trust analysis of JavaScript depdendencies by examining various
properties of each dependency.

At a high level, the extension uses [Arborist](https://github.com/npm/arborist), which powers `npm ls`, to gather dependency information. Additional information is gathered for each dependency (see [Data](#data)), and a trust score is determined: low, indeterminate, or high. In the tree view, an indicator next to the package name shows the trust score:

- high: ▲
- indeterminate: -
- low: ▼
- pending: .

![Screenshot](.github/screenshot.png?raw=true "Extension Screenshot")

## Running

- clone and open the project in VS Code
- set the `dependencyTrustAnalysis.gitHubToken` setting to a GitHub personal access token (no explicit permissions needed)
- launch the extension
- open a JavaScript project (e.g. with a `package.json` and populated `node_modules` directory)
- click the extension's icon in the activity bar to see the dependency tree
- click the pencil icon for a dependency to view its details
- note that a dependency with `.` at the beginning has not yet loaded its data

## Data

The data used for analysis is gathered from:

- GitHub
  - [x] owner
  - [x] stars
  - [x] forks
  - [ ] issues
  - [ ] pull requests
  - [ ] commits
  - [ ] contributors
- NPM Audit
  - [ ] rate of issues identified

## Analysis

Analysis is currently both rudimentary and hard-coded. See `./src/analyze.ts` for details.

## VS Code APIs & Implementation Details

- `createTreeView` — shows the dependency tree
- `createStatusBarItem` — shows the status of package analysis
- `createWebviewPanel` — shows details about the package
- `getConfiguration` — retrieve a GitHub personal access token to use for data fetching
- asynchronous data fetching with [Octokit](https://github.com/octokit/rest.js)
- refreshing tree nodes when analysis completes

## TODO

- [ ] Figure out the right way to store GitHub personal access token
- [ ] Make it pretty
- [ ] Highlight reasons why low or high
- [ ] Update Octokit when the configuration value changes
- [ ] Allow scanning the entire tree
- [ ] Roll-up to higher-level dependencies
- [ ] Include additional data sources (e.g. npm audit)
- [ ] Improve the analysis
- [ ] Support configurable rules to tweak the analysis
