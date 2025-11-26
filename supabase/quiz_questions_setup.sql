-- =====================================================
-- クイズ問題自動生成機能のセットアップ
-- =====================================================

-- 1. quiz_sessionsテーブルにquestionsカラムを追加
ALTER TABLE quiz_sessions 
ADD COLUMN IF NOT EXISTS questions JSONB,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('初級', '中級', '上級'));

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_team_id ON quiz_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_questions ON quiz_sessions USING GIN (questions);

-- =====================================================
-- 2. クイズ問題を生成する関数
-- =====================================================

CREATE OR REPLACE FUNCTION generate_quiz_questions(
  p_session_id UUID,
  p_difficulty TEXT DEFAULT '中級',
  p_question_count INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  v_questions JSONB := '[]'::JSONB;
  v_quiz_words RECORD;
  v_all_words RECORD;
  v_all_meanings TEXT[];
  v_question JSONB;
  v_correct_answer TEXT;
  v_wrong_answers TEXT[];
  v_all_answers TEXT[];
  v_correct_index INTEGER;
  v_word_count INTEGER;
BEGIN
  -- クイズ用の単語を取得（指定された難易度）
  FOR v_quiz_words IN 
    SELECT id, word, meaning_japanese, example_sentence
    FROM words
    WHERE difficulty_level = p_difficulty
    ORDER BY RANDOM()
    LIMIT p_question_count
  LOOP
    -- 選択肢生成用に追加の単語を取得
    SELECT COALESCE(ARRAY_AGG(meaning_japanese), ARRAY[]::TEXT[]) INTO v_all_meanings
    FROM (
      SELECT meaning_japanese
      FROM words
      WHERE difficulty_level = p_difficulty
        AND meaning_japanese != v_quiz_words.meaning_japanese
      ORDER BY RANDOM()
      LIMIT 20
    ) sub;
    
    -- 正解の意味
    v_correct_answer := v_quiz_words.meaning_japanese;
    
    -- 誤答候補から3つを選択（v_all_meaningsがNULLまたは空の場合の処理）
    IF v_all_meanings IS NULL OR array_length(v_all_meanings, 1) IS NULL THEN
      v_all_meanings := ARRAY[]::TEXT[];
    END IF;
    
    -- 誤答候補から3つを選択
    v_wrong_answers := ARRAY(
      SELECT meaning
      FROM unnest(v_all_meanings) AS meaning
      WHERE meaning != v_correct_answer
      ORDER BY RANDOM()
      LIMIT 3
    );
    
    -- v_wrong_answersがNULLの場合の処理
    IF v_wrong_answers IS NULL THEN
      v_wrong_answers := ARRAY[]::TEXT[];
    END IF;
    
    -- 選択肢が3つ未満の場合は、正解を複数回追加（フォールバック）
    WHILE array_length(v_wrong_answers, 1) < 3 LOOP
      v_wrong_answers := array_append(v_wrong_answers, v_correct_answer);
    END LOOP;
    
    -- 選択肢をシャッフル（正解 + 誤答3つ）
    v_all_answers := ARRAY[v_correct_answer] || v_wrong_answers;
    v_all_answers := ARRAY(
      SELECT unnest(v_all_answers)
      ORDER BY RANDOM()
    );
    
    -- 正解のインデックスを取得
    v_correct_index := array_position(v_all_answers, v_correct_answer) - 1;
    
    -- 問題をJSONB形式で作成
    v_question := jsonb_build_object(
      'word', v_quiz_words.word,
      'wordId', v_quiz_words.id::TEXT,
      'example', COALESCE(v_quiz_words.example_sentence, '"' || v_quiz_words.word || '"'),
      'answers', to_jsonb(v_all_answers),
      'correctIndex', v_correct_index
    );
    
    -- 問題を配列に追加
    v_questions := v_questions || jsonb_build_array(v_question);
  END LOOP;
  
  RETURN v_questions;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. セッション作成時に自動的に問題を生成するトリガー
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_quiz_questions()
RETURNS TRIGGER AS $$
DECLARE
  v_difficulty TEXT;
  v_team_level TEXT;
BEGIN
  -- セッションに問題が既にある場合はスキップ
  IF NEW.questions IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- 難易度を決定
  -- 1. セッションにdifficulty_levelが設定されている場合
  IF NEW.difficulty_level IS NOT NULL THEN
    v_difficulty := NEW.difficulty_level;
  -- 2. チームのlevelから取得
  ELSIF NEW.team_id IS NOT NULL THEN
    SELECT level INTO v_team_level
    FROM teams
    WHERE id = NEW.team_id;
    
    IF v_team_level IS NOT NULL THEN
      v_difficulty := v_team_level;
    ELSE
      v_difficulty := '中級'; -- デフォルト
    END IF;
  -- 3. デフォルトは中級
  ELSE
    v_difficulty := '中級';
  END IF;
  
  -- 問題を生成して保存
  BEGIN
    NEW.questions := generate_quiz_questions(NEW.id, v_difficulty, 10);
    NEW.difficulty_level := v_difficulty;
    
    -- 問題が生成されなかった場合のチェック
    IF NEW.questions IS NULL OR jsonb_array_length(NEW.questions) = 0 THEN
      RAISE WARNING '問題の生成に失敗しました（難易度: %, セッションID: %）', v_difficulty, NEW.id;
      -- 空の配列を設定（エラーを防ぐため）
      NEW.questions := '[]'::JSONB;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '問題生成中にエラーが発生しました: %', SQLERRM;
      NEW.questions := '[]'::JSONB;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成（INSERTの前に実行）
DROP TRIGGER IF EXISTS trigger_auto_generate_quiz_questions ON quiz_sessions;
CREATE TRIGGER trigger_auto_generate_quiz_questions
  BEFORE INSERT ON quiz_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_quiz_questions();

-- =====================================================
-- 4. 既存セッションに問題を生成する関数（手動実行用）
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_questions(
  p_session_id UUID,
  p_difficulty TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_difficulty TEXT;
  v_team_level TEXT;
  v_questions JSONB;
BEGIN
  -- 難易度を決定
  IF p_difficulty IS NOT NULL THEN
    v_difficulty := p_difficulty;
  ELSE
    -- セッションの難易度を取得
    SELECT difficulty_level, team_id INTO v_difficulty, v_team_level
    FROM quiz_sessions
    WHERE id = p_session_id;
    
    -- セッションに難易度がない場合は、チームのlevelから取得
    IF v_difficulty IS NULL AND v_team_level IS NOT NULL THEN
      SELECT level INTO v_difficulty
      FROM teams
      WHERE id = v_team_level;
    END IF;
    
    -- デフォルトは中級
    IF v_difficulty IS NULL THEN
      v_difficulty := '中級';
    END IF;
  END IF;
  
  -- 問題を生成
  v_questions := generate_quiz_questions(p_session_id, v_difficulty, 10);
  
  -- セッションを更新
  UPDATE quiz_sessions
  SET questions = v_questions,
      difficulty_level = v_difficulty
  WHERE id = p_session_id;
  
  RAISE NOTICE 'セッション % に問題を生成しました（難易度: %）', p_session_id, v_difficulty;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 使用方法
-- =====================================================

-- 例1: 新しいセッションを作成すると自動的に問題が生成される
-- INSERT INTO quiz_sessions (team_id) VALUES ('チームID');

-- 例2: 既存セッションに問題を生成（手動実行）
-- SELECT update_session_questions('セッションID', '中級');

-- 例3: セッションから問題を取得
-- SELECT questions FROM quiz_sessions WHERE id = 'セッションID';

