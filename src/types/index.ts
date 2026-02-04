export enum DayTheme {
  NORMAL = 'Normal',
  MONDAY = 'Frase do Devocional',
  WEDNESDAY = 'Música do Dia',
  FRIDAY = 'Vitória da Semana',
  SUNDAY = 'O Que Deus Construiu'
}

export interface DevotionalPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  hasRead: boolean;
  scripture: string;
  lesson: string;
  prayerRequest?: string;
  photo?: string;
  video?: string;
  extraContent?: string;
  theme: DayTheme;
  userRole?: UserRole;
}

export type UserRole = 'user' | 'admin' | 'admin_master';

export interface User {
  id: string;
  name: string;      // nome
  avatar: string;    // avatar_url
  bio?: string;      // bio
  streak: number;    // sequencia_atual
  maxStreak: number; // maior_sequencia
  birthday?: string;
  phone?: string;
  isPhonePublic?: boolean;
  civilStatus?: string;
  congregation?: string;
  role: UserRole;    // user, admin, or admin_master
}

// Feedback System Types
export type FeedbackTriggerType = '7_days' | '30_days' | '90_days' | 'manual';

export interface UserFeedback {
  id: string;
  user_id: string;
  rating: number; // 1-5
  testimonial?: string;
  trigger_type: FeedbackTriggerType;
  created_at: string;
  // Populated from join
  user_name?: string;
  user_avatar?: string;
  user_congregation?: string;
}

export interface FeedbackTracking {
  user_id: string;
  last_feedback_date?: string;
  feedback_count: number;
  dismissed_count: number;
  last_dismissed_date?: string;
  updated_at: string;
}

export interface DailyWord {
  id: string;
  date: string;
  reference: string;
  text: string;
  lesson: string;
  created_at?: string;
}

export interface FeedbackStats {
  averageRating: number;
  totalFeedbacks: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  testimonialCount: number;
  responseRate: number; // Percentage of users who gave feedback
}




















