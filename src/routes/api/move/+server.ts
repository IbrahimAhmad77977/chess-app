import { json } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabase';
import type { RequestEvent } from '@sveltejs/kit';  // Import the correct type for request

export async function POST({ request }: RequestEvent) {
	const { gameId, fen } = await request.json();
	const { error } = await supabaseClient
		.from('games')
		.update({ fen })
		.eq('id', gameId);

	if (error) return json({ error: error.message }, { status: 500 });
	return json({ success: true });
}
