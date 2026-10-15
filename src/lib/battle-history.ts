export interface BattlePlayer {
	username: string;
	contributions: number;
}

export interface BattleRecord {
	players: [BattlePlayer, BattlePlayer];
	winner: string | null;
	timestamp: string;
}

export const HISTORY_KEY = 'mona-mayhem.battles.v1';
const HISTORY_LIMIT = 10;

export function formatBattleSummary(record: BattleRecord): string {
	return [
		'Mona Mayhem - GitHub Contribution Battle Arena',
		...record.players.map((player) => `${player.username}: ${player.contributions.toLocaleString('en-US')} contributions`),
		record.winner === null ? "🤝 IT'S A TIE! 🤝" : `🏆 ${record.winner} WINS! 🏆`,
	].join('\n');
}

export function createBattleRecord(players: [BattlePlayer, BattlePlayer], timestamp = new Date().toISOString()): BattleRecord {
	const [first, second] = players;
	return {
		players,
		winner: first.contributions === second.contributions ? null
			: first.contributions > second.contributions ? first.username : second.username,
		timestamp,
	};
}

function isPlayer(value: unknown): value is BattlePlayer {
	return typeof value === 'object' && value !== null
		&& 'username' in value && typeof value.username === 'string'
		&& value.username.length <= 39 && /^[a-z\d]+(?:-[a-z\d]+)*$/i.test(value.username)
		&& 'contributions' in value && typeof value.contributions === 'number'
		&& Number.isSafeInteger(value.contributions) && value.contributions >= 0;
}

function isRecord(value: unknown): value is BattleRecord {
	if (typeof value !== 'object' || value === null
		|| !('players' in value) || !Array.isArray(value.players) || value.players.length !== 2
		|| !isPlayer(value.players[0]) || !isPlayer(value.players[1])
		|| !('timestamp' in value) || typeof value.timestamp !== 'string'
		|| !/^\d{4}-\d{2}-\d{2}T/.test(value.timestamp) || !Number.isFinite(Date.parse(value.timestamp))
		|| !('winner' in value)) return false;
	return value.winner === createBattleRecord([value.players[0], value.players[1]], value.timestamp).winner;
}

export function readBattleHistory(storage: Pick<Storage, 'getItem'>): BattleRecord[] {
	const raw = storage.getItem(HISTORY_KEY);
	if (raw === null) return [];
	const records: unknown = JSON.parse(raw);
	if (!Array.isArray(records) || !records.every(isRecord)) {
		throw new Error('Saved battle history is invalid.');
	}
	return records.slice(0, HISTORY_LIMIT);
}

export function saveBattleHistory(storage: Pick<Storage, 'getItem' | 'setItem'>, record: BattleRecord): BattleRecord[] {
	const records = [record, ...readBattleHistory(storage)].slice(0, HISTORY_LIMIT);
	storage.setItem(HISTORY_KEY, JSON.stringify(records));
	return records;
}
