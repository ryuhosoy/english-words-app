import { supabase } from './supabase';

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

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // 1. 参加可能なチームを探す（メンバーが4人未満）
      const { data: allTeams, error: searchError } = await supabase
        .from('teams')
        .select(`
          *,
          team_members (user_id)
        `)
        .eq('level', level)
        .order('created_at', { ascending: false });

      if (searchError) {
        console.error('❌ [Matching] チーム検索エラー:', searchError);
        throw searchError;
      }

      // クライアント側でメンバー数が4人未満のチームをフィルタリング
      const availableTeams = allTeams?.filter((team: any) => {
        const memberCount = team.team_members?.length || 0;
        return memberCount < 4;
      }).slice(0, 1); // 最初の1つのみ取得

      // 参加可能なチームがある場合
      if (availableTeams && availableTeams.length > 0) {
        const team = availableTeams[0];
        console.log(`✅ [Matching] 既存チームに参加を試行: ${team.name} (試行${retryCount + 1}回目)`);

        // 既に参加しているかチェック
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
          .eq('user_id', userId)
          .single();

        if (existingMember) {
          console.log('✅ [Matching] 既にチームに参加済み:', team.name);
          return team;
        }

        // チームに参加を試みる
        const { error: joinError } = await supabase
          .from('team_members')
          .insert({
            team_id: team.id,
            user_id: userId,
            is_ready: true,
          });

        if (joinError) {
          // トリガーによる満員エラー（5人目を防ぐ）
          if (joinError.message.includes('Team is full') || 
              joinError.message.includes('満員')) {
            console.log(`⚠️ [Matching] チーム満員（${retryCount + 1}回目）、別のチームを探します...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms待機
            continue; // 再試行
          }
          
          // 重複エラー（念のため）
          if (joinError.code === '23505') {
            console.log('✅ [Matching] 既にチームに参加済み（重複検出）:', team.name);
            return team;
          }
          
          // その他のエラー
          console.error('❌ [Matching] チーム参加エラー:', joinError);
          throw joinError;
        }

        // 成功
        console.log('✅ [Matching] チーム参加成功:', team.name);
        return team;
      }

      // 2. 参加可能なチームがない場合、新しいチームを作成
      console.log('🆕 [Matching] 新しいチームを作成');
      
      const teamName = `チーム ${Math.floor(Math.random() * 1000)}`;
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          level,
          created_by: userId,
          max_members: 4,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [Matching] チーム作成エラー:', createError);
        throw createError;
      }

      // 作成者を最初のメンバーとして追加
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: userId,
          is_ready: true,
        });

      if (memberError) {
        console.error('❌ [Matching] メンバー追加エラー:', memberError);
        throw memberError;
      }

      console.log('✅ [Matching] 新チーム作成完了:', newTeam.name);
      return newTeam;

    } catch (error) {
      // 最大リトライ回数に達した場合
      if (retryCount >= maxRetries - 1) {
        console.error('❌ [Matching] 最大リトライ回数に到達');
        throw error;
      }
      
      // その他のエラーは即座に投げる
      throw error;
    }
  }

  // ここには到達しないはずだが、念のため
  throw new Error('マッチングに失敗しました');
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

