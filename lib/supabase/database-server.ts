// 서버 전용 데이터베이스 함수들
import { createSupabaseServerClient } from './server'

export const serverDatabaseService = {
  async getUserProfile(userId: string) {
    const supabase = await createSupabaseServerClient()
    
    return await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        name,
        nickname,
        email,
        phone,
        hospital_name,
        specialty,
        identity_verified,
        license_number,
        license_verified_at,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .single()
  },

  async updateUserProfile(userId: string, updates: any) {
    const supabase = await createSupabaseServerClient()
    
    return await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
  },

  async createUserProfile(profileData: any) {
    const supabase = await createSupabaseServerClient()
    
    return await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
  },

  // 서버에서만 필요한 다른 함수들...
}
