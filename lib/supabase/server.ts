import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // @ts-ignore - In RSC, cookies are read-only; in Route Handlers/Server Actions, this exists
          cookieStore.set({ name, value, ...options })
        } catch {
          // no-op when cookies are read-only
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // @ts-ignore - See note above
          cookieStore.set({ name, value: "", ...options })
        } catch {
          // no-op when cookies are read-only
        }
      },
    },
  })
}
