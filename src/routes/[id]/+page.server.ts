import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import { error } from '@sveltejs/kit'; // ✅ This was missing
import type { PageServerLoad } from './$types';

const isValidUUID = (str: string) =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	// ✅ Validate UUID to avoid favicon.png errors
	if (!isValidUUID(id)) {
		return []
	}

	const { data, error: supabaseError } = await supabaseClient
		.from('games')
		.select('fen, white_player_id, black_player_id')
		.eq('id', id)
		.single();

	if (supabaseError || !data) {
		throw error(404, 'Game not found');
	}

	const game = new Chess(data.fen);
	const currentTurn = game.turn(); // 'w' or 'b'

	return {
		fen: game.fen(),
		gameId: id,
		currentTurn,
		whitePlayerId: data.white_player_id,
		blackPlayerId: data.black_player_id
	};
};
