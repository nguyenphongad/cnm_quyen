// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  CAN_BO_DOAN = 'CAN_BO_DOAN',
  DOAN_VIEN = 'DOAN_VIEN'
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar?: string;
  profile_picture?: string;
  role: UserRole;
  date_joined: string;
  is_active: boolean;
  student_id?: string;
  department?: string;
  faculty?: string;
  position?: string;
}

export interface UserCreate extends Omit<User, 'id' | 'date_joined'> {
  password: string;
}

export interface UserUpdate extends Partial<Omit<User, 'id' | 'date_joined'>> {}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Post types
export enum PostStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  DELETED = 'Deleted'
}

export interface Post {
  id: number;
  title: string;
  content: string;
  status: 'Draft' | 'Published' | 'Deleted';
  image?: string;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface PostCreate {
  title: string;
  content: string;
  status: PostStatus;
}

export interface PostUpdate extends Partial<PostCreate> {}

// Activity types
export enum ActivityStatus {
  DRAFT = 'Upcoming',
  PUBLISHED = 'Upcoming',
  ONGOING = 'Ongoing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time?: string;
  end_time?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  current_participants: number;
  status: ActivityStatus;
  image?: string;
  created_at: string;
  updated_at: string;
  created_by: User;
  type?: string;
}

export interface ActivityCreate {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ActivityStatus;
}

export interface ActivityUpdate extends Partial<ActivityCreate> {}

// WorkSchedule types
export enum ScheduleStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed'
}

export interface Schedule {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  is_all_day: boolean;
  repeat_type?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
  updated_at: string;
  user: User;
}

export interface WorkScheduleCreate {
  title: string;
  description: string;
  schedule_date: string;
  status: ScheduleStatus;
}

export interface WorkScheduleUpdate extends Partial<WorkScheduleCreate> {}

// ActivityRegistration types
export enum RegistrationStatus {
  REGISTERED = 'Registered',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed'
}

export interface ActivityRegistration {
  id: number;
  activity: Activity;
  user: User;
  registration_date: string;
  status: RegistrationStatus;
  attendance: boolean;
  feedback?: string;
  rating?: number;
}

export interface ActivityRegistrationCreate {
  activity: number;
}

// Notification types
export interface Notification {
  id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  user: User;
}

// Permission types
export enum PermissionType {
  READ = 'Read',
  WRITE = 'Write',
  DELETE = 'Delete'
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
  module: string;
  created_at: string;
  granted_by: User;
}

export interface PermissionCreate {
  user: number;
  post?: number;
  permission_type: PermissionType;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Interfaces for Reports
export interface ActivityStat {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  totalParticipants: number;
  averageParticipation: number;
}

export interface MemberStat {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembers: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    fill?: boolean;
    borderWidth?: number;
  }>;
}

export interface ReportData {
  memberStats: MemberStat;
  activityStats: ActivityStat;
  activityByMonth: ChartData;
  participationByMonth: ChartData;
  activityTypeDistribution: ChartData;
  memberParticipationRate: ChartData;
}

// RolePermission types
export interface RolePermission {
  id: number;
  role: UserRole;
  permission: Permission;
  created_at: string;
  granted_by: User;
}

// Dashboard stats interface
export interface DashboardStats {
  totalUsers: number;
  totalActivities: number;
  totalPosts: number;
  registrations: number;
}

// Member Book interfaces
export interface MemberActivity {
  id: number;
  title: string;
  date: string;
  type: string;
  status: string;
  points: number;
}

export interface MemberAchievement {
  id: number;
  title: string;
  date: string;
  description: string;
}

export interface QuarterFeeStatus {
  quarter: number;
  paid: boolean;
  date_paid?: string;
}

export interface YearFeeStatus {
  year: number;
  quarters: QuarterFeeStatus[];
}

export interface MemberStats {
  total_activities: number;
  total_points: number;
  attendance_rate: number;
  rank: string;
}

export interface MemberData {
  id: number;
  full_name: string;
  avatar?: string;
  student_id: string;
  department: string;
  position: string;
  date_joined: string;
  member_since: string;
  activities: MemberActivity[];
  achievements: MemberAchievement[];
  union_fee_status: YearFeeStatus[];
  stats: MemberStats;
} 