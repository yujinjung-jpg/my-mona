export interface ContributionDay {
	weekday: number;
	count: number;
	level: number;
}

export interface ContributionWeek {
	index: number;
	first_day: string;
	contribution_days: ContributionDay[];
}

export interface ContributionData {
	schema: 'v2';
	from: string;
	to: string;
	total_contributions: number;
	colors_full: string[];
	weeks: ContributionWeek[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isDate(value: unknown): value is string {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function contributionDate(firstDay: string, weekday: number): string {
	const date = new Date(`${firstDay}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + weekday);
	return date.toISOString().slice(0, 10);
}

function isDay(value: unknown): value is ContributionDay {
	return isRecord(value) && isCount(value.weekday) && value.weekday <= 6
		&& isCount(value.count) && isCount(value.level) && value.level < 5;
}

function isWeek(value: unknown): value is ContributionWeek {
	return isRecord(value) && isCount(value.index) && isDate(value.first_day)
		&& new Date(`${value.first_day}T00:00:00Z`).getUTCDay() === 0
		&& Array.isArray(value.contribution_days) && value.contribution_days.every(isDay)
		&& new Set(value.contribution_days.map((day) => day.weekday)).size === value.contribution_days.length;
}

export function parseContributions(value: unknown): ContributionData {
	if (!isRecord(value) || value.schema !== 'v2' || !isDate(value.from) || !isDate(value.to)
		|| value.from > value.to || !isCount(value.total_contributions)
		|| !Array.isArray(value.colors_full) || value.colors_full.length !== 5
		|| !value.colors_full.every((color: unknown) => typeof color === 'string' && /^#[a-f\d]{6}$/i.test(color))
		|| !Array.isArray(value.weeks) || !value.weeks.every(isWeek)) {
		throw new Error('GitHub returned unsupported contribution data. Please try again later.');
	}
	return {
		schema: 'v2',
		from: value.from,
		to: value.to,
		total_contributions: value.total_contributions,
		colors_full: value.colors_full,
		weeks: value.weeks,
	};
}

export async function fetchContributions(username: string): Promise<ContributionData> {
	let response: Response;
	try {
		response = await fetch(`/api/contributions/${encodeURIComponent(username)}`);
	} catch (error) {
		console.error('Battle contribution request failed', error);
		throw new Error('Could not connect to the server. Check your connection and try again.');
	}
	let data: unknown;
	try {
		data = await response.json();
	} catch (error) {
		console.error('Battle API returned unreadable JSON', error);
		throw new Error(`The server returned an unreadable response (HTTP ${response.status}). Try again.`);
	}
	if (!response.ok) {
		const message = isRecord(data) && isRecord(data.error) && typeof data.error.message === 'string'
			? data.error.message
			: `Could not load contributions (HTTP ${response.status}).`;
		throw new Error(message);
	}
	return parseContributions(data);
}
