const https = require('https');
const childProcess = require('child_process');


const spawn = (cmd, args, opts) => new Promise(
  (resolve, reject) => childProcess.spawn(cmd, args, opts)
    .on('close', code => (
      (code > 0)
        ? reject(new Error(`Command ${cmd} ${args.join(' ')} exited with code ${code}`))
        : resolve()
    )),
);


const hasUnstagedChanges = opts => spawn(
  'git',
  ['diff-index', '--quiet', 'HEAD', '--'],
  opts,
)
  .then(() => false)
  .catch(() => true);


const createPullRequest = (head, title, opts) => new Promise((resolve, reject) => {
  const payload = JSON.stringify({ title, head, base: 'master' });
  const req = https.request({
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${opts.env.TRAVIS_REPO_SLUG}/pulls`,
    method: 'POST',
    headers: {
      'User-Agent': 'Node.js https.request',
      Authorization: `token ${opts.env.GH_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  });

  req.on('error', reject);

  req.on('response', (resp) => {
    const chunks = [];
    resp.setEncoding('utf8');
    resp.on('data', chunk => chunks.push(chunk));
    resp.on('end', () => {
      if (resp.statusCode > 201) {
        return reject(new Error(`Failed to create pull request (${resp.statusCode})`));
      }
      const responseJson = JSON.parse(chunks.join(''));
      opts.stdio[1].write(`Pull request created. See ${responseJson.html_url}\n`);
      return resolve();
    });
  });

  req.write(payload);
  req.end();
});


const commitAndPushChanges = (msg, opts) => {
  const branch = `update-date-${Date.now()}`;
  return spawn('git', ['checkout', '-b', branch], opts)
    .then(() => spawn('git', ['add', '.'], opts))
    .then(() => spawn('git', ['commit', '-m', msg], opts))
    .then(() => spawn('git', ['remote', 'add', 'origin-with-token', `https://${opts.env.GH_TOKEN}@github.com/${opts.env.TRAVIS_REPO_SLUG}.git`], opts))
    .then(() => spawn('git', ['push', '--quiet', '--set-upstream', 'origin-with-token', branch], opts))
    .then(() => createPullRequest(branch, msg, opts));
};


module.exports = (msg, opts) => hasUnstagedChanges(opts)
  .then(shouldCommit => (
    (shouldCommit)
      ? commitAndPushChanges(msg, opts)
      : opts.stdio[1].write('Already up to date\n')
  ));
