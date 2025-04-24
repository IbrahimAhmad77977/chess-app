import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import type { PageServerLoad } from './$types';

// Get the current game state from Supabase
export const load: PageServerLoad = async ({ params }) => {
  const gameId = params.id;

  // Fetch the game state (FEN, turn, player IDs)
  const { data, error } = await supabaseClient
    .from('games')
    .select('fen, current_turn, white_player_id, black_player_id')
    .eq('id', gameId)
    .single();

  if (error) throw new Error(error.message);

  // Initialize the Chess.js instance
  const game = new Chess(data.fen);

  return {
    fen: game.fen(),
    gameId,
    currentTurn: data.current_turn,
    whitePlayerId: data.white_player_id,
    blackPlayerId: data.black_player_id,
  };
};

// Save the game state (after each move)
export const updateGame = async (gameId: string, fen: string, currentTurn: string) => {
  const { error } = await supabaseClient
    .from('games')
    .update({ fen, current_turn: currentTurn })
    .eq('id', gameId);

  if (error) throw new Error(error.message);
};
