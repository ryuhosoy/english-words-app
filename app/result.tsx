import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import FirstRankIcon from "../assets/images/container-17.svg";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { getSessionPlayers, QuizPlayer } from "../lib/realtime-helpers";
import { saveQuizAttempt } from "../lib/supabase-helpers";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const hasSavedRef = useRef(false); // 既に保存済みかどうかを追跡
  const isSavingRef = useRef(false); // 現在保存中かどうかを追跡
  const hasLoadedLatestScore = useRef(false); // 最新スコアを既に取得したか
  const [rankingPlayers, setRankingPlayers] = useState<QuizPlayer[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  
  const initialScore = parseInt((params.score as string) || "0");
  const [score, setScore] = useState(initialScore);
  const rawCorrectAnswers = parseInt((params.correctAnswers as string) || "0");
  const totalQuestions = parseInt((params.totalQuestions as string) || "3");
  // 正解数が問題数を超えないように制限
  const correctAnswers = Math.min(rawCorrectAnswers, totalQuestions);
  const sessionId = params.sessionId as string | undefined;
  console.log("mode", params.mode);
  const mode = (params.mode as string) || "ソロ";
  const hasSomeoneCompleted = params.hasSomeoneCompleted === 'true';
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  
  // ランキングを取得し、最新スコアを取得（sessionIdがある場合）
  useEffect(() => {
    const loadRanking = async () => {
      if (sessionId && user && !hasLoadedLatestScore.current) {
        setIsLoadingRanking(true);
        try {
          // 少し待ってから取得（DBの更新が確実に反映されるまで）
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const players = await getSessionPlayers(sessionId);
          // 自分をマーク
          const playersWithYou = players.map(p => ({
            ...p,
            isYou: p.id === user.id,
          }));
          setRankingPlayers(playersWithYou);
          
          // 自分の最新スコアを取得して更新
          const myPlayer = playersWithYou.find(p => p.id === user.id);
          if (myPlayer) {
            if (myPlayer.score !== initialScore) {
              console.log('🔄 [Result] 最新スコアを取得:', myPlayer.score, '(旧スコア:', initialScore, ')');
              setScore(myPlayer.score);
            }
            // スコアが同じでも、取得完了フラグは立てる
            hasLoadedLatestScore.current = true;
          } else {
            // プレイヤーが見つからない場合も、取得完了とみなす
            hasLoadedLatestScore.current = true;
          }
        } catch (error) {
          console.error('❌ ランキング取得エラー:', error);
        } finally {
          setIsLoadingRanking(false);
        }
      }
    };
    
    loadRanking();
  }, [sessionId, user?.id, initialScore]);

  // クイズ結果を保存（最新スコアで1回だけ実行）
  // ソロモードの場合は保存しない（total_scoreに加算しない）
  useEffect(() => {
    const saveResult = async () => {
      // ソロモードの場合は保存しない（total_scoreに加算しない）
      if (mode === "ソロ") {
        console.log('ℹ️ [Result] ソロモードのため、スコアを保存しません（total_scoreに加算しません）');
        return;
      }

      // 既に保存済み、または保存中の場合は何もしない
      if (!user || hasSavedRef.current || isSavingRef.current) {
        if (isSavingRef.current) {
          console.log('⏸️ [Result] 既に保存処理が実行中です');
        }
        return;
      }
      
      // sessionIdがある場合、最新スコアの取得が完了するまで少し待つ
      if (sessionId && !hasLoadedLatestScore.current) {
        console.log('⏳ [Result] 最新スコアの取得完了を待機中...');
        return; // 最新スコアの取得が完了するまで待つ
      }
      
      // 保存開始を即座にマーク（複数回実行を防ぐ）
      isSavingRef.current = true;
      hasSavedRef.current = true;
      
      try {
        
        // チーム戦の場合、勝敗を判定
        let isWin = false;
        let wordsLearned = correctAnswers; // 正解数 = 学習単語数
        
        if (mode === "チーム" && rankingPlayers.length > 0) {
          // スコア順にソート
          const sortedPlayers = [...rankingPlayers].sort((a, b) => b.score - a.score);
          // 1位なら勝利
          const myRank = sortedPlayers.findIndex(p => p.id === user.id) + 1;
          isWin = myRank === 1;
        } else if (mode === "チーム" && sessionId) {
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
          // ソロモードの場合、全問正解で勝利
          isWin = correctAnswers === totalQuestions;
        }
        
        // クイズ結果を保存（最新のスコアを使用）
        // チームモードのみ保存（ソロモードは既にreturnしている）
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
        // エラー時はリセット（リトライ可能にする）
        hasSavedRef.current = false;
        isSavingRef.current = false;
      } finally {
        // 保存処理完了をマーク
        isSavingRef.current = false;
      }
    };
    
    saveResult();
    // 依存配列からscoreを削除（スコア更新による再実行を防ぐ）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, correctAnswers, totalQuestions, sessionId, mode, accuracy, rankingPlayers.length]);

  return (
    <LinearGradient colors={["#f7b100", "#f44900"]} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebration}>
          <Text style={styles.celebrationIcon}>
            {hasSomeoneCompleted && mode === "チーム" ? "🏆" : "🎉"}
          </Text>
          <Text style={styles.title}>
            {hasSomeoneCompleted && mode === "チーム" 
              ? "クイズ終了!" 
              : correctAnswers === totalQuestions 
                ? "全問正解!" 
                : "クイズ完了!"}
          </Text>
          <Text style={styles.subtitle}>
            {hasSomeoneCompleted && mode === "チーム" 
              ? "誰かが全問正解しました!" 
              : "お疲れ様でした!"}
          </Text>
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

        {/* ランキング表示（チームモードの場合） */}
        {mode === "チーム" && rankingPlayers.length > 0 && (
          <Card style={styles.rankingCard}>
            <Text style={styles.rankingTitle}>🏆 最終ランキング</Text>
            <ScrollView style={styles.rankingList} showsVerticalScrollIndicator={false}>
              {rankingPlayers.map((player, index) => {
                const RankIcon = index === 0 ? FirstRankIcon : null;
                const displayRank = player.rank || (index + 1);
                const isYou = player.id === user?.id;
                
                return (
                  <View
                    key={player.id || index}
                    style={[
                      styles.rankingItem,
                      isYou && styles.rankingItemHighlight,
                    ]}
                  >
                    <View style={styles.rankingLeft}>
                      {RankIcon ? (
                        <View style={styles.rankIconWrapper}>
                          <RankIcon width={20} height={20} />
                        </View>
                      ) : (
                        <Text style={[styles.rankingNumber, isYou && styles.rankingNumberHighlight]}>
                          {displayRank}
                        </Text>
                      )}
                      <Avatar
                        initial={player.avatar || player.name?.[0] || 'P'}
                        size={32}
                        backgroundColor={isYou ? "#f0b100" : "#ad46ff"}
                        borderColor={isYou ? "#fdc700" : "#ffffff33"}
                        borderWidth={2}
                      />
                      <Text
                        style={[
                          styles.rankingName,
                          isYou && styles.rankingNameHighlight,
                        ]}
                      >
                        {player.name}
                        {isYou && " (あなた)"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rankingScore,
                        isYou && styles.rankingScoreHighlight,
                      ]}
                    >
                      {player.score ?? 0}pt
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Card>
        )}

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
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20, gap: 20 },
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
  rankingCard: {
    maxHeight: 300,
    gap: 16,
  },
  rankingTitle: {
    fontSize: 18,
    color: "#0e162b",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  rankingList: {
    maxHeight: 240,
  },
  rankingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rankingItemHighlight: {
    backgroundColor: "#fef9c1",
    borderColor: "#fdc700",
    borderWidth: 2,
  },
  rankingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rankIconWrapper: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rankingNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#45556c",
    width: 24,
    textAlign: "center",
  },
  rankingNumberHighlight: {
    color: "#f44900",
  },
  rankingName: {
    fontSize: 16,
    color: "#0e162b",
    fontWeight: "500",
    flex: 1,
  },
  rankingNameHighlight: {
    color: "#f44900",
    fontWeight: "600",
  },
  rankingScore: {
    fontSize: 18,
    fontWeight: "600",
    color: "#155cfb",
  },
  rankingScoreHighlight: {
    color: "#f44900",
  },
});
