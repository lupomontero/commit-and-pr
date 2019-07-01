#! /usr/bin/env node


const commitAndPullRequest = require('./');


if (require.main === module) {
  const {
    cwd,
    env,
    stdout,
    stderr,
  } = process;

  if (process.argv.length < 3) {
    console.error('Error: Commit message is required');
    process.exit(1);
  }

  commitAndPullRequest(process.argv[2], {
    env,
    cwd: cwd(),
    stdio: ['ignore', stdout, stderr],
  })
    .then(() => process.exit(0))
    .catch(err => console.error(err) || process.exit(1));
}
