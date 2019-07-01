# commit-and-pr

## Installation

```sh
npm i --save-dev commit-and-pr
```

## Usage

### CLI

```sh
npx commit-and-pr
```

### npm-scripts

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

#### Environment variables

* `GH_TOKEN`: A GitHub Personal access token with write access to the repo.
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

### API

```js
const { update } = require('commit-and-pr');
const { cwd, env, stdout, stderr } = process;

update({ cwd: cwd(), env, stdio: ['ignore', stdout, stderr] })
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
