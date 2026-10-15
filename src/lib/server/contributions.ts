const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_LIMIT = 500;
const TIMEOUT_MS = 10_000;

export function normalizeUsername(username: string): string | null {
	return /^[a-z\d]+(?:-[a-z\d]+)*$/i.test(username) && username.length <= 39
		? username.toLowerCase()
		: null;
}

export class ContributionsError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: string,
		message: string,
		public readonly retryAfter?: string,
	) {
		super(message);
	}
}

function validRetryAfter(value: string | null): string | undefined {
	if (value && (/^\d+$/.test(value) || Number.isFinite(Date.parse(value)))) {
		return value;
	}
	return undefined;
}

export class ContributionsService {
	private readonly cache = new Map<string, { json: string; expiresAt: number }>();
	private readonly pending = new Map<string, Promise<string>>();

	async get(username: string): Promise<string> {
		const key = normalizeUsername(username);
		if (!key) {
			throw new ContributionsError(400, 'INVALID_USERNAME', 'Enter a valid GitHub username.');
		}

		const now = Date.now();
		for (const [name, entry] of this.cache) {
			if (entry.expiresAt <= now) this.cache.delete(name);
		}
		const cached = this.cache.get(key);
		if (cached) return cached.json;
		const existing = this.pending.get(key);
		if (existing) return existing;

		const request = this.fetchContributions(key).then((json) => {
			const completedAt = Date.now();
			for (const [name, entry] of this.cache) {
				if (entry.expiresAt <= completedAt) this.cache.delete(name);
			}
			if (this.cache.size >= CACHE_LIMIT) {
				const oldest = this.cache.keys().next();
				if (!oldest.done) this.cache.delete(oldest.value);
			}
			this.cache.set(key, { json, expiresAt: completedAt + CACHE_TTL_MS });
			return json;
		}).finally(() => {
			this.pending.delete(key);
		});
		this.pending.set(key, request);
		return request;
	}

	private async fetchContributions(username: string): Promise<string> {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => {
				console.error('GitHub contributions request timed out');
				reject(new ContributionsError(504, 'UPSTREAM_TIMEOUT', 'GitHub took too long to respond. Try again.'));
				controller.abort();
			}, TIMEOUT_MS);
		});

		try {
			return await Promise.race([this.readResponse(username, controller.signal), timeout]);
		} finally {
			clearTimeout(timer);
		}
	}

	private async readResponse(username: string, signal: AbortSignal): Promise<string> {
		let response: Response;
		try {
			response = await fetch(`https://github.com/${encodeURIComponent(username)}.contribs`, {
				headers: { Accept: 'application/json' },
				redirect: 'manual',
				signal,
			});
		} catch (error) {
			console.error('GitHub contributions request failed', error);
			throw new ContributionsError(502, 'UPSTREAM_UNAVAILABLE', 'Could not reach GitHub. Try again.');
		}

		if (!response.ok) {
			console.error('GitHub contributions returned HTTP', response.status);
			if (response.status === 404) {
				throw new ContributionsError(404, 'USER_NOT_FOUND', 'GitHub user not found.');
			}
			if (response.status === 429) {
				throw new ContributionsError(429, 'UPSTREAM_RATE_LIMITED', 'GitHub request limit reached. Try again later.',
					validRetryAfter(response.headers.get('Retry-After')));
			}
			if (response.status === 403) {
				throw new ContributionsError(503, 'UPSTREAM_FORBIDDEN', 'GitHub refused the request. Try again later.');
			}
			throw new ContributionsError(502, 'UPSTREAM_ERROR', 'GitHub returned an unexpected response.');
		}

		if (response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
			console.error('GitHub contributions returned a non-JSON content type');
			throw new ContributionsError(502, 'INVALID_UPSTREAM_RESPONSE', 'GitHub returned invalid contribution data.');
		}
		let json: string;
		try {
			json = await response.text();
		} catch (error) {
			console.error('GitHub contributions response body failed', error);
			throw new ContributionsError(502, 'UPSTREAM_UNAVAILABLE', 'Could not read GitHub data. Try again.');
		}
		try {
			JSON.parse(json);
		} catch (error) {
			console.error('GitHub contributions returned malformed JSON', error);
			throw new ContributionsError(502, 'INVALID_UPSTREAM_RESPONSE', 'GitHub returned invalid contribution data.');
		}
		return json;
	}
}

export const contributionsService = new ContributionsService();
