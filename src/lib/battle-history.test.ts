import { describe, expect, it } from 'vitest';
import { HISTORY_KEY, createBattleRecord, formatBattleSummary, readBattleHistory, saveBattleHistory } from './battle-history';

function storage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => { values.set(key, value); },
	};
}
const players = [{ username: 'octocat', contributions: 10 }, { username: 'torvalds', contributions: 20 }] as const;
const record = () => createBattleRecord([{ ...players[0] }, { ...players[1] }], '2026-10-15T08:00:00.000Z');

describe('battle history', () => {
	it('formats both player totals and the winner or tie for sharing', () => {
		expect(formatBattleSummary(record())).toBe(
			'Mona Mayhem - GitHub Contribution Battle Arena\noctocat: 10 contributions\ntorvalds: 20 contributions\n🏆 torvalds WINS! 🏆',
		);
		const tie = createBattleRecord([{ username: 'one', contributions: 1234 }, { username: 'two', contributions: 1234 }]);
		expect(formatBattleSummary(tie)).toContain('one: 1,234 contributions\ntwo: 1,234 contributions\n🤝 IT\'S A TIE! 🤝');
	});
	it('records either winner and ties with timestamp and player totals', () => {
		expect(record()).toMatchObject({ winner: 'torvalds', timestamp: '2026-10-15T08:00:00.000Z', players });
		expect(createBattleRecord([{ ...players[1] }, { ...players[0] }]).winner).toBe('torvalds');
		expect(createBattleRecord([{ ...players[0] }, { ...players[0] }]).winner).toBeNull();
	});
	it('persists newest first and retains exactly the last ten battles', () => {
		const store = storage();
		expect(readBattleHistory(store)).toEqual([]);
		for (let i = 0; i < 12; i++) {
			saveBattleHistory(store, createBattleRecord([
				{ username: `user${i}`, contributions: i }, { ...players[0] },
			]));
		}
		const saved = readBattleHistory(store);
		expect(saved).toHaveLength(10);
		expect(saved[0].players[0].username).toBe('user11');
		expect(saved[9].players[0].username).toBe('user2');
	});
	it.each(['{', '{}', '[null]', JSON.stringify([{ ...record(), winner: 'octocat' }]),
		JSON.stringify([{ ...record(), timestamp: 'invalid' }]),
		JSON.stringify([{ ...record(), players: [{ username: '<script>', contributions: 1 }, players[1]] }]),
	])('reports corrupt data without overwriting it', (raw) => {
		const store = storage();
		store.setItem(HISTORY_KEY, raw);
		expect(() => readBattleHistory(store)).toThrow();
		expect(() => saveBattleHistory(store, record())).toThrow();
		expect(store.getItem(HISTORY_KEY)).toBe(raw);
	});
	it('surfaces read and write failures', () => {
		expect(() => readBattleHistory({ getItem() { throw new Error('denied'); } })).toThrow('denied');
		expect(() => saveBattleHistory({
			getItem: () => null, setItem() { throw new Error('quota'); },
		}, record())).toThrow('quota');
	});
});
