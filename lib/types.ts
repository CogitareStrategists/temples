// Row types mirroring db/migrations/0001_init.sql

export type UserRole = "super_admin" | "temple_manager" | "temple_admin";
export type UserStatus = "pending_approval" | "active" | "suspended";
export type TempleStatus = "pending_approval" | "published" | "suspended" | "rejected";
export type ListingStatus = "active" | "inactive";
export type SubscriptionStatus = "pending_payment" | "active" | "expired" | "cancelled";
export type PaymentStatus = "created" | "paid" | "failed" | "refunded";
export type SuggestionScope = "global" | "temple";
export type SuggestionTarget = "deity" | "category" | "area" | "field_modification" | "other";
export type SuggestionStatus = "pending" | "approved" | "rejected";
export type TempleVersionType = "initial_submission" | "edit" | "approved_baseline";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  status: UserStatus;
  created_by: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeityRow {
  id: string;
  label_en: string;
  label_te: string | null;
  image_url: string | null;
  status: ListingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  label_en: string;
  label_te: string | null;
  description_en: string | null;
  description_te: string | null;
  sort_order: number;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

export interface TempleRow {
  id: string;
  slug: string;
  name_en: string;
  name_te: string | null;
  primary_deity_id: string | null;
  area_id: string | null;
  description_en: string | null;
  description_te: string | null;
  address_line_en: string | null;
  address_line_te: string | null;
  city: string | null;
  district: string | null;
  state: string;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  donation_upi_vpa: string | null;
  donation_upi_name: string | null;
  donation_qr_url: string | null;
  primary_photo_url: string | null;
  status: TempleStatus;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  subscription_valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface TempleTimingRow {
  id: string;
  temple_id: string;
  day_of_week: number;
  session_order: number;
  session_label_en: string | null;
  session_label_te: string | null;
  open_time: string;
  close_time: string;
}

export interface TempleTimingExceptionRow {
  id: string;
  temple_id: string;
  title_en: string;
  title_te: string | null;
  note_en: string | null;
  note_te: string | null;
  exception_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  is_closed: boolean;
  special_open_time: string | null;
  special_close_time: string | null;
  created_at: string;
}

export interface TempleEventRow {
  id: string;
  temple_id: string;
  title_en: string;
  title_te: string | null;
  description_en: string | null;
  description_te: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location_note_en: string | null;
  location_note_te: string | null;
  image_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TempleVideoRow {
  id: string;
  temple_id: string;
  title_en: string;
  title_te: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sort_order: number;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface SubscriptionPlanRow {
  id: string;
  code: string;
  name_en: string;
  name_te: string | null;
  duration_months: number;
  amount_inr: string;
  status: ListingStatus;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  temple_id: string;
  plan_id: string;
  amount_inr: string;
  start_date: string | null;
  end_date: string | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  temple_id: string;
  subscription_id: string | null;
  amount_inr: string;
  currency: string;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  method: string | null;
  initiated_by: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface FieldSuggestionRow {
  id: string;
  suggested_by: string | null;
  scope: SuggestionScope;
  temple_id: string | null;
  target: SuggestionTarget;
  label_en: string | null;
  label_te: string | null;
  payload: Record<string, unknown> | null;
  rationale: string | null;
  status: SuggestionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface SignificanceRow {
  id: string;
  slug: string;
  label_en: string;
  label_te: string | null;
  sort_order: number;
  status: ListingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type HomeSection = "featured" | "deity" | "location" | "significance" | "facility";

export interface HomeFeaturedRow {
  id: string;
  section: HomeSection;
  temple_id: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface AreaRow {
  id: string;
  district: string;
  name_en: string;
  name_te: string | null;
  status: ListingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FacilityRow {
  id: string;
  slug: string;
  label_en: string;
  label_te: string | null;
  sort_order: number;
  status: ListingStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TempleContactRow {
  id: string;
  temple_id: string;
  label_en: string;
  label_te: string | null;
  person_name: string | null;
  phone: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TempleAdminRequestRow {
  id: string;
  temple_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "rejected";
  requested_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}
