import { redirect, type Actions } from "@sveltejs/kit";

export const actions: Actions = {
	logout: async ({ locals: { supabase }, cookies }) => {
		// Sign out the user
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
			// Redirect to an error page if sign out fails
			throw redirect(303, '/auth/error');
		}

		// Optional: Clear any session-related cookies (if applicable)
		cookies.delete('session', { path: '/' });

		// Redirect to the login page after successful logout
		throw redirect(303, '/auth/login');
	}
}