<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';
	import type { AuthChangeEvent } from '@supabase/supabase-js';
	import '../app.css';

	export let data: {
		supabase: SupabaseClient;
		user: any;
	};

	let { supabase, user } = data;

	onMount(() => {
		// Refresh SSR user data on auth state change
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(event: AuthChangeEvent, session: Session | null) => {
				invalidate('supabase:auth');
			}
		);

		return () => {
			authListener?.subscription?.unsubscribe();
		};
	});
</script>

<slot />
