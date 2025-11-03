import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FirstRankIcon from '../assets/images/container-17.svg';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';

const quizPlayers = [
  { rankIcon: FirstRankIcon, rank: '1', name: 'Mei', points: '42pt', initial: 'M', highlight: false },
  { rankIcon: null, rank: '2', name: 'あなた', points: '0pt', initial: 'Y', highlight: true },
  { rankIcon: null, rank: '3', name: 'Yuki', points: '0pt', initial: 'Y', highlight: false },
];

const quizData = [
  {
    word: 'Brilliant',
    example: '"She had a brilliant idea!"',
    answers: ['素晴らしい', '暗い', '大きい', '小さい'],
    correctIndex: 0,
  },
  {
    word: 'Ancient',
    example: '"The ancient temple was beautiful."',
    answers: ['新しい', '古代の', '現代の', '未来の'],
    correctIndex: 1,
  },
  {
    word: 'Swift',
    example: '"The swift runner won the race."',
    answers: ['遅い', '速い', '弱い', '強い'],
    correctIndex: 1,
  },
  {
    word: 'Courageous',
    example: '"The courageous hero saved the day."',
    answers: ['臆病な', '勇敢な', '賢い', '愚かな'],
    correctIndex: 1,
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);

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
        pathname: '/result',
        params: { score, correctAnswers, totalQuestions: quizData.length }
      });
    }
  }, [isQuizComplete]);

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === quizData[currentQuestion].correctIndex;
    if (isCorrect) {
      setScore(score + 100);
      setCorrectAnswers(correctAnswers + 1);
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
    <LinearGradient colors={['#ad46ff', '#4f39f6']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>⭐ スコア: {score}</Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.questionText}>問題 {currentQuestion + 1}/{quizData.length}</Text>
          <Text style={styles.timeText}>⏰ {timeLeft}秒</Text>
        </View>
        <ProgressBar progress={progress} height={6} />
      </View>

      <View style={styles.rankingSection}>
        <View style={styles.rankingHeader}>
          <Text style={styles.rankingLabel}>🏆 ランキング</Text>
        </View>
        <View style={styles.playersContainer}>
          {quizPlayers.map((player, index) => {
            const RankIcon = player.rankIcon;
            return (
              <View key={index} style={[styles.playerCard, player.highlight && styles.playerCardHighlight]}>
                {RankIcon ? (
                  <View style={styles.rankIconWrapper}>
                    <RankIcon width={16} height={16} />
                  </View>
                ) : (
                  <Text style={styles.playerRank}>{player.rank}</Text>
                )}
                <Avatar initial={player.initial} size={26} backgroundColor={player.highlight ? '#f0b100' : '#ad46ff'} borderColor={player.highlight ? '#fdc700' : '#ffffff33'} borderWidth={2} />
                <Text style={[styles.playerName, player.highlight && styles.playerNameHighlight]}>{player.name}</Text>
                <Text style={[styles.playerPoints, player.highlight && styles.playerPointsHighlight]}>{player.points}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.quizContent}>
        <Card>
          <Text style={styles.questionLabel}>次の単語の意味は？</Text>
          <Text style={styles.word}>{quizData[currentQuestion].word}</Text>
          <Text style={styles.example}>{quizData[currentQuestion].example}</Text>
        </Card>
        <View style={styles.answersContainer}>
          {quizData[currentQuestion].answers.map((answer, index) => (
            <TouchableOpacity key={index} style={styles.answerButton} onPress={() => handleAnswer(index)} activeOpacity={0.8}>
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
  header: { backgroundColor: '#ffffff1a', padding: 12, gap: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreText: { fontSize: 16, color: '#ffffff', letterSpacing: -0.31 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionText: { fontSize: 14, color: '#ffffff', letterSpacing: -0.15 },
  timeText: { fontSize: 14, color: '#ffffff', letterSpacing: -0.15 },
  rankingSection: { backgroundColor: '#ffffff0d', padding: 12, gap: 6 },
  rankingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankingLabel: { fontSize: 12, color: '#ffffff' },
  playersContainer: { flexDirection: 'row', gap: 8 },
  playerCard: { flex: 1, backgroundColor: '#ffffff1a', borderRadius: 14, borderWidth: 1, borderColor: '#ffffff33', padding: 8, alignItems: 'center', gap: 6 },
  playerCardHighlight: { backgroundColor: '#fdc7004c', borderColor: '#fdc700', borderWidth: 2 },
  rankIconWrapper: { width: 16, height: 16 },
  playerRank: { fontSize: 16 },
  playerName: { fontSize: 12, color: '#ffffff', textAlign: 'center' },
  playerNameHighlight: { color: '#fef9c1' },
  playerPoints: { fontSize: 12, color: '#ffffffcc' },
  playerPointsHighlight: { color: '#ffdf20' },
  quizContent: { flex: 1, padding: 20, gap: 20 },
  questionLabel: { fontSize: 14, color: '#45556c', letterSpacing: -0.15, marginBottom: 20 },
  word: { fontSize: 36, color: '#0e162b', textAlign: 'center', letterSpacing: 0.37, marginBottom: 16 },
  example: { fontSize: 14, color: '#61738d', textAlign: 'center', fontStyle: 'italic', letterSpacing: -0.15 },
  answersContainer: { gap: 10 },
  answerButton: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  answerText: { fontSize: 16, color: '#0e162b', letterSpacing: -0.31 },
});

