import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContributionsService, normalizeUsername } from './contributions';

const payload = { schema: 'v2', total_contributions: 12, weeks: [], extra: { preserved: true } };
const success = () => Response.json(payload);

describe('contributions service', () => {
	let service: ContributionsService;
	const fetchMock = vi.fn<typeof fetch>();

	beforeEach(() => {
		service = new ContributionsService();
		vi.useFakeTimers();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock.mockReset().mockImplementation(async () => success());
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('normalizes valid usernames and rejects invalid names before fetching', async () => {
		expect(normalizeUsername('Octo-Cat')).toBe('octo-cat');
		expect(normalizeUsername('a'.repeat(39))).toHaveLength(39);
		for (const name of ['', 'a'.repeat(40), '-a', 'a-', 'a--b', 'a_b', '../x', 'https://x', ' a ', '한글']) {
			expect(normalizeUsername(name)).toBeNull();
			await expect(service.get(name)).rejects.toMatchObject({ status: 400, code: 'INVALID_USERNAME' });
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('preserves JSON and fixes the host, Accept header and redirect policy', async () => {
		expect(JSON.parse(await service.get('Octocat'))).toEqual(payload);
		expect(fetchMock).toHaveBeenCalledWith('https://github.com/octocat.contribs', {
			headers: { Accept: 'application/json' }, redirect: 'manual', signal: expect.any(AbortSignal),
		});
		expect(vi.getTimerCount()).toBe(0);
	});

	it.each([
		[404, 404, 'USER_NOT_FOUND'],
		[403, 503, 'UPSTREAM_FORBIDDEN'],
		[429, 429, 'UPSTREAM_RATE_LIMITED'],
		[500, 502, 'UPSTREAM_ERROR'],
		[302, 502, 'UPSTREAM_ERROR'],
		[401, 502, 'UPSTREAM_ERROR'],
	])('maps upstream HTTP %s to %s', async (upstream, status, code) => {
		fetchMock.mockResolvedValueOnce(new Response('', { status: upstream }));
		await expect(service.get('octocat')).rejects.toMatchObject({ status, code });
		expect(vi.getTimerCount()).toBe(0);
	});

	it.each(['120', 'Wed, 21 Oct 2026 07:28:00 GMT', 'invalid'])('validates Retry-After %s', async (value) => {
		fetchMock.mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': value } }));
		await expect(service.get('octocat')).rejects.toMatchObject({
			retryAfter: value === 'invalid' ? undefined : value,
		});
	});

	it('rejects network and body read failures explicitly', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('offline'));
		await expect(service.get('octocat')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
		const response = success();
		vi.spyOn(response, 'text').mockRejectedValueOnce(new TypeError('body interrupted'));
		fetchMock.mockResolvedValueOnce(response);
		await expect(service.get('octocat')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
	});

	it('rejects HTML and malformed JSON', async () => {
		fetchMock.mockResolvedValueOnce(new Response('<html>'));
		await expect(service.get('octocat')).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' });
		fetchMock.mockResolvedValueOnce(new Response('{', { headers: { 'Content-Type': 'application/json' } }));
		await expect(service.get('octocat')).rejects.toMatchObject({ code: 'INVALID_UPSTREAM_RESPONSE' });
	});

	it.each(['fetch', 'body'])('times out during %s and allows retry without caching failure', async (phase) => {
		if (phase === 'fetch') {
			fetchMock.mockImplementationOnce(() => new Promise(() => {}));
		} else {
			const response = success();
			vi.spyOn(response, 'text').mockImplementationOnce(() => new Promise(() => {}));
			fetchMock.mockResolvedValueOnce(response);
		}
		const request = service.get('octocat');
		const rejection = expect(request).rejects.toMatchObject({ status: 504, code: 'UPSTREAM_TIMEOUT' });
		await vi.advanceTimersByTimeAsync(10_000);
		await rejection;
		expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
		expect(JSON.parse(await service.get('octocat'))).toEqual(payload);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('cache shares case-insensitive keys, expires at exactly five minutes and does not serve stale data', async () => {
		await service.get('Octocat');
		await vi.advanceTimersByTimeAsync(299_999);
		await service.get('OCTOCAT');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1);
		fetchMock.mockRejectedValueOnce(new TypeError('offline'));
		await expect(service.get('octocat')).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
		await service.get('octocat');
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('cache TTL starts after a successful response finishes', async () => {
		fetchMock.mockImplementationOnce(async () => {
			await new Promise((resolve) => setTimeout(resolve, 5_000));
			return success();
		});
		const request = service.get('octocat');
		await vi.advanceTimersByTimeAsync(5_000);
		await request;
		await vi.advanceTimersByTimeAsync(299_999);
		await service.get('octocat');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('cache holds at most 500 entries and evicts by insertion order', async () => {
		for (let i = 0; i < 500; i++) await service.get(`user${i}`);
		await service.get('user0');
		await service.get('user500');
		await service.get('user1');
		expect(fetchMock).toHaveBeenCalledTimes(501);
		await service.get('user0');
		expect(fetchMock).toHaveBeenCalledTimes(502);
	});

	it('cache deduplicates concurrent requests and cleans pending requests after failures', async () => {
		const results = await Promise.all([service.get('octocat'), service.get('OCTOCAT')]);
		expect(results[0]).toBe(results[1]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		fetchMock.mockRejectedValueOnce(new TypeError('offline'));
		const failures = await Promise.allSettled([service.get('other'), service.get('OTHER')]);
		expect(failures.every((result) => result.status === 'rejected')).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		await service.get('other');
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});
});
