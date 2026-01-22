// 인증 관련 함수들
import { createSupabaseBrowserClient } from './client'

export const authService = {
  // 로그인
  async signInWithKakao() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.")
    }
    
    const origin = window.location.origin
    
    return await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })
  },

  // 로그아웃
  async signOut() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      throw new Error("Supabase 클라이언트를 초기화할 수 없습니다.")
    }
    return await supabase.auth.signOut()
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      return { data: { user: null }, error: new Error("Supabase 클라이언트를 초기화할 수 없습니다.") }
    }
    return await supabase.auth.getUser()
  },

  // 세션 정보 가져오기
  async getSession() {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      return { data: { session: null }, error: new Error("Supabase 클라이언트를 초기화할 수 없습니다.") }
    }
    return await supabase.auth.getSession()
  },

  // 인증 상태 변화 감지
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      return { data: { subscription: null } }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}
