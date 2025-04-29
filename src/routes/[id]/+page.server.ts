import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import type { PageServerLoad } from './$types';

// Get the current game state from Supabase
export const load: PageServerLoad = async ({ params }) => {
	const gameId = params.id;

	const { data, error } = await supabaseClient
		.from('games')
		.select('fen, white_player_id, black_player_id')
		.eq('id', gameId)
		.single();

	if (error) throw new Error(error.message);

	const game = new Chess(data.fen);
	const currentTurn = game.turn(); // 'w' or 'b'

	return {
		fen: game.fen(),
		gameId,
		currentTurn, // pass 'w' or 'b' to +page.svelte
		whitePlayerId: data.white_player_id,
		blackPlayerId: data.black_player_id
	};
};
