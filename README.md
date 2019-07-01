# travis-cron-update

```sh
npm i --save-dev travis-cron-update
```

`package.json`:

```json
{
  ...
  "scripts": {
    "update": "./some-script.js"
  },
  ...
}
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
if [[ "$TRAVIS_EVENT_TYPE" != "cron" || "$TRAVIS_NODE_VERSION" != "12" || "$TRAVIS_BRANCH" != "master" ]]; then
  echo "Not triggered by cron. Running tests..."
  npm test
else
  npx travis-cron-update
fi
```

## Environment variables

* `TRAVIS_EVENT_TYPE`
* `TRAVIS_NODE_VERSION`
* `TRAVIS_BRANCH`
* `TRAVIS_REPO_SLUG`
* `GH_TOKEN`

## What does it do?

1. Runs `npm run update`
  * if it does not produce changes (from git's point of view) END
  * else move to step 2
2. Creates a new branch, adds changes, commits them, pushes to GitHub and creates PR
