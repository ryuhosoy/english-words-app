import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { getSessionPlayers } from "../lib/realtime-helpers";
import { saveQuizAttempt } from "../lib/supabase-helpers";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const hasSavedRef = useRef(false); // 既に保存済みかどうかを追跡
  
  const score = parseInt((params.score as string) || "0");
  const correctAnswers = parseInt((params.correctAnswers as string) || "0");
  const totalQuestions = parseInt((params.totalQuestions as string) || "3");
  const sessionId = params.sessionId as string | undefined;
  const mode = (params.mode as string) || "ソロ";
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  
  // クイズ結果を保存（1回だけ実行）
  useEffect(() => {
    const saveResult = async () => {
      if (!user || hasSavedRef.current) return;
      
      try {
        hasSavedRef.current = true; // 保存開始をマーク
        
        // チーム戦の場合、勝敗を判定
        let isWin = false;
        let wordsLearned = correctAnswers; // 正解数 = 学習単語数
        
        if (mode === "チーム" && sessionId) {
          try {
            const players = await getSessionPlayers(sessionId);
            if (players.length > 0) {
              // スコア順にソート
              const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
              // 1位なら勝利
              const myRank = sortedPlayers.findIndex(p => p.id === user.id) + 1;
              isWin = myRank === 1;
            }
          } catch (error) {
            console.error('❌ プレイヤー取得エラー:', error);
          }
        } else {
          // ソロモードの場合、正解率70%以上で勝利
          isWin = accuracy >= 70;
        }
        
        // クイズ結果を保存
        await saveQuizAttempt({
          user_id: user.id,
          score: score,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          accuracy: accuracy,
          mode: mode as "ソロ" | "チーム",
        }, isWin, wordsLearned);
        
        console.log('✅ クイズ結果を保存しました:', { score, isWin, wordsLearned });
      } catch (error) {
        console.error('❌ クイズ結果保存エラー:', error);
        hasSavedRef.current = false; // エラー時はリセット（リトライ可能にする）
      }
    };
    
    saveResult();
  }, [user, score, correctAnswers, totalQuestions, sessionId, mode, accuracy]);

  return (
    <LinearGradient colors={["#f7b100", "#f44900"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.celebration}>
          <Text style={styles.celebrationIcon}>🎉</Text>
          <Text style={styles.title}>クイズ完了!</Text>
          <Text style={styles.subtitle}>お疲れ様でした!</Text>
        </View>

        <Card style={styles.resultCard}>
          <Text style={styles.scoreLabel}>あなたのスコア</Text>
          <Text style={styles.scoreValue}>{score}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>正解率</Text>
              <Text style={styles.statValue}>{accuracy}%</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>正解数</Text>
              <Text style={styles.statValueBlue}>
                {correctAnswers}/{totalQuestions}
              </Text>
            </View>
          </View>

          <View style={styles.starsSection}>
            <Text style={styles.starsLabel}>獲得した星</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((star) => (
                <Text key={star} style={styles.star}>
                  {correctAnswers >= star * (totalQuestions / 3) ? "⭐" : "☆"}
                </Text>
              ))}
            </View>
          </View>
        </Card>

        <View style={styles.buttonsContainer}>
          <Button
            title="🔄 もう一度プレイ"
            onPress={() => router.push("/quiz")}
            style={styles.playAgainButton}
            textStyle={styles.playAgainButtonText}
          />
          <Button
            title="🏠 ホームに戻る"
            onPress={() => router.push("/home")}
            variant="outline"
            style={styles.homeButton}
            textStyle={styles.homeButtonText}
          />
        </View>

        <Text style={styles.footerText}>
          スコアをシェアして友達に自慢しよう!
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingTop: 80, paddingHorizontal: 20, gap: 20 },
  celebration: { alignItems: "center", gap: 12 },
  celebrationIcon: { fontSize: 120 },
  title: {
    fontSize: 36,
    color: "#ffffff",
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffffe6",
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: -0.44,
  },
  resultCard: {
    gap: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 20,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#45556c",
    textAlign: "center",
    letterSpacing: -0.31,
  },
  scoreValue: {
    fontSize: 60,
    color: "#0e162b",
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.26,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  statItem: { alignItems: "center" },
  statLabel: {
    fontSize: 14,
    color: "#45556c",
    textAlign: "center",
    letterSpacing: -0.15,
  },
  statValue: {
    fontSize: 24,
    color: "#00a63d",
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.07,
  },
  statValueBlue: {
    fontSize: 24,
    color: "#155cfb",
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.07,
  },
  divider: { width: 1, height: 40, backgroundColor: "#e2e8f0" },
  starsSection: { alignItems: "center", gap: 10 },
  starsLabel: {
    fontSize: 14,
    color: "#45556c",
    textAlign: "center",
    letterSpacing: -0.15,
  },
  starsRow: { flexDirection: "row", gap: 8 },
  star: { fontSize: 32 },
  buttonsContainer: { gap: 10 },
  playAgainButton: { backgroundColor: "#ffffff", height: 45 },
  playAgainButtonText: { color: "#f44900", fontSize: 14 },
  homeButton: {
    backgroundColor: "#ffffff33",
    borderColor: "#ffffff4c",
    borderWidth: 1,
    height: 45,
  },
  homeButtonText: { color: "#ffffff", fontSize: 14 },
  footerText: {
    fontSize: 14,
    color: "#ffffffcc",
    textAlign: "center",
    letterSpacing: -0.15,
  },
});
