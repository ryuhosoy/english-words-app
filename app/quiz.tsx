import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

const quizData = [
  {
    word: "Brilliant",
    example: '"She had a brilliant idea!"',
    answers: ["素晴らしい", "暗い", "大きい", "小さい"],
    correctIndex: 0,
  },
  {
    word: "Ancient",
    example: '"The ancient temple was beautiful."',
    answers: ["新しい", "古代の", "現代の", "未来の"],
    correctIndex: 1,
  },
  {
    word: "Swift",
    example: '"The swift runner won the race."',
    answers: ["遅い", "速い", "弱い", "強い"],
    correctIndex: 1,
  },
  {
    word: "Courageous",
    example: '"The courageous hero saved the day."',
    answers: ["臆病な", "勇敢な", "賢い", "愚かな"],
    correctIndex: 1,
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  
  // リアルタイム用の状態
  const [sessionId, setSessionId] = useState<string | null>(params.sessionId as string || null);
  const [teamId] = useState<string | null>(params.teamId as string || null);
  const [realtimePlayers, setRealtimePlayers] = useState<QuizPlayer[]>([]);
  const [useRealtime, setUseRealtime] = useState(false);

  // リアルタイムセッションの初期化
  useEffect(() => {
    // マッチングから来た場合（teamId, sessionIdがある）または通常モード
    if (user && teamId && sessionId) {
      console.log('🎮 [Quiz] マッチングモード - チーム:', teamId);
      initializeRealtimeWithExistingSession(sessionId);
    } else if (user) {
      console.log('🎮 [Quiz] ソロモード');
      // ソロモードの場合も簡易セッションを作成
      initializeRealtimeSession();
    }
    
    return () => {
      console.log('🧹 [Quiz] リアルタイムセッション終了');
    };
  }, [user, teamId, sessionId]);

  const initializeRealtimeWithExistingSession = async (existingSessionId: string) => {
    try {
      console.log('🎮 [Quiz] 既存セッションで初期化:', existingSessionId);
      
      // 既に作成されているセッションに参加
      await joinQuizSession(
        existingSessionId,
        user!.id,
        user!.user_metadata?.username || user!.email || 'あなた'
      );
      
      // リアルタイム更新を購読
      const channel = subscribeToSessionUpdates(existingSessionId, (players) => {
        console.log('👥 [Quiz] プレイヤー更新:', players.length, '人');
        
        const updatedPlayers = players.map(p => ({
          ...p,
          isYou: p.id === user!.id,
        }));
        
        setRealtimePlayers(updatedPlayers);
      });
      
      setUseRealtime(true);
      console.log('✅ [Quiz] リアルタイム機能有効化（マッチングモード）');
      
      return () => channel.unsubscribe();
    } catch (error) {
      console.error('❌ [Quiz] リアルタイム初期化エラー:', error);
      setUseRealtime(false);
    }
  };

  const initializeRealtimeSession = async () => {
    try {
      console.log('🎮 [Quiz] リアルタイムセッション初期化開始（ソロモード）');
      
      const session = await createQuizSession();
      setSessionId(session.id);
      
      await joinQuizSession(
        session.id,
        user!.id,
        user!.user_metadata?.username || user!.email || 'あなた'
      );
      
      const channel = subscribeToSessionUpdates(session.id, (players) => {
        const updatedPlayers = players.map(p => ({
          ...p,
          isYou: p.id === user!.id,
        }));
        setRealtimePlayers(updatedPlayers);
      });
      
      setUseRealtime(true);
      
      return () => channel.unsubscribe();
    } catch (error) {
      console.error('❌ [Quiz] リアルタイム初期化エラー:', error);
      setUseRealtime(false);
    }
  };

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
    if (isQuizComplete) {
      router.push({
        pathname: "/result",
        params: { score, correctAnswers, totalQuestions: quizData.length },
      });
    }
  }, [isQuizComplete]);

  const handleAnswer = async (selectedIndex: number) => {
    const isCorrect = selectedIndex === quizData[currentQuestion].correctIndex;
    if (isCorrect) {
      const newScore = score + 100;
      setScore(newScore);
      setCorrectAnswers(correctAnswers + 1);
      
      // リアルタイム機能が有効な場合、Supabaseに送信
      if (useRealtime && sessionId && user) {
        try {
          await updateQuizScore(sessionId, user.id, newScore);
          console.log('📤 [Quiz] スコア送信:', newScore);
        } catch (error) {
          console.error('❌ [Quiz] スコア送信エラー:', error);
        }
      }
    }
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(15);
    } else {
      setIsQuizComplete(true);
    }
  };

  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <LinearGradient colors={["#ad46ff", "#4f39f6"]} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>⭐ スコア: {score}</Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.questionText}>
            問題 {currentQuestion + 1}/{quizData.length}
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
          {(useRealtime && realtimePlayers.length > 0 ? realtimePlayers : quizPlayers.map((p, i) => ({
            ...p,
            id: i.toString(),
            isYou: p.highlight,
            score: 0,
            rank: i + 1,
          }))).slice(0, 3).map((player, index) => {
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
                  initial={player.avatar || player.initial || 'P'}
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
                  {useRealtime ? `${player.score}pt` : (player.points || '0pt')}
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
});
