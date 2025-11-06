import { supabase } from './supabase';

export interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatar: string;
  isYou: boolean;
}

// クイズセッションを作成
export async function createQuizSession() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({ id: sessionId })
    .select()
    .single();

  if (error) {
    console.error('❌ セッション作成エラー:', error);
    throw error;
  }

  console.log('✅ クイズセッション作成:', sessionId);
  return data;
}

// セッションにプレイヤーを追加
export async function joinQuizSession(sessionId: string, userId: string, userName: string) {
  const { data, error } = await supabase
    .from('quiz_session_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      score: 0,
      current_rank: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ セッション参加エラー:', error);
    throw error;
  }

  console.log('✅ セッション参加:', userName);
  return data;
}

// スコアを更新（リアルタイムで他のプレイヤーに反映される）
export async function updateQuizScore(sessionId: string, userId: string, score: number) {
  const { error } = await supabase.rpc('update_session_score', {
    p_session_id: sessionId,
    p_user_id: userId,
    p_score: score,
  });

  if (error) {
    console.error('❌ スコア更新エラー:', error);
    throw error;
  }

  console.log('📈 スコア更新:', score);
}

// セッションの全プレイヤーを取得
export async function getSessionPlayers(sessionId: string): Promise<QuizPlayer[]> {
  const { data, error } = await supabase
    .from('quiz_session_participants')
    .select(`
      user_id,
      score,
      current_rank,
      profiles (username, display_name)
    `)
    .eq('session_id', sessionId)
    .order('score', { ascending: false });

  if (error) {
    console.error('❌ プレイヤー取得エラー:', error);
    return [];
  }

  return data.map((p: any, index) => ({
    id: p.user_id,
    name: p.profiles?.display_name || p.profiles?.username || 'プレイヤー',
    score: p.score,
    rank: index + 1,
    avatar: (p.profiles?.username || 'P')[0],
    isYou: false, // 後で設定
  }));
}

// リアルタイムでセッションのスコア変更を購読
export function subscribeToSessionUpdates(
  sessionId: string,
  onUpdate: (players: QuizPlayer[]) => void
) {
  console.log('👂 リアルタイム購読開始:', sessionId);

  const channel = supabase
    .channel(`quiz_session_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_session_participants',
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        console.log('🔄 リアルタイム更新受信:', payload);
        
        // 最新のプレイヤーリストを取得
        const players = await getSessionPlayers(sessionId);
        onUpdate(players);
      }
    )
    .subscribe((status) => {
      console.log('📡 購読状態:', status);
    });

  return channel;
}

// チームメンバーの準備状態を切り替え
export async function toggleMemberReady(teamId: string, userId: string) {
  const { error } = await supabase.rpc('toggle_member_ready', {
    p_team_id: teamId,
    p_user_id: userId,
  });

  if (error) {
    console.error('❌ 準備状態更新エラー:', error);
    throw error;
  }

  console.log('✅ 準備状態更新');
}

// チームメンバーのリアルタイム購読（最適化版）
export function subscribeToTeamUpdates(
  teamId: string,
  onUpdate: (members: any[]) => void
) {
  console.log('👂 チーム購読開始:', teamId);

  const channel = supabase
    .channel(`team_${teamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${teamId}`,
      },
      async (payload) => {
        console.log('🔄 チームメンバー更新 - イベント:', payload.eventType);
        console.log('📦 受信データ:', payload.new);
        
        // 最適化: usernameがテーブルに含まれているので、JOINせずに直接取得！
        const { data } = await supabase
          .from('team_members')
          .select('*')  // ← JOINなし！team_membersだけでOK
          .eq('team_id', teamId);

        if (data) {
          console.log('✅ メンバーリスト更新（JOINなし）:', data.length, '人');
          onUpdate(data);
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 チーム購読状態:', status);
      
      // 初回データを取得
      if (status === 'SUBSCRIBED') {
        supabase
          .from('team_members')
          .select('*')  // ← JOINなし！usernameも含まれている
          .eq('team_id', teamId)
          .then(({ data }) => {
            if (data) {
              console.log('🎬 初回メンバーリスト取得（JOINなし）:', data.length, '人');
              onUpdate(data);
            }
          });
      }
    });

  return channel;
}

