import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from './client';

function makeFetchResponse(opts: {
  ok: boolean;
  status: number;
  statusText?: string;
  body?: unknown;
  contentType?: string;
}): Response {
  const { ok, status, statusText = '', body, contentType } = opts;
  const headers = new Headers();
  if (contentType) headers.set('content-type', contentType);

  return {
    ok,
    status,
    statusText,
    headers,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe('api()', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0';
  });

  it('GET success parses JSON and returns the body', async () => {
    const payload = { hello: 'world' };
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeFetchResponse({
        ok: true,
        status: 200,
        body: payload,
        contentType: 'application/json',
      }),
    );

    const result = await api<typeof payload>('/api/test');

    expect(result).toEqual(payload);
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/test');
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('non-GET request with a body sets Content-Type: application/json', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, status: 200, body: {}, contentType: 'application/json' }),
      );

    await api('/api/test', { method: 'POST', body: JSON.stringify({ x: 1 }) });

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit & { headers: Headers }).headers.get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('POST sends X-XSRF-TOKEN header when cookie is present', async () => {
    document.cookie = 'XSRF-TOKEN=secret-token';
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, status: 200, body: {}, contentType: 'application/json' }),
      );

    await api('/api/test', { method: 'POST', body: JSON.stringify({}) });

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit & { headers: Headers }).headers.get('X-XSRF-TOKEN')).toBe(
      'secret-token',
    );
  });

  it('GET does NOT send X-XSRF-TOKEN header even when cookie is present', async () => {
    document.cookie = 'XSRF-TOKEN=secret-token';
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, status: 200, body: {}, contentType: 'application/json' }),
      );

    await api('/api/test');

    const [, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((init as RequestInit & { headers: Headers }).headers.get('X-XSRF-TOKEN')).toBeNull();
  });

  it('non-ok response throws ApiError with status and body.message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeFetchResponse({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        body: { message: 'Validation failed' },
        contentType: 'application/json',
      }),
    );

    await expect(api('/api/test', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      status: 422,
      message: 'Validation failed',
    });
  });

  it('non-ok response falls back to statusText when body has no message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      makeFetchResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        body: {},
        contentType: 'application/json',
      }),
    );

    const err = await api('/api/test').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Internal Server Error');
    expect((err as ApiError).status).toBe(500);
  });

  it('non-ok response falls back to statusText when body is not JSON', async () => {
    const res = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers(),
      json: vi.fn().mockRejectedValue(new SyntaxError('not JSON')),
      text: vi.fn().mockResolvedValue(''),
    } as unknown as Response;
    globalThis.fetch = vi.fn().mockResolvedValue(res);

    const err = await api('/api/test').catch((e: unknown) => e);
    expect((err as ApiError).message).toBe('Service Unavailable');
  });

  it('204 response returns undefined', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeFetchResponse({ ok: true, status: 204, statusText: 'No Content' }));

    const result = await api('/api/test', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('text/plain ok response returns the raw text', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, status: 200, body: 'plain text', contentType: 'text/plain' }),
      );

    const result = await api<string>('/api/test');
    expect(result).toBe('plain text');
  });
});
