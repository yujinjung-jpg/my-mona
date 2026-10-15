import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContributionsError, contributionsService } from './contributions';
import { GET } from '../../pages/api/contributions/[username]';

function request(username?: string) {
	return GET({ params: { username } });
}

afterEach(() => vi.restoreAllMocks());

describe('contributions route', () => {
	it('returns the original JSON and disables downstream caching', async () => {
		const json = '{"schema":"v2","weeks":[]}';
		vi.spyOn(contributionsService, 'get').mockResolvedValue(json);
		const response = await request('octocat');
		expect(response.status).toBe(200);
		expect(await response.text()).toBe(json);
		expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
		expect(response.headers.get('Cache-Control')).toBe('no-store');
		expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false);
	});

	it.each([
		[400, 'INVALID_USERNAME'], [404, 'USER_NOT_FOUND'], [429, 'UPSTREAM_RATE_LIMITED'],
		[503, 'UPSTREAM_FORBIDDEN'], [502, 'UPSTREAM_ERROR'], [504, 'UPSTREAM_TIMEOUT'],
	])('returns a structured HTTP %s error', async (status, code) => {
		vi.spyOn(contributionsService, 'get').mockRejectedValue(new ContributionsError(status, code, 'Public error'));
		const response = await request('octocat');
		expect(response.status).toBe(status);
		expect(await response.json()).toEqual({ error: { code, message: 'Public error' } });
		expect(response.headers.get('Cache-Control')).toBe('no-store');
	});

	it('rejects missing and malformed usernames', async () => {
		expect((await request()).status).toBe(400);
		expect((await request('bad--name')).status).toBe(400);
	});

	it('forwards validated Retry-After metadata', async () => {
		vi.spyOn(contributionsService, 'get').mockRejectedValue(
			new ContributionsError(429, 'UPSTREAM_RATE_LIMITED', 'Try later', '120'),
		);
		expect((await request('octocat')).headers.get('Retry-After')).toBe('120');
	});

	it('logs unexpected errors without exposing internal details', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(contributionsService, 'get').mockRejectedValue(new Error('secret internals'));
		const response = await request('octocat');
		expect(response.status).toBe(500);
		expect(await response.text()).not.toContain('secret internals');
		expect(log).toHaveBeenCalled();
	});
});
