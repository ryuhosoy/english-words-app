import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import WordsIcon from "../assets/images/container-10.svg";
import StreakIcon from "../assets/images/container-2.svg";
import TrophyIcon from "../assets/images/container-23.svg";
import WinRateIcon from "../assets/images/container-24.svg";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../contexts/AuthContext";
import { getProfile, getRecentGames, getUserAchievements } from "../lib/supabase-helpers";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // プロフィール情報を取得
        const profileData = await getProfile(user.id);
        setProfile(profileData);

        // 最近のゲームを取得
        const games = await getRecentGames(user.id, 5);
        setRecentGames(games.map(game => ({
          date: new Date(game.completed_at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
          type: game.mode,
          points: `${game.score}pt`,
          rank: game.accuracy >= 80 ? "#1" : game.accuracy >= 60 ? "#2" : "#3",
          icon: game.accuracy >= 80 ? "🏆" : game.accuracy >= 60 ? "🥈" : "🥉",
        })));

        // 実績を取得
        const userAchievements = await getUserAchievements(user.id);
        setAchievements(userAchievements);
      } catch (error) {
        console.error('❌ プロフィールデータ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  // レベルと経験値の計算
  const currentLevel = profile?.level || 1;
  const currentExp = profile?.experience || 0;
  
  // 5000区切りでの進捗計算
  const expPerLevel = 5000;
  const expInCurrentLevel = currentExp % expPerLevel; // 現在のレベル内での経験値
  const expNeeded = expPerLevel - expInCurrentLevel; // 次のレベルまで必要な経験値
  const expProgressPercent = (expInCurrentLevel / expPerLevel) * 100; // 進捗率
 
  // 統計情報
  const profileStats = [
    { 
      IconComponent: TrophyIcon, 
      value: (profile?.total_score || 0).toLocaleString(), 
      label: "総合スコア" 
    },
    { 
      IconComponent: WinRateIcon, 
      value: `${(profile?.win_rate || 0).toFixed(1)}%`, 
      label: "勝率" 
    },
    { 
      IconComponent: StreakIcon, 
      value: `${profile?.streak_days || 0}`, 
      label: "連続日数" 
    },
    { 
      IconComponent: WordsIcon, 
      value: `${profile?.total_words_learned || 0}`, 
      label: "学習単語数" 
    },
  ];

  const displayName = profile?.display_name || profile?.username || user?.user_metadata?.username || user?.email || 'ユーザー';
  const initial = displayName[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      '本当にログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('エラー', error.message || 'ログアウトに失敗しました');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#ad46ff", "#4f39f6"]}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <Avatar
              initial={initial}
              size={64}
              backgroundColor="#ffffff"
              textColor="#980ffa"
              borderColor="#ffffff"
              borderWidth={4}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileLevel}>レベル {currentLevel}</Text>
            </View>
          </View>

          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>次のレベルまで</Text>
              <Text style={styles.progressValue}>{expNeeded} XP</Text>
            </View>
            <ProgressBar progress={expProgressPercent} height={6} />
            <Text style={styles.progressDetails}>{expInCurrentLevel.toLocaleString()} / 5,000 XP</Text>
          </Card>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => {
              const Icon = stat.IconComponent;
              return (
                <Card key={index} style={styles.statCard}>
                  <View style={styles.iconWrapper}>
                    <Icon width={32} height={32} />
                  </View>
                  <View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </Card>
              );
            })}
          </View>

          <Card>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>実績</Text>
              <Text style={styles.achievementCount}>
                {achievements.length > 0 ? `${achievements.length}個 解除` : '実績なし'}
              </Text>
            </View>
            {achievements.length > 0 ? (
            <View style={styles.achievementsGrid}>
                {achievements.map((achievement: any, index: number) => (
                <View
                    key={achievement.id || index}
                  style={[
                    styles.achievementItem,
                      styles.achievementUnlocked,
                  ]}
                >
                  <Text style={styles.achievementEmoji}>
                      {achievement.achievements?.icon || '🏆'}
                  </Text>
                  <Text style={styles.achievementLabel}>
                      {achievement.achievements?.name || '実績'}
                  </Text>
                </View>
              ))}
            </View>
            ) : (
              <Text style={styles.emptyText}>まだ実績がありません</Text>
            )}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>最近のゲーム</Text>
            {recentGames.length > 0 ? (
            <View style={styles.gamesList}>
              {recentGames.map((game, index) => (
                <View key={index} style={styles.gameItem}>
                  <View style={styles.gameLeft}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                    <View>
                      <Text style={styles.gameDate}>{game.date}</Text>
                      <Text style={styles.gameType}>{game.type}</Text>
                    </View>
                  </View>
                  <View style={styles.gameRight}>
                    <Text style={styles.gamePoints}>{game.points}</Text>
                    <Text style={styles.gameRank}>{game.rank}</Text>
                  </View>
                </View>
              ))}
            </View>
            ) : (
              <Text style={styles.emptyText}>まだゲーム履歴がありません</Text>
            )}
          </Card>

          <Button
            title="ログアウト"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafb" },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { width: 32, height: 32, marginBottom: 12 },
  backIcon: { fontSize: 24, color: "#ffffff" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  profileInfo: { gap: 3 },
  profileName: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "500",
    letterSpacing: 0.07,
  },
  profileLevel: {
    fontSize: 16,
    color: "#daeafe",
    fontWeight: "400",
    letterSpacing: -0.31,
  },
  progressCard: { backgroundColor: "#ffffff33", gap: 6 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 14, color: "#ffffff", letterSpacing: -0.15 },
  progressValue: { fontSize: 14, color: "#ffffff", letterSpacing: -0.15 },
  progressDetails: { fontSize: 12, color: "#daeafe" },
  content: { padding: 20, marginTop: -50, gap: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrapper: { width: 32, height: 32 },
  statValue: {
    fontSize: 24,
    color: "#0e162b",
    fontWeight: "400",
    letterSpacing: 0.07,
  },
  statLabel: { fontSize: 12, color: "#45556c" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0e162b",
    fontWeight: "400",
    letterSpacing: -0.44,
    marginBottom: 20,
  },
  achievementCount: { fontSize: 14, color: "#45556c", letterSpacing: -0.15 },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievementItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  achievementUnlocked: {
    backgroundColor: "#fef9c2",
    borderWidth: 2,
    borderColor: "#ffdf20",
  },
  achievementLocked: { backgroundColor: "#f1f5f9", opacity: 0.5 },
  achievementEmoji: { fontSize: 30 },
  achievementLabel: { fontSize: 12, color: "#314157", textAlign: "center" },
  gamesList: { gap: 10 },
  gameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafb",
    padding: 10,
    borderRadius: 14,
  },
  gameLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  gameIcon: { fontSize: 28 },
  gameDate: { fontSize: 14, color: "#0e162b", letterSpacing: -0.15 },
  gameType: { fontSize: 12, color: "#61738d" },
  gameRight: { alignItems: "flex-end" },
  gamePoints: { fontSize: 14, color: "#0e162b", letterSpacing: -0.15 },
  gameRank: { fontSize: 12, color: "#61738d" },
  settingsButton: {
    backgroundColor: "#ffffff",
    borderColor: "#0000001a",
    borderWidth: 1,
    minHeight: 50,
  },
  settingsButtonText: {
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  logoutButton: {
    backgroundColor: "#ffffff",
    borderColor: "#ff4444",
    borderWidth: 1,
    minHeight: 50,
    marginTop: 8,
  },
  logoutButtonText: {
    color: "#ff4444",
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  emptyText: {
    fontSize: 14,
    color: "#61738d",
    textAlign: "center",
    padding: 20,
  },
});
