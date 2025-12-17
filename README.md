# Word Quiz Battle

**チームで学ぶ英単語クイズアプリ**

リアルタイムでチームメンバーと協力しながら英単語を学習できるモバイルアプリケーションです。Supabaseを活用したリアルタイムデータ同期により、チームメンバーと同時にクイズに挑戦し、ランキングで競い合うことができます。

## 📱 主な機能

### 🎮 リアルタイムクイズ
- 時間制限付きの英単語クイズ
- チームメンバー（最大4人）と同時にプレイ
- リアルタイムでスコアとランキングを表示
- 初級・中級・上級の3つの難易度レベル

### 👥 チームマッチング
- 自動マッチングシステムでチームを形成
- 最大4人まで参加可能
- リアルタイムでメンバーの参加状況を確認
- チームロビーで準備完了状態を管理

### 🏆 ランキングシステム
- グローバルランキング（週間・総合）
- クイズ中のリアルタイムランキング
- スコアに基づいた順位表示
- プロフィールでの成績確認

### 📊 プロフィール機能
- 総合スコア、レベル、経験値の表示
- 勝率、連勝記録、学習単語数の統計
- 実績（アチーブメント）システム
- 最近のゲーム履歴

### 🎯 実績システム
- 初勝利、連勝記録、単語コレクターなど
- 様々な条件で実績を解除
- プロフィールで実績一覧を表示

### 🔐 認証機能
- メールアドレスとパスワードでの登録・ログイン
- ゲストログイン対応
- セッション管理

## 🛠️ 技術スタック

### フロントエンド
- **React Native** (0.81.5) - クロスプラットフォームモバイルアプリ開発
- **Expo** (~54.0.20) - React Native開発プラットフォーム
- **Expo Router** (~6.0.13) - ファイルベースルーティング
- **TypeScript** (~5.9.2) - 型安全性
- **React Native SVG** (15.2.0) - SVGアイコンの表示

### バックエンド
- **Supabase** - BaaS（Backend as a Service）
  - PostgreSQL データベース
  - リアルタイムデータ同期（WebSocket）
  - 認証システム
  - Row Level Security (RLS)

### 主要ライブラリ
- `@supabase/supabase-js` - Supabaseクライアント
- `@react-native-async-storage/async-storage` - ローカルストレージ
- `expo-linear-gradient` - グラデーションUI
- `expo-haptics` - 触覚フィードバック
- `react-native-svg-transformer` - SVG変換

## 📋 セットアップ手順

### 前提条件
- Node.js (v18以上推奨)
- npm または yarn
- Expo CLI
- Supabaseアカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd english-words-app
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください：

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**環境変数の取得方法：**
1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. Settings > API から以下を取得：
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. データベースのセットアップ

Supabase DashboardのSQL Editorで、`supabase/schema.sql` の内容を実行してください：

1. Supabase Dashboardにログイン
2. SQL Editorを開く
3. `supabase/schema.sql` の内容をコピー＆ペースト
4. 実行ボタンをクリック

これにより、以下のテーブルと機能が作成されます：
- ユーザープロフィール
- 単語データ
- クイズ履歴
- チーム・チームメンバー
- クイズセッション
- 実績システム
- リアルタイム機能の設定
- トリガーと関数

### 5. アプリの起動

```bash
# 開発サーバーを起動
npx expo start

# iOSシミュレーターで起動
npx expo start --ios

# Androidエミュレーターで起動
npx expo start --android

# Webブラウザで起動
npx expo start --web
```

## 📁 プロジェクト構造

