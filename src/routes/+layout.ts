// src/routes/+layout.ts
import { isBrowser } from '@supabase/ssr'
import { supabaseClient as browserClient } from '$lib/supabase'
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth')

  const supabase = isBrowser()
    ? browserClient
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: { fetch },
        cookies: {
          getAll: () => data.cookies,
        },
      })

  let user = null
  if (!isBrowser() && data.cookies) {
    const {
      data: { user: serverUser },
    } = await supabase.auth.getUser()
    user = serverUser
  }

  return { supabase, user }
}
