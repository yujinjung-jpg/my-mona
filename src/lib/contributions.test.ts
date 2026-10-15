import { afterEach, describe, expect, it, vi } from 'vitest';
import { contributionDate, fetchContributions, parseContributions } from './contributions';

const data = {
	schema: 'v2', from: '2026-10-11', to: '2026-10-15', total_contributions: 12,
	colors_full: ['#eeeeee', '#aaddaa', '#77bb77', '#448844', '#115511'],
	weeks: [{ index: 0, first_day: '2026-10-11', contribution_days: [
		{ weekday: 0, count: 0, level: 0 }, { weekday: 4, count: 12, level: 4 },
	] }],
};

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('contribution data', () => {
	it('accepts the live v2 structure and all five GitHub levels', () => {
		expect(parseContributions(data)).toEqual(data);
		expect(parseContributions(data).colors_full).toEqual(data.colors_full);
		for (let level = 0; level < 5; level++) {
			expect(() => parseContributions({
				...data, weeks: [{ ...data.weeks[0], contribution_days: [{ weekday: 0, count: level, level }] }],
			})).not.toThrow();
		}
	});

	it.each([
		null, {}, { ...data, schema: 'v1' }, { ...data, total_contributions: -1 },
		{ ...data, colors_full: undefined }, { ...data, colors_full: [] },
		{ ...data, colors_full: ['red', '#000000', '#000000', '#000000', '#000000'] },
		{ ...data, total_contributions: '12' }, { ...data, from: '2026-02-30' },
		{ ...data, from: '2026-10-16' }, { ...data, weeks: [null] },
		{ ...data, weeks: [{ ...data.weeks[0], first_day: '2026-10-12' }] },
		{ ...data, weeks: [{ ...data.weeks[0], contribution_days: [{ weekday: 7, count: 1, level: 0 }] }] },
		{ ...data, weeks: [{ ...data.weeks[0], contribution_days: [{ weekday: 0, count: 1, level: 5 }] }] },
		{ ...data, weeks: [{ ...data.weeks[0], contribution_days: [{ weekday: 0, count: -1, level: 0 }] }] },
		{ ...data, weeks: [{ ...data.weeks[0], contribution_days: [
			{ weekday: 0, count: 0, level: 0 }, { weekday: 0, count: 1, level: 1 },
		] }] },
	])('rejects malformed contribution data %#', (value) => {
		expect(() => parseContributions(value)).toThrow('unsupported contribution data');
	});

	it('derives dates in UTC across month, leap-day and year boundaries', () => {
		expect(contributionDate('2026-10-11', 4)).toBe('2026-10-15');
		expect(contributionDate('2024-02-25', 4)).toBe('2024-02-29');
		expect(contributionDate('2025-12-28', 6)).toBe('2026-01-03');
	});
});

describe('browser API helper', () => {
	it('calls the same-origin API and parses the response', async () => {
		const fetchMock = vi.fn().mockResolvedValue(Response.json(data));
		vi.stubGlobal('fetch', fetchMock);
		expect(await fetchContributions('Octocat')).toEqual(data);
		expect(fetchMock).toHaveBeenCalledWith('/api/contributions/Octocat');
	});

	it('surfaces server-provided and unstructured HTTP errors', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce(
			Response.json({ error: { code: 'USER_NOT_FOUND', message: 'GitHub user not found.' } }, { status: 404 }),
		).mockResolvedValueOnce(Response.json({}, { status: 503 }));
		vi.stubGlobal('fetch', fetchMock);
		await expect(fetchContributions('missing')).rejects.toThrow('GitHub user not found.');
		await expect(fetchContributions('missing')).rejects.toThrow('HTTP 503');
	});

	it('reports connection and invalid JSON failures', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('offline'))
			.mockResolvedValueOnce(new Response('<html>', { status: 502 })));
		await expect(fetchContributions('octocat')).rejects.toThrow('Check your connection');
		await expect(fetchContributions('octocat')).rejects.toThrow('unreadable response');
	});
});
