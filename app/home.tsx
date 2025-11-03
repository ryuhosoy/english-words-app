import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FirstPlaceIcon from '../assets/images/container-8.svg';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Card from '../components/Card';

const weeklyRankings = [
  { rankIcon: FirstPlaceIcon, rank: '1', name: 'Yuki', points: '2450pt' },
  { rankIcon: null, rank: '2', name: 'Sakura', points: '2380pt' },
  { rankIcon: null, rank: '3', name: 'Kenji', points: '2210pt' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#ad46ff', '#4f39f6']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Avatar
                initial="T"
                size={38}
                backgroundColor="#ffffff"
                textColor="#980ffa"
                borderColor="#ffffff"
                borderWidth={2}
              />
              <View>
                <Text style={styles.greeting}>こんにちは</Text>
                <Text style={styles.userName}>Takeshiさん</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <View>
                <Text style={styles.scoreLabel}>総合スコア</Text>
                <Text style={styles.scoreValue}>1850</Text>
              </View>
              <Text style={styles.trophyIcon}>🏆</Text>
            </View>
          </Card>
        </LinearGradient>

        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => router.push('/quiz')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ad46ff', '#4f39f6']}
              style={styles.startGameButton}
            >
              <View style={styles.startGameContent}>
                <Text style={styles.gameIcon}>🎮</Text>
                <View>
                  <Text style={styles.startGameTitle}>ゲームを始める</Text>
                  <Text style={styles.startGameSubtitle}>クイズに挑戦</Text>
                </View>
              </View>
              <Text style={styles.arrowIcon}>▶</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Card>
            <View style={styles.rankingHeader}>
              <Text style={styles.sectionTitle}>今週のランキング</Text>
              <Text style={styles.viewAllButton}>すべて見る</Text>
            </View>

            <View style={styles.rankingList}>
              {weeklyRankings.map((player, index) => {
                const RankIcon = player.rankIcon;
                return (
                  <View key={index} style={styles.rankingItem}>
                    <View style={styles.rankingLeft}>
                      {RankIcon ? (
                        <View style={styles.rankIconWrapper}>
                          <RankIcon width={20} height={20} />
                        </View>
                      ) : (
                        <Text style={styles.rankIcon}>{player.rank}</Text>
                      )}
                      <Text style={styles.playerName}>{player.name}</Text>
                    </View>
                    <Text style={styles.playerPoints}>{player.points}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          <LinearGradient
            colors={['#f44900', '#f36b10']}
            style={styles.dailyChallenge}
          >
            <View style={styles.dailyChallengeContent}>
              <View>
                <Text style={styles.dailyChallengeLabel}>デイリーチャレンジ</Text>
                <Text style={styles.dailyChallengeTitle}>50単語マスター</Text>
                <Text style={styles.dailyChallengeReward}>報酬: 100ポイント</Text>
              </View>
              <Button
                title="挑戦"
                onPress={() => router.push('/quiz')}
                style={styles.challengeButton}
                textStyle={styles.challengeButtonText}
              />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 70,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.15,
  },
  userName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.44,
  },
  notificationIcon: {
    fontSize: 24,
  },
  scoreCard: {
    backgroundColor: '#ffffff33',
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.15,
  },
  scoreValue: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  trophyIcon: {
    fontSize: 40,
  },
  content: {
    padding: 20,
    marginTop: -50,
    gap: 20,
  },
  startGameButton: {
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  startGameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameIcon: {
    fontSize: 36,
  },
  startGameTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.45,
  },
  startGameSubtitle: {
    fontSize: 14,
    color: '#ffffffcc',
    letterSpacing: -0.15,
  },
  arrowIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#0e162b',
    fontWeight: '400',
    letterSpacing: -0.44,
  },
  viewAllButton: {
    fontSize: 14,
    color: '#155cfb',
    letterSpacing: -0.15,
  },
  rankingList: {
    gap: 10,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafb',
    padding: 10,
    borderRadius: 14,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankIconWrapper: {
    width: 20,
    height: 20,
  },
  rankIcon: {
    fontSize: 20,
  },
  playerName: {
    fontSize: 14,
    color: '#0e162b',
    letterSpacing: -0.15,
  },
  playerPoints: {
    fontSize: 14,
    color: '#45556c',
    letterSpacing: -0.15,
  },
  dailyChallenge: {
    borderRadius: 14,
    padding: 20,
  },
  dailyChallengeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dailyChallengeLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.15,
  },
  dailyChallengeTitle: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.44,
    marginVertical: 4,
  },
  dailyChallengeReward: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.15,
  },
  challengeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  challengeButtonText: {
    color: '#f44900',
    fontSize: 14,
  },
});

