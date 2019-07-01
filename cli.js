#! /usr/bin/env node


const { update } = require('./');


if (require.main === module) {
  const { cwd, env, stdout, stderr } = process;

  update({ env, cwd: cwd(), stdio: ['ignore', stdout, stderr] })
    .then(data => console.log(data) || process.exit(0))
    .catch(err => console.error(err) || process.exit(1));
}
