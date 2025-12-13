import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';

const features = [
  {
    icon: '⏱️',
    title: 'リアルタイムクイズ',
    description: '時間制限ありのクイズに挑戦',
  },
  {
    icon: '🏆',
    title: 'ランキング',
    description: '世界中のプレイヤーと競う',
  },
  {
    icon: '📅',
    title: '毎日の学習',
    description: '継続して英単語をマスター',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#ad46ff', '#4f39f6']}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📚</Text>
          </View>

          <Text style={styles.title}>Word Battle</Text>
          <Text style={styles.subtitle}>チームで学ぶ英単語クイズ</Text>

          <Card style={styles.featuresCard}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </Card>

          <Button
            title="ログイン / 登録"
            onPress={() => router.push('/login')}
            style={styles.startButton}
            textStyle={styles.startButtonText}
          />

          <Text style={styles.footerText}>毎日新しい単語で学習できます</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  mainIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 18,
    color: '#daeafe',
    fontWeight: '400',
    letterSpacing: -0.44,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: '#ffffff1a',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  featureTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  featureDescription: {
    fontSize: 14,
    color: '#daeafe',
    fontWeight: '400',
    letterSpacing: -0.15,
  },
  startButton: {
    width: '100%',
    height: 45,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  startButtonText: {
    color: '#980ffa',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.44,
  },
  footerText: {
    fontSize: 14,
    color: '#daeafe',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.15,
  },
});

