export type Role = "member" | "volunteer_admin" | "webmaster";
export type UserStatus = "active" | "pending" | "inactive";
export type MembershipStatus = "website_user" | "official_member";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  instrument: string;
  role: Role;
  status: UserStatus;
  membership_status: MembershipStatus;
};

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  service_minutes: number;
  status: "draft" | "open" | "closed" | "completed" | "cancelled";
  audience: "all_users" | "official_members";
  signup_count: number;
  is_signed_up?: boolean;
  signup_open?: boolean;
  can_signup?: boolean;
  signup_block_reason?: string;
};

export type EventSignup = {
  id: string;
  user_id: string;
  member_name: string;
  member_email: string;
  member_instrument?: string;
  source: "member" | "admin";
  attendance_status: "pending" | "attended" | "absent";
  attendance_confirmed_by?: string;
  attendance_confirmed_at?: string;
  created_at: string;
};

export type ServiceHourRecord = {
  id: string;
  user_id: string;
  event_id: string | null;
  activity: string;
  service_date: string;
  minutes: number;
  notes: string;
  status: "pending" | "verified" | "rejected";
  member_name?: string;
  member_email?: string;
};

export type ContentEntry = {
  key: string;
  value: string;
  page: string;
  label: string;
  field_type: string;
  updated_at: string;
};
