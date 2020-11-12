# Heuristic Trust Analysis of JavaScript Dependencies

## 🔧 Work-in-progress

This is a work-in-progress. If it indicates that a particular package has low trust, don't take it personally. Instead, consider how the analysis could be optimized to produce a more accurate result, and open a pull request or issue.

## Overview

This [Visual Studio Code](https://code.visualstudio.com/) extension performs heuristic trust analysis of JavaScript depdendencies by examining various
properties of each dependency.

At a high level, the extension uses [Arborist](https://github.com/npm/arborist), which powers `npm ls`, to gather dependency information. Additional information is gathered for each dependency (see [Data](#data)), and a trust score is determined: low, indeterminate, or high.

![Screenshot](.github/screenshot.png?raw=true "Extension Screenshot")

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