import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export const load: ServerLoad = async ({ locals }) => {
  const supabase = locals.supabase as SupabaseClient;
  const user = locals.user as User;

  // Ensure user is authenticated
  if (!user) throw redirect(303, '/auth/login');

  // Fetch all users except the current user
  const { data: users, error } = await supabase
    .from('accounts')
    .select('id, username') // Ensure you are selecting the correct columns

  if (error) {
    console.error('Error fetching users:', error.message);
    return { users: [], currentUserId: user.id }; // In case of error, return empty array
  }

  return {
    users,
    currentUserId: user.id
  };
};

export const actions: Actions = {
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
