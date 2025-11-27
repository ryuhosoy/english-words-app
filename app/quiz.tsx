import type { RealtimeChannel } from "@supabase/supabase-js";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FirstRankIcon from "../assets/images/container-17.svg";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../contexts/AuthContext";
import {
  createQuizSession,
  joinQuizSession,
  QuizPlayer,
  subscribeToSessionUpdates,
  updateQuizScore,
} from "../lib/realtime-helpers";
import { getSessionQuestions } from "../lib/supabase-helpers";

const quizPlayers = [
  {
    rankIcon: FirstRankIcon,
    rank: "1",
    name: "Mei",
    points: "42pt",
    initial: "M",
    highlight: false,
  },
  {
    rankIcon: null,
    rank: "2",
    name: "あなた",
    points: "0pt",
    initial: "Y",
    highlight: true,
  },
  {
    rankIcon: null,
    rank: "3",
    name: "Yuki",
    points: "0pt",
    initial: "Y",
    highlight: false,
  },
];

interface QuizQuestion {
  word: string;
  example: string;
  answers: string[];
  correctIndex: number;
  wordId?: string;
}

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0); // 連続正解数
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [hasSomeoneCompleted, setHasSomeoneCompleted] = useState(false); // 誰かが全問正解したか
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // リアルタイム用の状態
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId as string || null);
  const [teamId] = useState<string | null>(params.teamId as string || null);
  const [realtimePlayers, setRealtimePlayers] = useState<QuizPlayer[]>([]);
  const [useRealtime, setUseRealtime] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasInitializedRef = useRef(false); // 初期化済みかどうかを追跡

  const handleRealtimePlayersUpdate = useCallback((players: QuizPlayer[]) => {
    const normalized = players.map((p) => ({
      ...p,
      isYou: p.id === user?.id,
    }));
    setRealtimePlayers(normalized);

    const yourself = normalized.find((p) => p.isYou);
    if (yourself) {
      // スコアから正解数を逆算（スコア = 正解数 × 100）
      const calculatedCorrectAnswers = Math.floor(yourself.score / 100);
      const calculatedScore = calculatedCorrectAnswers * 100; // ポイント = 正解数 × 100
      
      // スコアと正解数を更新（DBの値と同期）
      setScore(calculatedScore);
      setCorrectAnswers(calculatedCorrectAnswers);
      
      // 連続正解数はリアルタイム更新では変更しない
      // 連続正解数はローカルの状態として管理し、handleAnswer内でのみ更新される
      // これにより、自分の正解時に連続正解数がリセットされることを防ぐ
    }

    // チームモードの場合、誰かが全問正解したかチェック
    if (teamId && quizData.length > 0) {
      const maxScore = quizData.length * 100; // 全問正解のスコア
      const someoneCompleted = normalized.some(p => p.score >= maxScore);
      if (someoneCompleted) {
        setHasSomeoneCompleted(true);
        setIsQuizComplete(true);
      }
    }
  }, [user?.id, teamId, quizData.length]);

  const setupRealtimeSubscription = useCallback((targetSessionId: string) => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const channel = subscribeToSessionUpdates(targetSessionId, handleRealtimePlayersUpdate);
    channelRef.current = channel;
    setUseRealtime(true);
  }, [handleRealtimePlayersUpdate]);

  // セッションから問題を取得
  const loadQuestionsFromSession = useCallback(async (targetSessionId: string) => {
    try {
      setIsLoadingQuestions(true);
      setError(null);
      
      console.log('📝 [Quiz] セッションから問題を取得中:', targetSessionId);
      const questions = await getSessionQuestions(targetSessionId);
      
      if (!questions || questions.length === 0) {
        throw new Error('問題が見つかりませんでした');
      }
      
      setQuizData(questions);
      setIsLoadingQuestions(false);
      console.log('✅ [Quiz] 問題取得完了:', questions.length, '問');
    } catch (err) {
      console.error('❌ [Quiz] 問題取得エラー:', err);
      setError(err instanceof Error ? err.message : '問題の取得に失敗しました');
      setIsLoadingQuestions(false);
    }
  }, []);

  const initializeRealtimeWithExistingSession = useCallback(async (existingSessionId: string) => {
    try {
      console.log('🎮 [Quiz] 既存セッションで初期化:', existingSessionId);
      
      // 既に作成されているセッションに参加
      await joinQuizSession(
        existingSessionId,
        user!.id,
        user!.user_metadata?.username || user!.email || 'あなた'
      );
      
      console.log('joinQuizSession成功 in initializeRealtimeWithExistingSession');
      
      setupRealtimeSubscription(existingSessionId);
      console.log('✅ [Quiz] リアルタイム機能有効化（マッチングモード）');
      
      // セッションから問題を取得
      await loadQuestionsFromSession(existingSessionId);
    } catch (error) {
      console.error('❌ [Quiz] リアルタイム初期化エラー:', error);
      setUseRealtime(false);
      setError('セッションの初期化に失敗しました');
      setIsLoadingQuestions(false);
    }
  }, [setupRealtimeSubscription, user, loadQuestionsFromSession]);

  const initializeRealtimeSession = useCallback(async () => {
    try {
      console.log('🎮 [Quiz] リアルタイムセッション初期化開始（ソロモード）');
      
      const session = await createQuizSession();
      setSessionId(session.id);
      
      await joinQuizSession(
        session.id,
        user!.id,
        user!.user_metadata?.username || user!.email || 'あなた'
      );
      
      setupRealtimeSubscription(session.id);
      
      // セッションから問題を取得（トリガーで自動生成されているはず）
      await loadQuestionsFromSession(session.id);
    } catch (error) {
      console.error('❌ [Quiz] リアルタイム初期化エラー:', error);
      setUseRealtime(false);
      setError('セッションの初期化に失敗しました');
      setIsLoadingQuestions(false);
    }
  }, [setupRealtimeSubscription, user, loadQuestionsFromSession]);

  // リアルタイムセッションの初期化（初回のみ実行）
  useEffect(() => {
    if (!user || hasInitializedRef.current) return;

    hasInitializedRef.current = true; // 初期化開始をマーク

    if (teamId && sessionId) {
      console.log('🎮 [Quiz] マッチングモード - チーム:', teamId);
      initializeRealtimeWithExistingSession(sessionId);
    } else if (!sessionId) {
      console.log('🎮 [Quiz] ソロモード');
      initializeRealtimeSession();
    }

    return () => {
      console.log('🧹 [Quiz] リアルタイムセッション終了');
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // userが存在する場合のみ実行（初期化フラグで重複実行を防止）

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isQuizComplete) {
      handleNextQuestion();
    }
  }, [timeLeft, isQuizComplete]);

  useEffect(() => {
    if (isQuizComplete && quizData.length > 0) {
      // 最終スコアを確実に更新してから結果画面へ遷移
      const navigateToResult = async () => {
        // 正解数が問題数を超えないように制限
        const finalCorrectAnswers = Math.min(consecutiveCorrect, quizData.length);
        // ポイント = 正解数 × 100として計算
        const finalScore = finalCorrectAnswers * 100;
        
        // リアルタイム機能が有効な場合、最終スコアを再度送信して確実に更新
        if (useRealtime && sessionId && user) {
          try {
            console.log('🔄 [Quiz] 結果画面遷移前に最終スコアを再送信:', finalScore, '(正解数:', finalCorrectAnswers, ')');
            await updateQuizScore(sessionId, user.id, finalScore);
            // スコア更新が反映されるまで少し待機
            await new Promise(resolve => setTimeout(resolve, 200));
            console.log('✅ [Quiz] 最終スコア更新完了');
          } catch (error) {
            console.error('❌ [Quiz] 最終スコア再送信エラー:', error);
          }
        }
        
        // 少し遅延させてから結果画面へ（アニメーションとスコア更新の反映待ちのため）
        setTimeout(() => {
          router.push({
            pathname: "/result",
            params: { 
              score: finalScore, 
              correctAnswers: finalCorrectAnswers, // 連続正解数を送る（問題数で制限）
              totalQuestions: quizData.length,
              sessionId: sessionId || '',
              mode: teamId ? 'チーム' : 'ソロ',
              hasSomeoneCompleted: hasSomeoneCompleted ? 'true' : 'false',
            },
          });
        }, 300);
      };
      
      navigateToResult();
    }
  }, [isQuizComplete, score, consecutiveCorrect, sessionId, teamId, quizData.length, hasSomeoneCompleted, useRealtime, user]);

  const handleAnswer = async (selectedIndex: number) => {
    if (quizData.length === 0 || currentQuestion >= quizData.length || isQuizComplete) return;
    
    const isCorrect = selectedIndex === quizData[currentQuestion].correctIndex;
    
    if (isCorrect) {
      // 正解の場合
      // 連続正解数が問題数を超えないように制限
      const newConsecutive = Math.min(consecutiveCorrect + 1, quizData.length);
      const newCorrectAnswers = correctAnswers + 1;
      // ポイントは正解数 × 100として計算
      const newScore = newCorrectAnswers * 100;
      
      setConsecutiveCorrect(newConsecutive);
      setCorrectAnswers(newCorrectAnswers);
      setScore(newScore);
      
      // 全問正解したかチェック（スコア更新の前にチェック）
      const isAllCorrect = newConsecutive >= quizData.length;
      
      // リアルタイム機能が有効な場合、Supabaseに送信
      if (useRealtime && sessionId && user) {
        try {
          await updateQuizScore(sessionId, user.id, newScore);
          console.log('📤 [Quiz] スコア送信:', newScore, '(正解数:', newCorrectAnswers, ')');
          
          // 全問正解の場合は、スコア更新が完了してから少し待ってクイズ完了にする
          // （DBの更新が確実に反映されるまで待つ）
          if (isAllCorrect) {
            console.log('🎉 全問正解！最終スコア更新完了を待機中...');
            // スコア更新が確実に反映されるまで少し待機
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log('✅ 最終スコア更新完了');
          }
        } catch (error) {
          console.error('❌ [Quiz] スコア送信エラー:', error);
        }
      }
      
      // 全問正解した場合
      if (isAllCorrect) {
        console.log('🎉 全問正解！');
        setIsQuizComplete(true);
        return;
      }
      
      // 次の問題へ
      handleNextQuestion();
    } else {
      // 間違えた場合：最初からやり直し + スコアリセット
      console.log('❌ 間違い！最初からやり直し（スコアリセット）');
      const resetCorrectAnswers = 0;
      const resetScore = resetCorrectAnswers * 100; // ポイント = 正解数 × 100
      
      setConsecutiveCorrect(0);
      setCorrectAnswers(resetCorrectAnswers);
      setScore(resetScore);
      setCurrentQuestion(0);
      setTimeLeft(15);
      
      // リアルタイム機能が有効な場合、スコアを0に更新
      if (useRealtime && sessionId && user) {
        try {
          await updateQuizScore(sessionId, user.id, resetScore);
          console.log('📤 [Quiz] スコアリセット送信: 0');
        } catch (error) {
          console.error('❌ [Quiz] スコアリセット送信エラー:', error);
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.length - 1 && !isQuizComplete) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(15);
    }
  };

  const progress = quizData.length > 0 ? ((currentQuestion + 1) / quizData.length) * 100 : 0;
  const fallbackPlayers: QuizPlayer[] = quizPlayers.map((player, index) => ({
    id: `fallback_${index}`,
    name: player.name,
    score: parseInt(player.points?.replace(/\D/g, "") || "0", 10),
    rank: index + 1,
    avatar: (player.initial || player.name[0] || "P").slice(0, 1),
    isYou: player.highlight,
  }));
  const rankingPlayers = (
    useRealtime && realtimePlayers.length > 0 ? realtimePlayers : fallbackPlayers
  ).slice(0, 3);

  // ローディング状態
  if (isLoadingQuestions) {
    return (
      <LinearGradient colors={["#ad46ff", "#4f39f6"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>📚 クイズを準備しています...</Text>
        </View>
      </LinearGradient>
    );
  }

  // エラー状態
  if (error || quizData.length === 0) {
    return (
      <LinearGradient colors={["#ad46ff", "#4f39f6"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>❌ {error || 'クイズデータの読み込みに失敗しました'}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#ad46ff", "#4f39f6"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>⭐ スコア: {score}</Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.questionText}>
            問題 {currentQuestion + 1}/{quizData.length} (連続正解: {Math.min(consecutiveCorrect, quizData.length)}/{quizData.length})
          </Text>
          <Text style={styles.timeText}>⏰ {timeLeft}秒</Text>
        </View>
        <ProgressBar progress={progress} height={6} />
      </View>

      <View style={styles.rankingSection}>
        <View style={styles.rankingHeader}>
          <Text style={styles.rankingLabel}>
            🏆 ランキング {useRealtime && <Text style={styles.liveIndicator}>● LIVE</Text>}
          </Text>
        </View>
        <View style={styles.playersContainer}>
          {rankingPlayers.map((player, index) => {
            const RankIcon = index === 0 ? FirstRankIcon : null;
            const displayRank = player.rank || (index + 1);
            
            return (
              <View
                key={player.id || index}
                style={[
                  styles.playerCard,
                  player.isYou && styles.playerCardHighlight,
                ]}
              >
                {RankIcon ? (
                  <View style={styles.rankIconWrapper}>
                    <RankIcon width={16} height={16} />
                  </View>
                ) : (
                  <Text style={styles.playerRank}>{displayRank}</Text>
                )}
                <Avatar
                  initial={player.avatar || player.name?.[0] || 'P'}
                  size={26}
                  backgroundColor={player.isYou ? "#f0b100" : "#ad46ff"}
                  borderColor={player.isYou ? "#fdc700" : "#ffffff33"}
                  borderWidth={2}
                />
                <Text
                  style={[
                    styles.playerName,
                    player.isYou && styles.playerNameHighlight,
                  ]}
                >
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.playerPoints,
                    player.isYou && styles.playerPointsHighlight,
                  ]}
                >
                  {`${player.score ?? 0}pt`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.quizContent}>
        <Card>
          <Text style={styles.questionLabel}>次の単語の意味は？</Text>
          <Text style={styles.word}>{quizData[currentQuestion].word}</Text>
          <Text style={styles.example}>
            {quizData[currentQuestion].example}
          </Text>
        </Card>
        <View style={styles.answersContainer}>
          {quizData[currentQuestion].answers.map((answer, index) => (
            <TouchableOpacity
              key={index}
              style={styles.answerButton}
              onPress={() => handleAnswer(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.answerText}>{answer}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { backgroundColor: "#ffffff1a", padding: 12, gap: 10 },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreText: { fontSize: 16, color: "#ffffff", letterSpacing: -0.31 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionText: { fontSize: 14, color: "#ffffff", letterSpacing: -0.15 },
  timeText: { fontSize: 14, color: "#ffffff", letterSpacing: -0.15 },
  rankingSection: { backgroundColor: "#ffffff0d", padding: 12, gap: 6 },
  rankingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rankingLabel: { fontSize: 12, color: "#ffffff" },
  liveIndicator: { fontSize: 10, color: "#00ff00", fontWeight: "bold" },
  playersContainer: { flexDirection: "row", gap: 8 },
  playerCard: {
    flex: 1,
    backgroundColor: "#ffffff1a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffffff33",
    padding: 8,
    alignItems: "center",
    gap: 6,
  },
  playerCardHighlight: {
    backgroundColor: "#fdc7004c",
    borderColor: "#fdc700",
    borderWidth: 2,
  },
  rankIconWrapper: { width: 16, height: 16 },
  playerRank: { fontSize: 16 },
  playerName: { fontSize: 12, color: "#ffffff", textAlign: "center" },
  playerNameHighlight: { color: "#fef9c1" },
  playerPoints: { fontSize: 12, color: "#ffffffcc" },
  playerPointsHighlight: { color: "#ffdf20" },
  quizContent: { flex: 1, padding: 20, gap: 20 },
  questionLabel: {
    fontSize: 14,
    color: "#45556c",
    letterSpacing: -0.15,
    marginBottom: 20,
  },
  word: {
    fontSize: 36,
    color: "#0e162b",
    textAlign: "center",
    letterSpacing: 0.37,
    marginBottom: 16,
  },
  example: {
    fontSize: 14,
    color: "#61738d",
    textAlign: "center",
    fontStyle: "italic",
    letterSpacing: -0.15,
  },
  answersContainer: { gap: 10 },
  answerButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  answerText: { fontSize: 16, color: "#0e162b", letterSpacing: -0.31 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
  },
});
