import { supabaseClient } from '$lib/supabase';
import { Chess } from 'chess.js';
import { fail, redirect, type ServerLoad } from '@sveltejs/kit';

import type { Actions } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const load: ServerLoad = async ({ locals, params  }) => {
  const supabase = locals.supabase as SupabaseClient;
  const authUser = locals.user; // This is Supabase Auth user

  // Ensure user is authenticated
  if (!authUser) throw redirect(303, '/auth/login');

  // Fetch full user info (e.g., username) from accounts table
  const { data: currentUser, error: userError } = await supabase
    .from('accounts')
    .select('id, username')
    .eq('id', authUser.id)
    .single();

  if (userError || !currentUser) {
    throw redirect(303, '/auth/login'); // user record missing or error
  }

  // Fetch all other users
  const { data: users, error } = await supabase
    .from('accounts')
    .select('id, username')
    .neq('id', currentUser.id); // 👈 Exclude the current user

  if (error) {
    console.error('Error fetching users:', error.message);
    return { users: [], currentUserId: currentUser.id };
  }
    const gameId = params.id; // 👈 FIXED: get gameId from route params

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, fen, moves, white_player_id, black_player_id, current_turn')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return fail(404, { message: 'Game not found' });
  }


  return {
    users,
    currentUserId: currentUser.id,
     gameId,           // ✅ pass gameId to client
  game       
  };
};

export const actions: Actions = {
  makeMove: async ({ request, locals }) => {
    const formData = await request.formData();
    const gameId = formData.get('gameId') as string;
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const promotion = formData.get('promotion') as string | null;

    if (!gameId || !from || !to) {
      return fail(400, { message: 'Missing required fields' });
    }

    // Get authenticated user
    const authUser = locals.user;
    if (!authUser) {
      return fail(401, { message: 'You must be logged in to move.' });
    }

    // Fetch game info
    const { data: game, error } = await supabaseClient
      .from('games')
      .select('fen, moves, white_player_id, black_player_id, current_turn')
      .eq('id', gameId)
      .single();

    if (error || !game) {
      return fail(404, { message: 'Game not found' });
    }

    // Enforce turn-based play based on IDs
    const expectedPlayerId =
      game.current_turn === 'w' ? game.white_player_id : game.black_player_id;

    if (authUser.id !== expectedPlayerId) {
      return fail(403, { message: "It's not your turn." });
    }

    const chess = new Chess(game.fen);
    const moveObj = { from, to, ...(promotion ? { promotion } : {}) };
    const move = chess.move(moveObj);

    if (!move) {
      return fail(400, { message: 'Invalid move.' });
    }

    const updatedMoves = [...(game.moves ?? []), move.san];

    const { error: updateError } = await supabaseClient
      .from('games')
      .update({
        fen: chess.fen(),
        moves: updatedMoves,
        current_turn: chess.turn()
      })
      .eq('id', gameId);

    if (updateError) {
      return fail(500, { message: 'Failed to update game.' });
    }

    return { success: true };
  },

      logout: async ({ locals, cookies }) => {
      const supabase = locals.supabase as SupabaseClient;
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
        throw redirect(303, '/auth/error');
      }
  
      cookies.delete('session', { path: '/' });
      throw redirect(303, '/auth/login');
    }
};