import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('📱 [Auth] 初期セッション:', session ? '認証済み' : '未認証');
      if (session?.user) {
        console.log('👤 [Auth] ユーザー情報:', {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata,
        });
      }
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [Auth] 状態変更:', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        console.log('✅ [Auth] ログイン成功:', {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username,
        });
      } else {
        console.log('❌ [Auth] ログアウト');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 [Auth] サインイン試行:', email, password);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });
    if (error) throw error;
    
    // プロフィールを明示的に作成/更新（トリガーが動作しない場合のフォールバック）
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username,
            display_name: username,
          }, {
            onConflict: 'id'
          });
        
        if (profileError) {
          console.error('❌ [Auth] プロフィール作成エラー:', profileError);
          // エラーでも続行（トリガーで作成される可能性がある）
        } else {
          console.log('✅ [Auth] プロフィール作成成功:', username);
        }
      } catch (err) {
        console.error('❌ [Auth] プロフィール作成例外:', err);
        // エラーでも続行
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ゲストとしてサインイン（デモ用）
  const signInAsGuest = async () => {
    // デモ用のゲストユーザーを作成
    const guestEmail = `guest_${Date.now()}@wordquest.app`;
    const guestPassword = 'guestpassword123';
    
    const { error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
      options: {
        data: {
          username: `ゲスト${Math.floor(Math.random() * 1000)}`,
        },
      },
    });
    
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        signInAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

