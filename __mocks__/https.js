const { Readable, Writable } = require('stream');

class Request extends Writable {
  constructor(opts) {
    super(opts);
    this.chunks = [];
  }

  write(chunk) {
    this.chunks.push(chunk);
  }
}

class Response extends Readable {
  constructor({ statusCode, body, ...opts }) {
    super(opts);
    this.statusCode = statusCode;
    this.body = statusCode > 201 ? body : JSON.stringify(body);
  }

  _read() {
    this.push(this.body, 'utf8');
    this.push(null);
  }
}

const mockResponses = [];

exports.request = jest.fn().mockImplementation(() => {
  const req = new Request();
  const result = mockResponses.shift();

  setTimeout(() => (
    (result instanceof Error)
      ? req.emit('error', result)
      : req.emit('response', new Response(result))
  ), 0);

  return req;
});


exports.__addMockResponses = (responses) => {
  responses.forEach(response => mockResponses.push(response));
};
