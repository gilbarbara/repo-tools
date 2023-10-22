# repo-tools

[![npm version](https://badge.fury.io/js/repo-tools.svg)](https://www.npmjs.com/package/repo-tools) [![Build Status](https://travis-ci.org/gilbarbara/repo-tools.svg?branch=master)](https://travis-ci.org/gilbarbara/repo-tools) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_repo-tools&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gilbarbara_repo-tools) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara_repo-tools&metric=coverage)](https://sonarcloud.io/summary/new_code?id=gilbarbara_repo-tools)

Useful CLI commands for working with remote repositories.

## Setup

```bash
$ npm install --save-dev repo-tools
```

## Usage

```bash
# with an up-to-date repo
$ ./node_modules/.bin/repo-tools check-remote	
✔ Repo is up-to-date! # exit code 0

# with an outdated repo
$ ./node_modules/.bin/repo-tools check-remote	
⊘ You need to pull, there are new commits. #exit code 1
```

## Commands

**check-remote**  
Compare the local tree with the remote and determine if it needs update.

**install-packages**  
Check if the most recent commit have a modified `package.json` and run `npm/yarn/pnpm/bun install`

## Integration

These commands work perfectly with [husky](https://github.com/typicode/husky) hooks (git hooks)

#### pre-commit

```shell
./node_modules/.bin/repo-tools check-remote
```

#### post-merge

```shell
./node_modules/.bin/repo-tools install-packages
```

## License

MIT
