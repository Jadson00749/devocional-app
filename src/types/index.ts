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



















