import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  makeMove: async ({ request }) => {
    const formData = await request.formData();
    const gameId = formData.get('gameId') as string;
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const promotion = formData.get('promotion') as string | null;

    if (!gameId || !from || !to) {
      return fail(400, { message: 'Missing required fields' });
    }

    const { data, error } = await supabaseClient
      .from('games')
      .select('fen, moves, white_player_id, black_player_id')
      .eq('id', gameId)
      .single();

    if (error || !data) {
      return fail(404, { message: 'Game not found' });
    }

    const game = new Chess(data.fen);
    const moveObj = { from, to, ...(promotion ? { promotion } : {}) };

    const move = game.move(moveObj);
    if (!move) {
      return fail(400, { message: 'Invalid move' });
    }

    // Update moves list
    const updatedMoves = [...(data.moves ?? []), move.san];

    const { error: updateError } = await supabaseClient
      .from('games')
      .update({
        fen: game.fen(),
        moves: updatedMoves,
        current_turn: game.turn(),
      })
      .eq('id', gameId);

    if (updateError) {
      return fail(500, { message: 'Failed to update game' });
    }

    return { success: true };
  },
};
