# repo-tools

[![npm version](https://badge.fury.io/js/repo-tools.svg)](https://www.npmjs.com/package/repo-tools) [![Build Status](https://travis-ci.org/gilbarbara/repo-tools.svg?branch=master)](https://travis-ci.org/gilbarbara/repo-tools) [![Maintainability](https://api.codeclimate.com/v1/badges/73f73d8c882f4318ec9a/maintainability)](https://codeclimate.com/github/gilbarbara/repo-tools/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/73f73d8c882f4318ec9a/test_coverage)](https://codeclimate.com/github/gilbarbara/repo-tools/test_coverage)

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
Check if the most recent commit have a modified `package.json` and run `npm install`

## Integration

These commands work perfectly with [husky](https://github.com/typicode/husky) hooks (git hooks)

```
{
...
  "husky": {
    "hooks": {
      "pre-commit": "repo-tools check-remote"
      "post-merge": "repo-tools install-packages"
    }
  }
}
```

## License

MIT