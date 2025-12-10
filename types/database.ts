export interface User {
  id: string
  email: string
  name?: string
  target_language: 'french' | 'korean'
  partner_id?: string
  created_at: string
  last_active: string
}

export interface VocabularyWord {
  id: string
  english_word: string
  french_translation: string
  korean_translation: string
  difficulty_level: number
}

export interface UserProgress {
  id: string
  user_id: string
  word_id: string
  cycle_id: string
  ease_factor: number
  interval: number
  repetitions: number
  next_review_date: string
  last_reviewed_at?: string
  quality_score?: number
  times_reviewed: number
}

export interface CatState {
  id: string
  couple_id: string
  happiness_level: number
  health_level: number
  last_fed_at?: string
  last_played_at?: string
  current_animation_state: string
  current_streak_days: number
  longest_streak_days: number
}

export interface LearningCycle {
  id: string
  couple_id: string
  cycle_number: number
  start_date: string
  end_date: string
  is_active: boolean
}