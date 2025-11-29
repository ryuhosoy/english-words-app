/**
 * イベントベースのクイズ回答管理
 * サーバー側でスコアを計算することで、クライアントとDBの誤差を防ぐ
 */

import { supabase } from './supabase';

/**
 * 回答を記録する（サーバー側でスコアを自動計算）
 */
export async function recordQuizAnswer(
  sessionId: string,
  userId: string,
  questionIndex: number,
  wordId: string | null,
  isCorrect: boolean
): Promise<{ score: number; correctCount: number }> {
  const { data, error } = await supabase.rpc('record_answer', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_question_index: questionIndex,
    p_word_id: wordId || null,
    p_is_correct: isCorrect,
  });

  if (error) {
    console.error('❌ 回答記録エラー:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('回答記録に失敗しました');
  }

  const result = data[0];
  console.log('📝 回答を記録しました:', {
    questionIndex,
    isCorrect,
    score: result.score,
    correctCount: result.correct_count,
  });

  return {
    score: result.score,
    correctCount: result.correct_count,
  };
}

/**
 * 間違えた場合にすべての回答をリセット
 */
export async function resetQuizAnswers(
  sessionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('reset_answers', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    console.error('❌ 回答リセットエラー:', error);
    throw error;
  }

  console.log('🔄 回答をリセットしました');
}

/**
 * 現在の正解数を取得（DBから）
 */
export async function getCorrectAnswerCount(
  sessionId: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('get_correct_answer_count', {
    p_session_id: sessionId,
    p_user_id: userId,
  });

  if (error) {
    console.error('❌ 正解数取得エラー:', error);
    return 0;
  }

  return data || 0;
}

/**
 * 現在のスコアを取得（DBから）
 */
export async function getCurrentScore(
  sessionId: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('quiz_session_participants')
    .select('score')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('❌ スコア取得エラー:', error);
    return 0;
  }

  return data?.score || 0;
}

/**
 * 回答履歴を取得（デバッグ用）
 */
export async function getAnswerHistory(
  sessionId: string,
  userId: string
): Promise<Array<{
  questionIndex: number;
  isCorrect: boolean;
  answeredAt: string;
}>> {
  const { data, error } = await supabase
    .from('quiz_answer_events')
    .select('question_index, is_correct, answered_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .order('question_index', { ascending: true });

  if (error) {
    console.error('❌ 回答履歴取得エラー:', error);
    return [];
  }

  return (data || []).map((event) => ({
    questionIndex: event.question_index,
    isCorrect: event.is_correct,
    answeredAt: event.answered_at,
  }));
}

