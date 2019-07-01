#! /usr/bin/env node


if (require.main === module) {
  const { cwd, env, stdout, stderr } = process;
  const opts = { env, cwd: cwd(), stdio: ['ignore', stdout, stderr] };

  (
    (env.TRAVIS_EVENT_TYPE !== 'cron'
      || env.TRAVIS_NODE_VERSION !== '12'
      || env.TRAVIS_BRANCH !== 'master')
      ? console.log('Running normal build (tests)...') || exports.test(opts)
      : console.log('Build triggered by Travis Cron') || exports.update(opts)
  )
    .then(data => console.log(data) || process.exit(0))
    .catch(err => console.error(err) || process.exit(1));
}
