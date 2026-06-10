// Shared types for the language learning platform

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  preferred_languages: string;
  avatar_url: string;
  consecutive_days: number;
  last_checkin_date: string | null;
  created_at: string;
}

export interface CourseRow {
  id: number;
  title: string;
  language: string;
  level: string;
  description: string;
  cover_color: string;
  estimated_minutes: number;
  lesson_count: number;
}

export interface LessonRow {
  id: number;
  course_id: number;
  title: string;
  type: string;
  content: string;
  sort_order: number;
}

export interface ProgressRow {
  id: number;
  user_id: number;
  course_id: number;
  lesson_id: number;
  module_type: string;
  score: number;
  total: number;
  completed: number;
  updated_at: string;
}

export interface AchievementRow {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
}

export interface UserAchievementRow {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: string;
}

export interface PostRow {
  id: number;
  user_id: number;
  content: string;
  language: string;
  likes_count: number;
  created_at: string;
}

export interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface CourseProgressRow {
  course_id: number;
  title: string;
  language: string;
  level: string;
  lesson_count: number;
  completed_lessons: number;
}

export interface UserStatsRow {
  total_courses: number;
  total_lessons: number;
  completed_lessons: number;
  word_count: number;
  grammar_count: number;
  listening_count: number;
  speaking_count: number;
}

export interface LanguageStatRow {
  language: string;
  lessons: number;
  completed: number;
}

export interface CommunityPostRow extends PostRow {
  username: string;
  commentCount?: number;
}

export interface CommunityCommentRow extends CommentRow {
  username: string;
}