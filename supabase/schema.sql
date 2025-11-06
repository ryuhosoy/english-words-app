-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  total_words_learned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 単語テーブル
CREATE TABLE words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL,
  meaning_japanese TEXT NOT NULL,
  example_sentence TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('初級', '中級', '上級')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クイズ履歴テーブル
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy DECIMAL(5,2),
  mode TEXT CHECK (mode IN ('ソロ', 'チーム')),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 実績テーブル
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT,
  requirement_value INTEGER
);

-- ユーザー実績テーブル
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- チームテーブル
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('初級', '中級', '上級')),
  icon TEXT,
  max_members INTEGER DEFAULT 4,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- チームメンバーテーブル
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- リアルタイムクイズセッションテーブル
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  current_question INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- クイズセッション参加者テーブル
CREATE TABLE quiz_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  current_rank INTEGER,
  UNIQUE(session_id, user_id)
);

-- Row Level Security (RLS) の設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_session_participants ENABLE ROW LEVEL SECURITY;

-- プロフィールのRLSポリシー
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles FOR SELECT USING (true);
CREATE POLICY "自分のプロフィールのみ更新可能" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "プロフィールは認証時に作成" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- クイズ履歴のRLSポリシー
CREATE POLICY "自分のクイズ履歴のみ閲覧可能" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のクイズ履歴のみ作成可能" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- チームのRLSポリシー
CREATE POLICY "チームは誰でも閲覧可能" ON teams FOR SELECT USING (true);
CREATE POLICY "認証ユーザーはチーム作成可能" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);

-- インデックスの作成
CREATE INDEX idx_profiles_total_score ON profiles(total_score DESC);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- 関数: プロフィール作成時のトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- サンプルデータ: 実績
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
  ('初勝利', '初めての勝利を達成', '🏆', 'wins', 1),
  ('スピードマスター', '10秒以内に5問正解', '⚡', 'speed_answers', 5),
  ('連勝記録', '10連勝を達成', '🔥', 'win_streak', 10),
  ('単語コレクター', '500単語を学習', '📚', 'words_learned', 500),
  ('チームプレイヤー', '20回のチームプレイ', '👥', 'team_games', 20),
  ('パーフェクト', '全問正解を3回達成', '💎', 'perfect_games', 3);

-- サンプルデータ: 単語
INSERT INTO words (word, meaning_japanese, example_sentence, difficulty_level) VALUES
  ('Brilliant', '素晴らしい', 'She had a brilliant idea!', '初級'),
  ('Ancient', '古代の', 'The ancient temple was beautiful.', '中級'),
  ('Swift', '速い', 'The swift runner won the race.', '初級'),
  ('Courageous', '勇敢な', 'The courageous hero saved the day.', '中級'),
  ('Challenge', '挑戦', 'This is a difficult challenge.', '初級'),
  ('Discover', '発見する', 'Columbus discovered America.', '中級'),
  ('Adventure', '冒険', 'They went on an amazing adventure.', '初級'),
  ('Magnificent', '壮大な', 'The view was magnificent.', '上級');

-- =====================================================
-- リアルタイム機能の設定
-- =====================================================

-- リアルタイムを有効化するテーブル
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_session_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- リアルタイムレプリケーションを有効化
ALTER TABLE quiz_session_participants REPLICA IDENTITY FULL;
ALTER TABLE team_members REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- =====================================================
-- リアルタイム用の追加設定
-- =====================================================

-- クイズセッションのスコア更新関数
CREATE OR REPLACE FUNCTION update_session_score(
  p_session_id UUID,
  p_user_id UUID,
  p_score INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO quiz_session_participants (session_id, user_id, score, current_rank)
  VALUES (p_session_id, p_user_id, p_score, 0)
  ON CONFLICT (session_id, user_id)
  DO UPDATE SET 
    score = p_score,
    current_rank = (
      SELECT COUNT(*) + 1 
      FROM quiz_session_participants 
      WHERE session_id = p_session_id 
      AND score > p_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- チームメンバーの準備状態更新関数
CREATE OR REPLACE FUNCTION toggle_member_ready(
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE team_members
  SET is_ready = NOT is_ready
  WHERE team_id = p_team_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

