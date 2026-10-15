import type { APIContext, APIRoute } from 'astro';
import { ContributionsError, contributionsService } from '../../../lib/server/contributions';

export const prerender = false;

export const GET = (async ({ params }: Pick<APIContext, 'params'>) => {
	const headers = new Headers({
		'Content-Type': 'application/json; charset=utf-8',
		'Cache-Control': 'no-store',
	});
	try {
		const json = await contributionsService.get(params.username ?? '');
		return new Response(json, { headers });
	} catch (error) {
		if (error instanceof ContributionsError) {
			if (error.retryAfter) headers.set('Retry-After', error.retryAfter);
			return new Response(JSON.stringify({ error: { code: error.code, message: error.message } }), {
				status: error.status,
				headers,
			});
		}
		console.error('Unexpected contributions API failure', error);
		return new Response(JSON.stringify({
			error: { code: 'INTERNAL_ERROR', message: 'Could not load contributions. Try again.' },
		}), { status: 500, headers });
	}
}) satisfies APIRoute;
