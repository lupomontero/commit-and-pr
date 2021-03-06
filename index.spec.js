const { Writable } = require('stream');
const childProcessMock = require('child_process');
const httpsMock = require('https');
const commitAndPullRequest = require('./');


jest.mock('child_process');
jest.mock('https');


class OutStream extends Writable {
  constructor(opts) {
    super(opts);
    this.chunks = [];
  }

  write(chunk) {
    this.chunks.push(chunk);
  }

  toJSON() {
    const { chunks, writable } = this;
    return { chunks, writable };
  }
}


describe('commitAndPullRequest', () => {
  beforeEach(() => {
    childProcessMock.spawn.mockClear();
    httpsMock.request.mockClear();
  });

  it('should be a function', () => {
    expect(typeof commitAndPullRequest).toBe('function');
  });

  it('should not create PR when no changes', () => {
    const stdout = new OutStream();
    childProcessMock.__addMockEvents([
      [['close', [0], 0]],
    ]);
    return commitAndPullRequest('', { stdio: ['ignore', stdout] })
      .then((result) => {
        expect(result).toBe(undefined);
        expect(stdout.chunks).toEqual(['Already up to date\n']);
      });
  });

  it('should fail to create PR request error', () => {
    const stdout = new OutStream();
    childProcessMock.__addMockEvents([
      [['close', [1], 0]], // git diff-index
      [['close', [0], 0]], // git checkout
      [['close', [0], 0]], // git add
      [['close', [0], 0]], // git commit
      [['close', [0], 0]], // git remote add
      [['close', [0], 0]], // git push
    ]);
    httpsMock.__addMockResponses([
      new Error('Bad request'),
    ]);
    return commitAndPullRequest('Blah blah', {
      env: { GH_TOKEN: 'xxx', TRAVIS_REPO_SLUG: 'some/repo' },
      stdio: ['ignore', stdout],
    })
      .catch((err) => {
        expect(err.message).toBe('Bad request');
        expect(childProcessMock.spawn.mock.calls.length).toBe(6);
        expect(childProcessMock.spawn.mock.calls[0]).toMatchSnapshot();

        const gitCheckoutCall = childProcessMock.spawn.mock.calls[1];
        expect(gitCheckoutCall[0]).toBe('git');
        expect(gitCheckoutCall[1][0]).toBe('checkout');
        expect(gitCheckoutCall[1][1]).toBe('-b');

        const branch = gitCheckoutCall[1][2];
        expect(/^update-date-\d+/.test(branch)).toBe(true);

        expect(childProcessMock.spawn.mock.calls[2]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[3]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[4]).toMatchSnapshot();

        const gitPushCall = childProcessMock.spawn.mock.calls[5];
        expect(gitPushCall[0]).toBe('git');
        expect(gitPushCall[1][0]).toBe('push');
        expect(gitPushCall[1][1]).toBe('--quiet');
        expect(gitPushCall[1][2]).toBe('--set-upstream');
        expect(gitPushCall[1][3]).toBe('origin-with-token');
        expect(gitPushCall[1][4]).toBe(branch);

        expect(httpsMock.request.mock.calls.length).toBe(1);
        expect(httpsMock.request.mock.calls[0].length).toBe(1);
        expect(httpsMock.request.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('should reject when PR request statusCode > 201', () => {
    const stdout = new OutStream();
    childProcessMock.__addMockEvents([
      [['close', [1], 0]], // git diff-index
      [['close', [0], 0]], // git checkout
      [['close', [0], 0]], // git add
      [['close', [0], 0]], // git commit
      [['close', [0], 0]], // git remote add
      [['close', [0], 0]], // git push
    ]);
    httpsMock.__addMockResponses([
      { statusCode: 403 },
    ]);
    return commitAndPullRequest('Blah blah', {
      env: { GH_TOKEN: 'xxx', TRAVIS_REPO_SLUG: 'some/repo' },
      stdio: ['ignore', stdout],
    })
      .catch((err) => {
        expect(err.message).toBe('Failed to create pull request (403)');
        expect(childProcessMock.spawn.mock.calls.length).toBe(6);
        expect(childProcessMock.spawn.mock.calls[0]).toMatchSnapshot();

        const gitCheckoutCall = childProcessMock.spawn.mock.calls[1];
        expect(gitCheckoutCall[0]).toBe('git');
        expect(gitCheckoutCall[1][0]).toBe('checkout');
        expect(gitCheckoutCall[1][1]).toBe('-b');

        const branch = gitCheckoutCall[1][2];
        expect(/^update-date-\d+/.test(branch)).toBe(true);

        expect(childProcessMock.spawn.mock.calls[2]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[3]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[4]).toMatchSnapshot();

        const gitPushCall = childProcessMock.spawn.mock.calls[5];
        expect(gitPushCall[0]).toBe('git');
        expect(gitPushCall[1][0]).toBe('push');
        expect(gitPushCall[1][1]).toBe('--quiet');
        expect(gitPushCall[1][2]).toBe('--set-upstream');
        expect(gitPushCall[1][3]).toBe('origin-with-token');
        expect(gitPushCall[1][4]).toBe(branch);

        expect(httpsMock.request.mock.calls.length).toBe(1);
        expect(httpsMock.request.mock.calls[0].length).toBe(1);
        expect(httpsMock.request.mock.calls[0][0]).toMatchSnapshot();
      });
  });

  it('should succeed when all good ;-)', () => {
    const stdout = new OutStream();
    childProcessMock.__addMockEvents([
      [['close', [1], 0]], // git diff-index
      [['close', [0], 0]], // git checkout
      [['close', [0], 0]], // git add
      [['close', [0], 0]], // git commit
      [['close', [0], 0]], // git remote add
      [['close', [0], 0]], // git push
    ]);
    httpsMock.__addMockResponses([
      { statusCode: 201, body: { html_url: 'https://foo.bar/baz' } },
    ]);
    return commitAndPullRequest('Blah blah', {
      env: { GH_TOKEN: 'xxx', TRAVIS_REPO_SLUG: 'some/repo' },
      stdio: ['ignore', stdout],
    })
      .then((result) => {
        expect(result).toBe(undefined);
        expect(childProcessMock.spawn.mock.calls.length).toBe(6);
        expect(childProcessMock.spawn.mock.calls[0]).toMatchSnapshot();

        const gitCheckoutCall = childProcessMock.spawn.mock.calls[1];
        expect(gitCheckoutCall[0]).toBe('git');
        expect(gitCheckoutCall[1][0]).toBe('checkout');
        expect(gitCheckoutCall[1][1]).toBe('-b');

        const branch = gitCheckoutCall[1][2];
        expect(/^update-date-\d+/.test(branch)).toBe(true);

        expect(childProcessMock.spawn.mock.calls[2]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[3]).toMatchSnapshot();
        expect(childProcessMock.spawn.mock.calls[4]).toMatchSnapshot();

        const gitPushCall = childProcessMock.spawn.mock.calls[5];
        expect(gitPushCall[0]).toBe('git');
        expect(gitPushCall[1][0]).toBe('push');
        expect(gitPushCall[1][1]).toBe('--quiet');
        expect(gitPushCall[1][2]).toBe('--set-upstream');
        expect(gitPushCall[1][3]).toBe('origin-with-token');
        expect(gitPushCall[1][4]).toBe(branch);

        expect(httpsMock.request.mock.calls.length).toBe(1);
        expect(httpsMock.request.mock.calls[0].length).toBe(1);
        expect(httpsMock.request.mock.calls[0][0]).toMatchSnapshot();
      });
  });
});
