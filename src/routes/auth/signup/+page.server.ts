import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  signup: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      console.error(signUpError);
      throw redirect(303, '/auth/error');
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      console.error('No user ID returned from signUp');
      throw redirect(303, '/auth/error');
    }

    const { error: insertError } = await supabase
      .from('accounts')
      .insert({
            id: userId,            // <- Include this
        username: username,
        email: email,
      });

    if (insertError) {
      console.error(insertError);
      throw redirect(303, '/auth/error');
    }

    throw redirect(303, '/');
  }
};
