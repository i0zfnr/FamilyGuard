import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('XennGuard is not connected to its data service yet. Set the Supabase project URL and publishable key.')
  }

  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return client
}

export function getSupabaseFunctionUrl(): string {
  if (!supabaseUrl) {
    throw new Error('XennGuard is not connected to its data service yet. Set the Supabase project URL.')
  }
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/xennguard-api`
}

export function getSupabasePublishableKey(): string {
  if (!supabasePublishableKey) {
    throw new Error('XennGuard is not connected to its data service yet. Set the Supabase publishable key.')
  }
  return supabasePublishableKey
}

