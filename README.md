# commit-and-pr

[![Build Status](https://travis-ci.org/lupomontero/commit-and-pr.svg?branch=master)](https://travis-ci.org/lupomontero/commit-and-pr)
[![Coverage Status](https://coveralls.io/repos/github/lupomontero/commit-and-pr/badge.svg?branch=master)](https://coveralls.io/github/lupomontero/commit-and-pr?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/lupomontero/commit-and-pr.svg)](https://greenkeeper.io/)

This is **experimental** and is meant to be used as part of an automated build
process to be run on Travis CI.

## Use case

A GitHub repo has some script that updates files that should then be commited
and merged back on the repo. The initial use case is the [`psl`](https://github.com/wrangr/psl)
repo, where we want to automate updating the _Public Suffix List_, as it changes
 regularly. See [this issue](https://github.com/wrangr/psl/issues/5).

The idea is that a [Travis CI cron job](https://docs.travis-ci.com/user/cron-jobs/)
will trigger a build script, which will detect that it has been triggered by a
cron job and instead of running the tests, it will run our update script, and if
it resulted in unstaged changes, it will automatically send a pull request with
the changes.

## Installation

```sh
npm i --save-dev commit-and-pr
```

## Usage

### CLI

```sh
GH_TOKEN=XXX TRAVIS_REPO_SLUG=github-user/repo-name npx commit-and-pr "Some commit message"
```

#### Environment variables

* `GH_TOKEN`: A GitHub Personal access token with write access to the repo. This
  is needed in order to push changes back to GitHub and send a Pull Request.
* `TRAVIS_REPO_SLUG`: The repo slug (ie: `github-user/repo-name`). If your build
  id running on Travis CI this is already set in the environment.

Optional `git` related env vars:

* `EMAIL`: Fallback for `GIT_AUTHOR_EMAIL` and `GIT_COMMITTER_EMAIL`.
* `GIT_AUTHOR_NAME`: The human readable author name.
* `GIT_AUTHOR_EMAIL`: (optional). If not present will default to `EMAIL`.
* `GIT_COMMITTER_NAME`: The human readable committer name.
* `GIT_COMMITTER_EMAIL`: (optional). If not present will default to `EMAIL`.

> In case (some of) these environment variables are not set, the information is
> taken from the configuration items user.name and user.email, or, if not
> present, the environment variable EMAIL, or, if that is not set, system user
> name and the hostname used for outgoing mail [...]
>
> See: https://git-scm.com/docs/git-commit-tree#_commit_information

### npm-scripts

Let's pretend that our update script can be run as `npm run update`.

`package.json`:

```json
{
  ...
  "scripts": {
    "update": "date > date.out",
    "commit-and-pr": "commit-and-pr"
  },
  ...
}
```

```sh
npm run update && npm run commit-and-pr "Some commit message"
```

### Travis CI

Continuing with the `npm-scripts` example...

```sh
travis encrypt GH_TOKEN=<YOUR-GITHUB-PERSONAL-ACCESS-TOKEN>
```

`.travis.yml`:

```yml
language: node_js
node_js:
  - 10
  - 12
script: ./scripts/build.sh
env:
  - secure: "XXXX="
```

`./scripts/build.sh`:

```sh
#! /usr/bin/env bash


if [[ "$TRAVIS_EVENT_TYPE" != "cron" ]]; then
  echo "Not triggered by cron. Running tests..."
  npm test
else
  echo "Triggered by cron. Running update script..."
  npm run update && npm run commit-and-pr "Some commit message"
fi
```

### API

`Promise commitAndPullRequest(msg, opts)`

#### Options

* `cwd`
* `env`
* `stdout`
* `stderr`

#### Example

```js
const commitAndPullRequest = require('commit-and-pr');
const { cwd, env, stdout, stderr } = process;

commitAndPullRequest('commit message', {
  cwd: cwd(),
  env,
  stdio: ['ignore', stdout, stderr],
})
  .then(console.log)
  .catch(console.error);
```

***

## What does it do?

1. Checks if there are unstaged changes in local copy (`git diff-index ...`)
  * if no unstaged changes there's nothing to do.
  * else move to step 2
2. Creates a new branch (`git checkout -b ...`)
3. adds changes (`git add .`)
4. commits them (`git commit ...`)
5. add remote (`git remote add origin-with-token ...`)
6. pushes to GitHub (`git push origin-with-token ...`)
7. creates PR (using GitHub REST API)
