export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          total_score: number
          level: number
          experience: number
          win_rate: number
          games_played: number
          streak_days: number
          total_words_learned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          total_score?: number
          level?: number
          experience?: number
          win_rate?: number
          games_played?: number
          streak_days?: number
          total_words_learned?: number
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          total_score?: number
          level?: number
          experience?: number
          win_rate?: number
          games_played?: number
          streak_days?: number
          total_words_learned?: number
        }
      }
      words: {
        Row: {
          id: string
          word: string
          meaning_japanese: string
          example_sentence: string | null
          difficulty_level: string
          created_at: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          score: number
          correct_answers: number
          total_questions: number
          accuracy: number
          mode: string
          completed_at: string
        }
        Insert: {
          user_id: string
          score: number
          correct_answers: number
          total_questions: number
          accuracy: number
          mode: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          requirement_type: string
          requirement_value: number
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          level: string
          icon: string | null
          max_members: number
          created_by: string
          created_at: string
        }
        Insert: {
          name: string
          level: string
          icon?: string | null
          max_members?: number
          created_by: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          is_ready: boolean
          joined_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          username?: string  // トリガーで自動設定
          display_name?: string | null
          avatar_url?: string | null
          is_ready?: boolean
        }
      }
    }
  }
}

