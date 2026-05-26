import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check your .env file.')
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}

// Export a singleton instance for convenience as per GEMINI.md
export const supabase = createClient()
