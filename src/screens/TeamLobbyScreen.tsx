import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../App';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';

type TeamLobbyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TeamLobby'>;

interface Props {
  navigation: TeamLobbyScreenNavigationProp;
}

const teamMembers = [
  { name: 'あなた', initial: 'あ', status: '準備OK', ready: true },
  { name: 'Yuki', initial: 'Y', status: '準備OK', ready: true },
  { name: 'Mei', initial: 'M', status: '待機中', ready: false },
];

const availableTeams = [
  {
    icon: '📚',
    name: 'English Masters',
    level: '中級',
    status: 'オンライン',
    members: '3/4',
    full: false,
  },
  {
    icon: '⚔️',
    name: 'Vocab Warriors',
    level: '上級',
    status: 'オンライン',
    members: '2/4',
    full: false,
  },
  {
    icon: '🎓',
    name: 'Study Buddies',
    level: '初級',
    members: '4/4',
    full: true,
  },
];

export default function TeamLobbyScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>チームロビー</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#ad46ff', '#4f39f6']}
          style={styles.teamCard}
        >
          <View style={styles.teamHeader}>
            <View style={styles.teamNameRow}>
              <Text style={styles.teamIcon}>👥</Text>
              <Text style={styles.teamName}>English Masters</Text>
            </View>
            <Badge text="中級" />
          </View>

          <View style={styles.membersList}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <View style={styles.memberLeft}>
                  <Avatar
                    initial={member.initial}
                    size={32}
                    backgroundColor="#ffffff4c"
                    borderColor="#ffffff"
                    borderWidth={2}
                  />
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>
                <Badge
                  text={member.status}
                  backgroundColor={member.ready ? '#00c950' : '#ffffff33'}
                  textColor="#ffffff"
                />
              </View>
            ))}

            <TouchableOpacity style={styles.inviteButton}>
              <Text style={styles.inviteIcon}>➕</Text>
              <Text style={styles.inviteText}>メンバーを招待</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="クイズを開始"
            onPress={() => navigation.navigate('Quiz')}
            style={styles.startButton}
            textStyle={styles.startButtonText}
          />
        </LinearGradient>

        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>参加可能なチーム</Text>

          <View style={styles.teamsList}>
            {availableTeams.map((team, index) => (
              <Card key={index} style={styles.availableTeamCard}>
                <View style={styles.teamInfo}>
                  <View style={styles.teamInfoLeft}>
                    <Text style={styles.availableTeamIcon}>{team.icon}</Text>
                    <View>
                      <Text style={styles.availableTeamName}>{team.name}</Text>
                      <View style={styles.teamBadges}>
                        <Badge
                          text={team.level}
                          backgroundColor="#f1f5f9"
                          textColor="#0e162b"
                          style={styles.levelBadge}
                        />
                        {team.status && (
                          <View style={styles.statusRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.statusText}>{team.status}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.membersInfo}>
                    <Text style={styles.membersCount}>{team.members}</Text>
                    <Text style={styles.membersLabel}>メンバー</Text>
                  </View>
                </View>

                {!team.full && (
                  <Button
                    title="参加する"
                    onPress={() => {}}
                    style={styles.joinButton}
                    textStyle={styles.joinButtonText}
                  />
                )}
              </Card>
            ))}
          </View>
        </View>

        <TouchableOpacity>
          <LinearGradient
            colors={['#10b981', '#14b8a6']}
            style={styles.createTeamButton}
          >
            <View style={styles.createTeamLeft}>
              <Text style={styles.createTeamIcon}>➕</Text>
              <View>
                <Text style={styles.createTeamTitle}>新しいチームを作成</Text>
                <Text style={styles.createTeamSubtitle}>友達を招待しよう</Text>
              </View>
            </View>
            <Text style={styles.arrowIcon}>▶</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8f0',
  },
  backIcon: {
    fontSize: 24,
    color: '#0e162b',
  },
  headerTitle: {
    fontSize: 16,
    color: '#0e162b',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  teamCard: {
    borderRadius: 14,
    padding: 20,
    gap: 20,
    marginBottom: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamIcon: {
    fontSize: 16,
  },
  teamName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  membersList: {
    gap: 10,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff1a',
    padding: 10,
    borderRadius: 14,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  inviteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff1a',
    padding: 10,
    borderRadius: 14,
  },
  inviteIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  inviteText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  startButton: {
    backgroundColor: '#ffffff',
    height: 38,
  },
  startButtonText: {
    color: '#980ffa',
    fontSize: 14,
  },
  availableSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0e162b',
    fontWeight: '400',
    letterSpacing: -0.31,
    marginBottom: 12,
  },
  teamsList: {
    gap: 10,
  },
  availableTeamCard: {
    borderWidth: 1,
    borderColor: '#e1e8f0',
    gap: 20,
  },
  teamInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  availableTeamIcon: {
    fontSize: 32,
  },
  availableTeamName: {
    fontSize: 16,
    color: '#0e162b',
    fontWeight: '400',
    letterSpacing: -0.31,
    marginBottom: 4,
  },
  teamBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    borderWidth: 1,
    borderColor: '#e1e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00a63d',
  },
  statusText: {
    fontSize: 12,
    color: '#00a63d',
  },
  membersInfo: {
    alignItems: 'flex-end',
  },
  membersCount: {
    fontSize: 14,
    color: '#45556c',
    letterSpacing: -0.15,
  },
  membersLabel: {
    fontSize: 12,
    color: '#90a1b8',
  },
  joinButton: {
    backgroundColor: '#0f172b',
    height: 26,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  createTeamButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  createTeamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createTeamIcon: {
    fontSize: 32,
    color: '#ffffff',
  },
  createTeamTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: -0.31,
  },
  createTeamSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    letterSpacing: -0.15,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
});

