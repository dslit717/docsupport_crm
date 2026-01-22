// Supabase 관련 클라이언트 전용 exports
export { createSupabaseBrowserClient } from "./client";
export { authService } from "./auth";
export { databaseService } from "./database";

export type {
  UserProfile,
  Hospital,
  ChatSession,
  ChatMessage,
  Database,
  Vendor,
  VendorCategory,
  VendorWithDetails,
  VendorImage,
  VendorRatingStats,
  BudgetTier,
  VendorStatus,
} from "./types";

// 서버 전용 함수들은 직접 import 필요:
// import { createSupabaseServerClient } from '@/lib/supabase/server'
// import { createSupabaseAdminClient } from '@/lib/supabase/admin'
// import { serverDatabaseService } from '@/lib/supabase/database'
