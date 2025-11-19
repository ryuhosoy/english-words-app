import { Database } from './database.types';
import { supabase } from './supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type QuizAttempt = Database['public']['Tables']['quiz_attempts']['Insert'];

// ユーザープロフィール取得
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// プロフィール更新
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// トップランキング取得
export async function getTopRankings(limit: number = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, total_score, level, avatar_url')
    .order('total_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// 週間ランキング取得
export async function getWeeklyRankings(limit: number = 10) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('quiz_attempts')
    .select(`
      user_id,
      profiles!inner(username, display_name, avatar_url),
      score
    `)
    .gte('completed_at', oneWeekAgo.toISOString())
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// クイズ結果を保存
export async function saveQuizAttempt(
  attempt: QuizAttempt, 
  isWin: boolean = false,
  wordsLearned: number = 0
) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert(attempt)
    .select()
    .single();

  if (error) throw error;

  // プロフィールの統計情報を更新
  await updateProfileAfterQuiz(attempt.user_id, attempt.score, isWin, wordsLearned);

  return data;
}

// クイズ後のプロフィール更新
async function updateProfileAfterQuiz(
  userId: string, 
  scoreGained: number, 
  isWin: boolean = false,
  wordsLearned: number = 0
) {
  const profile = await getProfile(userId);
  
  const newTotalScore = profile.total_score + scoreGained;
  const newGamesPlayed = profile.games_played + 1;
  const newExperience = profile.experience + scoreGained;
  const newLevel = Math.floor(newExperience / 500) + 1;
  
  // 勝率の計算
  const currentWins = Math.round((profile.win_rate * profile.games_played) / 100);
  const newWins = isWin ? currentWins + 1 : currentWins;
  const newWinRate = newGamesPlayed > 0 ? Math.round((newWins / newGamesPlayed) * 100 * 100) / 100 : 0;
  
  // 連続日数の更新（クイズ履歴から最後にプレイした日を取得）
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 最後にプレイした日を取得
  const { data: lastAttempt } = await supabase
    .from('quiz_attempts')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(2);
  
  let newStreakDays = 1;
  
  if (lastAttempt && lastAttempt.length > 0) {
    // 最後にプレイした日（今日のクイズを除く）
    const lastPlayDate = lastAttempt.length > 1 
      ? new Date(lastAttempt[1].completed_at)
      : new Date(lastAttempt[0].completed_at);
    lastPlayDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - lastPlayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // 同じ日に複数回プレイした場合、連続日数はそのまま
      newStreakDays = profile.streak_days > 0 ? profile.streak_days : 1;
    } else if (daysDiff === 1) {
      // 前日なら連続日数を増やす
      newStreakDays = profile.streak_days + 1;
    } else {
      // 2日以上空いたらリセット
      newStreakDays = 1;
    }
  } else {
    // 初回プレイ
    newStreakDays = 1;
  }
  
  // 学習単語数の更新
  const newTotalWordsLearned = profile.total_words_learned + wordsLearned;

  await updateProfile(userId, {
    total_score: newTotalScore,
    games_played: newGamesPlayed,
    experience: newExperience,
    level: newLevel,
    win_rate: newWinRate,
    streak_days: newStreakDays,
    total_words_learned: newTotalWordsLearned,
  });
}

// ユーザーの最近のゲーム取得
export async function getRecentGames(userId: string, limit: number = 5) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ユーザーの実績取得
export async function getUserAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}

// 単語リスト取得
export async function getWords(difficulty?: string, limit: number = 10) {
  let query = supabase
    .from('words')
    .select('*');

  if (difficulty) {
    query = query.eq('difficulty_level', difficulty);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ランダムな単語を取得
export async function getRandomWords(count: number = 10, difficulty?: string) {
  let query = supabase
    .from('words')
    .select('*');

  if (difficulty) {
    query = query.eq('difficulty_level', difficulty);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // ランダムにシャッフル
  const shuffled = data.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// チーム一覧取得
export async function getAvailableTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// チーム作成
export async function createTeam(name: string, level: string, userId: string) {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, level, created_by: userId })
    .select()
    .single();

  if (teamError) throw teamError;

  // 作成者をチームメンバーに追加
  // usernameは自動的にトリガーで設定される
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId, is_ready: true });

  if (memberError) throw memberError;

  return team;
}

// チームに参加
export async function joinTeam(teamId: string, userId: string) {
  // usernameは自動的にトリガーで設定される
  const { data, error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// チームメンバー取得（JOINなし！）
export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')  // ← usernameも含まれている！
    .eq('team_id', teamId);

  if (error) throw error;
  return data;
}

// リアルタイムランキング購読
export function subscribeToQuizSession(sessionId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`quiz_session_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_session_participants',
        filter: `session_id=eq.${sessionId}`,
      },
      callback
    )
    .subscribe();
}

