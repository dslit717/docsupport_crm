// Supabase 관련 타입 정의
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  speciality: string | null;
  profile_image: string | null;
  phone_number: string | null;
  identity_verified: boolean;
  medical_license: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  nickname: string | null;
  avatar_url: string | null;
  provider: string | null;
  license_upload_date: string | null;
  license_verified_date: string | null;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: string;
  address: Record<string, any> | null;
  contact: Record<string, any> | null;
  departments: Record<string, any> | null;
  facilities: Record<string, any> | null;
  accreditation: Record<string, any> | null;
  operating_hours: Record<string, any> | null;
  holiday_schedule: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  user_id: string;
  naver_place_url: string | null;
  naver_place_id: string | null;
  business_hours: string | null;
  description: string | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  category: "경영" | "세무" | "마케팅" | "노무" | "그 외";
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Vendor 관련 타입들
export interface VendorCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorTag {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export type BudgetTier = "S" | "M" | "L" | "XL";
export type VendorStatus = "draft" | "review" | "published" | "suspended";

export interface Vendor {
  id: string;
  owner_user_id: string;
  status: VendorStatus;
  name: string;
  slug: string;
  description_md: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  sns: Record<string, any> | null;
  address: string | null;
  service_areas: string | null;
  is_certified: boolean;
  business_hours: Record<string, any> | null;
  kakao_channel: string | null;
  consultation_url: string | null;
  search_text: string | null;
  pin_until: string | null;
  highlight_badge: string | null;
  priority_score: number;
  advertisement_tier: "none" | "basic" | "premium" | "featured";
  advertisement_image_url: string | null;
  advertisement_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorImage {
  id: string;
  vendor_id: string;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  status: "pending" | "approved" | "rejected";
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface BeautyProductCategory {
  id: string;
  CategoryID: number;
  CategoryName: string;
  CategoryNameKO: string;
  CategoryDetail: string;
  CategorySEO: string;
  category_children_uuids?: string[];
  is_main_category?: boolean;
  show_order?: number;
  is_pseudo_category?: boolean;
}

export interface BeautyProduct {
  id: string;
  ProductID: number;
  ProductName: string;
  ProductNameEN: string;
  ProductManufacturer: string;
  ProductDetail: string;
  ProductDetailImage: string;
}

export interface BeautyProductWithCategory extends BeautyProduct {
  beauty_product_category_map_uuid?: {
    category_id: string;
    beauty_product_category: BeautyProductCategory;
  }[];
}

export interface BeautyProductCategoryMap {
  id: string;
  product_id: string;
  category_id: string;
}

// 의료 학회 정보
export interface MedicalSociety {
  id: number;
  name: string;
  name_en: string | null;
  category: string | null;
  description: string | null;
  website: string | null;
  website_verified: boolean;
  established: string | null;
  main_activities: string[] | null;
  sub_societies: string[] | null;
  contact: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// 조인된 업체 정보 (UI용)
export interface VendorWithDetails extends Vendor {
  categories?: VendorCategory[];
  tags?: VendorTag[];
  primary_image?: VendorImage;
  images?: VendorImage[];
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<UserProfile, "id">>;
      };
      hospitals: {
        Row: Hospital;
        Insert: Omit<Hospital, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Hospital, "id" | "user_id">>;
      };
      chat_sessions: {
        Row: ChatSession;
        Insert: Omit<ChatSession, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ChatSession, "id" | "user_id">>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: Omit<ChatMessage, "id" | "created_at">;
        Update: Partial<Omit<ChatMessage, "id" | "session_id">>;
      };
      vendors: {
        Row: Vendor;
        Insert: Omit<Vendor, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Vendor, "id" | "owner_user_id">>;
      };
      vendor_categories: {
        Row: VendorCategory;
        Insert: Omit<VendorCategory, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VendorCategory, "id">>;
      };
      vendor_tags: {
        Row: VendorTag;
        Insert: Omit<VendorTag, "id" | "created_at">;
        Update: Partial<Omit<VendorTag, "id">>;
      };
      vendor_images: {
        Row: VendorImage;
        Insert: Omit<VendorImage, "id" | "created_at">;
        Update: Partial<Omit<VendorImage, "id">>;
      };
      beauty_product_category: {
        Row: BeautyProductCategory;
        Insert: Omit<BeautyProductCategory, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BeautyProductCategory, "id">>;
      };
      beauty_products: {
        Row: BeautyProduct;
        Insert: Omit<BeautyProduct, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<BeautyProduct, "id">>;
      };
      beauty_product_category_map_uuid: {
        Row: BeautyProductCategoryMap;
        Insert: Omit<
          BeautyProductCategoryMap,
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Omit<BeautyProductCategoryMap, "id">>;
      };
    };
  };
}
