# commit-and-pr

This is **experimental** and is meant to be used as part of an automated build
process to be run on Travis CI.

## Use case

Our repo has some script that regularly updates something that should be updated
on the repo (in the `psl` module we want to automate updating the Public Suffix
List, as it changes regularly).

A Travis CI cron job will trigger a build, which will detect that it has been
triggered by a cron job and instead of simply running the tests, it will first
run our update script, and if it produced unstaged changes, it will
automatically send a pull request with the changes.

## Installation

```sh
npm i --save-dev commit-and-pr
```

## Usage

### CLI

```sh
npx commit-and-pr
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
* `GIT_COMMITTER_NAME`: ??
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
npm run update && npm run commit-and-pr
```

### Travis CI

Continuing with the `npm-scripts` example...

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
  npm run update && npm run commit-and-pr
fi
```

### API

`Promise commitAndPullRequest(opts)`

#### Options

* `cwd`
* `env`
* `stdout`
* `stderr`

#### Example

```js
const commitAndPullRequest = require('commit-and-pr');
const { cwd, env, stdout, stderr } = process;

commitAndPullRequest({ cwd: cwd(), env, stdio: ['ignore', stdout, stderr] })
  .then(console.log)
  .catch(console.error);
```

***

## What does it do?

1. Checks if there are unstaged changes in local copy (`git diff-index ...`)
  * if no unstaged changes there's nothing to do.
  * else move to step 2
2. Creates a new branch (`git checkout -b ...`)
3. Sets up git user.name and user.email (`git config ...`)
4. adds changes (`git add .`)
5. commits them (`git commit ...`)
6. add remote (`git remote add origin-with-token ...`)
7. pushes to GitHub (`git push origin-with-token ...`)
8. creates PR (using GitHub REST API)
