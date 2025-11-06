import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, signInAsGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (isSignUp && !username) {
      Alert.alert('エラー', 'ユーザー名を入力してください');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, username);
        Alert.alert('成功', '登録完了しました！');
      } else {
        console.log('signIn試行');
        await signIn(email, password);
      }
      router.replace('/home');
    } catch (error: any) {
      console.log('handleAuthのcathcエラー', error.message);
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await signInAsGuest();
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ad46ff', '#4f39f6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.mainIcon}>📚</Text>
          </View>

          <Text style={styles.title}>Word Quest</Text>
          <Text style={styles.subtitle}>{isSignUp ? 'アカウント作成' : 'ログイン'}</Text>

          <Card style={styles.formCard}>
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ユーザー名</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ユーザー名を入力"
                  autoCapitalize="none"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="パスワードを入力"
                secureTextEntry
              />
            </View>

            <Button
              title={loading ? '処理中...' : (isSignUp ? '登録' : 'ログイン')}
              onPress={handleAuth}
              style={styles.authButton}
              textStyle={styles.authButtonText}
            />

            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.switchText}>
                {isSignUp ? 'すでにアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方は？登録'}
              </Text>
            </TouchableOpacity>
          </Card>

          <Button
            title="ゲストとして続ける"
            onPress={handleGuestLogin}
            variant="ghost"
            style={styles.guestButton}
            textStyle={styles.guestButtonText}
          />

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>
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
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
    textAlign: 'center',
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 18,
    color: '#daeafe',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.44,
  },
  formCard: {
    backgroundColor: '#ffffff',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#0e162b',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0e162b',
    backgroundColor: '#f8fafb',
  },
  authButton: {
    backgroundColor: '#980ffa',
    height: 45,
    marginTop: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    fontSize: 14,
    color: '#155cfb',
    textAlign: 'center',
  },
  guestButton: {
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  backText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});

