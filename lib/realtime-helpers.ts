import { supabase } from './supabase';

// 固定チームID（マッチング時に常にこのチームを使用）
const FIXED_TEAM_ID = '2e46dc3f-7d8e-464d-9fdc-1dff411ac4b0';

export interface QuizPlayer {
  id: string;
  name: string;
  score: number;
  rank: number;
  avatar: string;
  isYou: boolean;
}

// マッチングのためのチームを探すか作成（トリガー対応版）
export async function findOrCreateMatchingTeam(
  userId: string,
  username: string,
  level: string = '中級'
) {
  console.log('🔍 [Matching] チーム検索開始 - レベル:', level);

  // 固定チームIDを使用（常に固定チームを使用）
  const fixedTeam = await tryJoinFixedTeam(FIXED_TEAM_ID, userId, level);
  if (fixedTeam) {
    return fixedTeam;
  }
  
  // 固定チームに参加できなかった場合はエラー
  throw new Error('固定チームに参加できませんでした。チームが満員の可能性があります。');

}

async function tryJoinFixedTeam(teamId: string, userId: string, level: string) {
  console.log('🎯 [Matching] 固定チームを優先的に使用します:', teamId);

  // 固定チームを取得（レベルチェックなし）
  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (user_id)
    `)
    .eq('id', teamId)
    .single();

  // 固定チームが存在しない場合は作成
  if (error && error.code === 'PGRST116') {
    console.log('🆕 [Matching] 固定チームが存在しないため作成します');
    const { data: newTeam, error: createError } = await supabase
      .from('teams')
      .insert({
        id: teamId,
        name: '固定マッチングチーム',
        level: level,
        created_by: userId,
        max_members: 4,
      })
      .select(`
        *,
        team_members (user_id)
      `)
      .single();

    if (createError) {
      console.error('❌ [Matching] 固定チーム作成エラー:', createError);
      return null;
    }

    // 作成者を最初のメンバーとして追加
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        is_ready: true,
      });

    if (memberError) {
      console.error('❌ [Matching] 固定チームメンバー追加エラー:', memberError);
      return null;
    }

    console.log('✅ [Matching] 固定チーム作成完了');
    return newTeam;
  }

  if (error) {
    console.error('❌ [Matching] 固定チーム取得エラー:', error);
    return null;
  }

  // まず既に自分がメンバーかどうかをチェック
  const { data: existingMembers, error: existingError } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', userId);

  if (existingError) {
    console.error('❌ [Matching] 固定チーム参加状況確認エラー:', existingError);
    return null;
  }

  // 既にメンバーなら満員でも参加可能
  if (existingMembers && existingMembers.length > 0) {
    console.log('✅ [Matching] 固定チームに既に参加済み（満員でもOK）');
    return team;
  }

  // 新規参加の場合のみ満員チェック
  const memberCount = team.team_members?.length || 0;
  const maxMembers = team.max_members ?? 4;
  if (memberCount >= maxMembers) {
    console.warn('⚠️ [Matching] 固定チームが満員のため参加できません');
    return null;
  }

  // 新規参加
  if (!existingMembers || existingMembers.length === 0) {
    const { error: joinError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        is_ready: true,
      });

    if (joinError) {
      console.error('❌ [Matching] 固定チーム参加エラー:', joinError);
      return null;
    }

    team.team_members = [...(team.team_members || []), { user_id: userId }];
  } else {
    console.log('ℹ️ [Matching] 固定チームに既に参加済みです');
  }

  console.log('✅ [Matching] 固定チーム参加成功:', team.name);
  return team;
}

// チームの既存セッションを探す
export async function findExistingSession(teamId: string) {
  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('team_id', teamId)
    .is('ended_at', null) // 終了していないセッション
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116は「見つからない」エラー
    console.error('❌ セッション検索エラー:', error);
    return null;
  }

  if (data) {
    console.log('✅ 既存セッションを発見:', data.id);
    return data;
  }

  return null;
}

// クイズセッションを作成（既存があればそれを使う）
export async function createQuizSession(teamId?: string) {
  // teamIdが指定されている場合は既存セッションを探す
  if (teamId) {
    const existing = await findExistingSession(teamId);
    if (existing) {
      return existing;
    }
  }

  const sessionData: any = {};
  
  // teamIdが指定されている場合は紐付け
  if (teamId) {
    sessionData.team_id = teamId;
  }
  
  // UUIDはデータベースで自動生成される（idを指定しない）
  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('❌ セッション作成エラー:', error);
    throw error;
  }

  console.log('✅ クイズセッション作成:', data.id);
  return data;
}

// セッションにプレイヤーを追加
export async function joinQuizSession(sessionId: string, userId: string, userName: string) {
  console.log('🎮 [Realtime] joinQuizSession 開始:', sessionId, userId, userName);
  
  // 既に参加しているかチェック
  const { data: existingParticipant } = await supabase
    .from('quiz_session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (existingParticipant) {
    console.log('✅ セッションに既に参加済み:', userName);
    return existingParticipant;
  }

  // 新規参加
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
    // 重複エラー（念のため）
    if (error.code === '23505') {
      console.log('✅ セッションに既に参加済み（重複検出）:', userName);
      // 既存レコードを取得して返す
      const { data: existing } = await supabase
        .from('quiz_session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        return existing;
      }
    }
    
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

// チームメンバーから削除
export async function leaveTeam(teamId: string, userId: string) {
  console.log('🚪 [Matching] チーム離脱:', teamId);
  
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ チーム離脱エラー:', error);
    // エラーが発生してもスローしない（既に削除されている可能性がある）
    return;
  }

  console.log('✅ チーム離脱成功');
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

