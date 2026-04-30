import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { app } from './app.js';

describe('app healthcheck', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('returns a standardized health response and request id', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { 'X-Request-Id': 'test-request-id' },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-request-id'), 'test-request-id');
    assert.equal(body.success, true);
    assert.equal(body.requestId, 'test-request-id');
    assert.equal(body.data.ok, true);
  });
});
