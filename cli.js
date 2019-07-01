#! /usr/bin/env node


const commitAndPullRequest = require('./');


if (require.main === module) {
  const {
    cwd,
    env,
    stdout,
    stderr,
  } = process;

  commitAndPullRequest({ env, cwd: cwd(), stdio: ['ignore', stdout, stderr] })
    .then(data => console.log(data) || process.exit(0))
    .catch(err => console.error(err) || process.exit(1));
}
