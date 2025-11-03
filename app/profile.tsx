import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WordsIcon from '../assets/images/container-10.svg';
import StreakIcon from '../assets/images/container-2.svg';
import TrophyIcon from '../assets/images/container-23.svg';
import WinRateIcon from '../assets/images/container-24.svg';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';

const profileStats = [
  { IconComponent: TrophyIcon, value: '1850', label: '総合スコア' },
  { IconComponent: WinRateIcon, value: '75%', label: '勝率' },
  { IconComponent: StreakIcon, value: '12', label: '連続日数' },
  { IconComponent: WordsIcon, value: '856', label: '学習単語数' },
];

const achievements = [
  { emoji: '🏆', label: '初勝利', unlocked: true },
  { emoji: '⚡', label: 'スピードマスター', unlocked: true },
  { emoji: '🔥', label: '連勝記録', unlocked: true },
  { emoji: '📚', label: '単語コレクター', unlocked: true },
  { emoji: '👥', label: 'チームプレイヤー', unlocked: false },
  { emoji: '💎', label: 'パーフェクト', unlocked: false },
];

const recentGames = [
  { date: '10/29', type: 'チーム', points: '450pt', rank: '#1', icon: '🏆' },
  { date: '10/28', type: 'ソロ', points: '380pt', rank: '#2', icon: '🥈' },
  { date: '10/27', type: 'チーム', points: '520pt', rank: '#1', icon: '🏆' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#ad46ff', '#4f39f6']} style={styles.headerGradient}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.profileHeader}>
            <Avatar initial="T" size={64} backgroundColor="#ffffff" textColor="#980ffa" borderColor="#ffffff" borderWidth={4} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Takeshi</Text>
              <Text style={styles.profileLevel}>レベル 15</Text>
            </View>
          </View>

          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>次のレベルまで</Text>
              <Text style={styles.progressValue}>350 XP</Text>
            </View>
            <ProgressBar progress={87.5} height={6} />
            <Text style={styles.progressDetails}>2450 / 2800 XP</Text>
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
              <Text style={styles.achievementCount}>4/6 解除</Text>
            </View>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View key={index} style={[styles.achievementItem, achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked]}>
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                  <Text style={styles.achievementLabel}>{achievement.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>最近のゲーム</Text>
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
          </Card>

          <Button title="設定" onPress={() => {}} variant="outline" style={styles.settingsButton} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafb' },
  headerGradient: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 70, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { width: 32, height: 32, marginBottom: 12 },
  backIcon: { fontSize: 24, color: '#ffffff' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  profileInfo: { gap: 3 },
  profileName: { fontSize: 24, color: '#ffffff', fontWeight: '500', letterSpacing: 0.07 },
  profileLevel: { fontSize: 16, color: '#daeafe', fontWeight: '400', letterSpacing: -0.31 },
  progressCard: { backgroundColor: '#ffffff33', gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 14, color: '#ffffff', letterSpacing: -0.15 },
  progressValue: { fontSize: 14, color: '#ffffff', letterSpacing: -0.15 },
  progressDetails: { fontSize: 12, color: '#daeafe' },
  content: { padding: 20, marginTop: -50, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrapper: { width: 32, height: 32 },
  statValue: { fontSize: 24, color: '#0e162b', fontWeight: '400', letterSpacing: 0.07 },
  statLabel: { fontSize: 12, color: '#45556c' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: '#0e162b', fontWeight: '400', letterSpacing: -0.44, marginBottom: 20 },
  achievementCount: { fontSize: 14, color: '#45556c', letterSpacing: -0.15 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementItem: { width: '30%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12 },
  achievementUnlocked: { backgroundColor: '#fef9c2', borderWidth: 2, borderColor: '#ffdf20' },
  achievementLocked: { backgroundColor: '#f1f5f9', opacity: 0.5 },
  achievementEmoji: { fontSize: 30 },
  achievementLabel: { fontSize: 12, color: '#314157', textAlign: 'center' },
  gamesList: { gap: 10 },
  gameItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafb', padding: 10, borderRadius: 14 },
  gameLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameIcon: { fontSize: 28 },
  gameDate: { fontSize: 14, color: '#0e162b', letterSpacing: -0.15 },
  gameType: { fontSize: 12, color: '#61738d' },
  gameRight: { alignItems: 'flex-end' },
  gamePoints: { fontSize: 14, color: '#0e162b', letterSpacing: -0.15 },
  gameRank: { fontSize: 12, color: '#61738d' },
  settingsButton: { backgroundColor: '#ffffff', borderColor: '#0000001a', borderWidth: 1, height: 38 },
});

