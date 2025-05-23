import { json } from '@sveltejs/kit';
import { supabaseClient } from '$lib/supabase';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const { fen } = await request.json();

	const { data, error } = await supabaseClient
		.from('games')
		.insert([{ fen }])
		.select(); // optional: to return the inserted row

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true, game: data?.[0] });
}