```
english-words-app/
├── app/                    # Expo Routerの画面ファイル
│   ├── _layout.tsx        # ルートレイアウト
│   ├── index.tsx          # ウェルカム画面
│   ├── login.tsx          # ログイン・登録画面
│   ├── home.tsx           # ホーム画面（ランキング表示）
│   ├── matching.tsx       # マッチング画面
│   ├── team-lobby.tsx     # チームロビー画面
│   ├── quiz.tsx           # クイズ画面
│   ├── result.tsx         # 結果画面
│   └── profile.tsx        # プロフィール画面
├── components/             # 再利用可能なコンポーネント
│   ├── ui/                # UIコンポーネント
│   └── ...
├── lib/                    # ユーティリティとヘルパー関数
│   ├── supabase.ts        # Supabaseクライアント設定
│   ├── supabase-helpers.ts # Supabase操作ヘルパー
│   ├── realtime-helpers.ts # リアルタイム機能ヘルパー
│   └── database.types.ts  # TypeScript型定義
├── contexts/               # React Context
│   └── AuthContext.tsx    # 認証コンテキスト
├── hooks/                  # カスタムフック
├── assets/                 # 画像・アイコン・SVG
│   └── images/
├── constants/              # 定数
│   └── theme.ts           # テーマ設定
├── supabase/               # データベーススキーマ
│   └── schema.sql         # データベーススキーマ定義
├── public/                 # 公開ファイル
│   └── privacy-policy.html # プライバシーポリシー
├── app.json               # Expo設定
├── package.json           # 依存関係
└── tsconfig.json          # TypeScript設定
```

## 🚀 開発コマンド

```bash
# 開発サーバー起動
npm start

# iOSシミュレーターで起動
npm run ios

# Androidエミュレーターで起動
npm run android

# Webブラウザで起動
npm run web

# リント実行
npm run lint

# プロジェクトリセット（開発用）
npm run reset-project
```

## 🗄️ データベーススキーマ

### 主要テーブル

- **profiles** - ユーザープロフィール（スコア、レベル、統計情報）
- **words** - 英単語データ（単語、意味、例文、難易度）
- **quiz_attempts** - クイズ履歴
- **teams** - チーム情報
- **team_members** - チームメンバー（リアルタイム同期）
- **quiz_sessions** - クイズセッション
- **quiz_session_participants** - セッション参加者とスコア（リアルタイム同期）
- **achievements** - 実績定義
- **user_achievements** - ユーザーの実績

### リアルタイム機能

以下のテーブルでリアルタイム同期が有効になっています：
- `quiz_session_participants` - クイズ中のスコア更新
- `team_members` - チームメンバーの参加・準備状態
- `profiles` - グローバルランキング

### トリガーと関数

- `sync_team_member_profile` - チームメンバー追加時にプロフィール情報を自動コピー
- `check_team_capacity` - チームの最大人数（4人）を強制
- `update_session_score` - クイズセッションのスコア更新
- `toggle_member_ready` - メンバーの準備状態を切り替え

## 📱 ビルドとデプロイ

### EAS Buildの設定

このプロジェクトは EAS (Expo Application Services) を使用してビルドできます。

```bash
# EAS CLIのインストール
npm install -g eas-cli

# EASにログイン
eas login

# ビルド設定の確認
eas build:configure

# iOSビルド
eas build --platform ios

# Androidビルド
eas build --platform android
```

### ビルドプロファイル

`eas.json` に以下のプロファイルが設定されています：
- **development** - 開発用ビルド
- **preview** - プレビュー用ビルド
- **production** - 本番用ビルド

## 🐛 トラブルシューティング

### 環境変数が読み込まれない
- `.env` ファイルがプロジェクトルートにあるか確認
- 環境変数名が `EXPO_PUBLIC_` で始まっているか確認
- アプリを再起動してください

### リアルタイム機能が動作しない
- Supabase Dashboardでリアルタイムが有効になっているか確認
- `supabase/schema.sql` のリアルタイム設定が実行されているか確認
- ネットワーク接続を確認

### 認証エラー
- Supabaseの認証設定を確認
- メール確認が有効な場合、メールを確認してください
- ゲストログインを使用する場合は、Supabaseでゲスト認証を有効化してください

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 👥 開発者

- **開発者**: ryuhosoy
- **連絡先**: support@example.com（要変更）

## 🔗 関連リンク

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/)

## 📝 更新履歴

### v1.0.0 (2024)
- 初回リリース
- リアルタイムクイズ機能
- チームマッチング機能
- ランキングシステム
- プロフィール・実績システム

---

**注意**: 本番環境にデプロイする前に、環境変数とセキュリティ設定を適切に構成してください。
