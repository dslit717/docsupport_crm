"use client"

import { createBrowserClient } from "@supabase/ssr"

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // 환경 변수가 없으면 null 반환 (에러 대신)
    return null
  }

  return createBrowserClient(url, anonKey)
}
