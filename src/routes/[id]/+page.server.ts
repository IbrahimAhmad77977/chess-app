import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Helper function to validate UUID format
const isValidUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;

	if (!isValidUUID(id)) {
		throw error(404, 'Invalid game ID');
	}

  // Query the game from the database
  const { data, error: supabaseError } = await supabaseClient
    .from('games')
    .select('fen, white_player_id, black_player_id')
    .eq('id', id)
    .single();

  // If there is an error or no data, throw a 404 error
  if (supabaseError || !data) {
    throw error(404, 'Game not found');
  }

	const game = new Chess(data.fen);
	const currentTurn = game.turn();

  return {
    fen: game.fen(), // Return the updated FEN
    gameId: id, // Game ID
    currentTurn, // Current player's turn ('w' or 'b')
    whitePlayerId: data.white_player_id, // White player ID
    blackPlayerId: data.black_player_id, // Black player ID
  };
};
