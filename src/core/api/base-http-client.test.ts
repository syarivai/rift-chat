import { assertEnvelope } from './base-http-client';

describe('assertEnvelope', () => {
  const valid = { total: 60, limit: 20, offset: 0, results: [{ id: 1 }] };

  it('accepts the shape the API actually returns', () => {
    expect(() => assertEnvelope(valid, '/api/users')).not.toThrow();
  });

  it.each([
    ['null', null],
    ['a bare array', []],
    ['missing total', { limit: 20, offset: 0, results: [] }],
    ['total as a string', { total: '60', limit: 20, offset: 0, results: [] }],
    ['results not an array', { total: 1, limit: 20, offset: 0, results: {} }],
  ])('throws at the boundary on %s', (_label, value) => {
    expect(() => assertEnvelope(value, '/api/users')).toThrow(/Malformed envelope/);
  });

  it('names the endpoint so the failure is traceable', () => {
    expect(() => assertEnvelope(null, '/api/posts')).toThrow('/api/posts');
  });
});
