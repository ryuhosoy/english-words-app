import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Card from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import {
    findOrCreateMatchingTeam,
    leaveTeam,
    subscribeToTeamUpdates,
} from "../lib/realtime-helpers";

export default function MatchingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [status, setStatus] = useState("マッチング中...");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const isNavigatingRef = useRef(false);

  // 初期化: フェードインアニメーション & マッチング開始
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    if (user) {
      console.log("startMatching()を実行します");
      startMatching();
    }
  }, [user]);

  // リアルタイム監視: teamIdが設定されたら自動的に監視開始
  useEffect(() => {
    if (!teamId) return;

    console.log("👂 [Matching] リアルタイム監視開始:", teamId);

    // メンバー更新のコールバック
    const handleMembersUpdate = (updatedMembers: any[]) => {
      console.log("👥 [Matching] メンバー更新:", updatedMembers.length, "人");
      setMembers(updatedMembers);

      // メンバー数に応じてステータス更新
      if (updatedMembers.length >= 4) {
        setStatus("マッチング完了！");
        console.log("🎉 [Matching] マッチング完了 - クイズ開始");

        setTimeout(() => {
          isNavigatingRef.current = true;
          router.replace({
            pathname: "/quiz",
            params: { teamId, sessionId: `session_${teamId}` },
          });
        }, 1500);
      } else {
        setStatus(`メンバー待機中 (${updatedMembers.length}/4)`);
      }
    };

    // リアルタイム監視を開始
    const channel = subscribeToTeamUpdates(teamId, handleMembersUpdate);

    // クリーンアップ: 購読を解除
    return () => {
      console.log("🛑 [Matching] リアルタイム監視停止:", teamId);
      channel.unsubscribe();
    };
  }, [teamId]); // teamIdが変わったら再購読

  // クリーンアップ: コンポーネントのアンマウント時にチームから離脱
  useEffect(() => {
    return () => {
      if (teamId && user && !isNavigatingRef.current) {
        console.log("🧹 [Matching] クリーンアップ - チームから離脱");
        leaveTeam(teamId, user.id);
      }
    };
  }, [teamId, user]);

  const startMatching = async () => {
    try {
      console.log("🔍 [Matching] マッチング開始");
      setStatus("対戦相手を探しています...");

      // 参加可能なチームを探すか、新規作成
      const team = await findOrCreateMatchingTeam(
        user!.id,
        user!.user_metadata?.username || user!.email || "プレイヤー",
        "中級"
      );

      console.log("✅ [Matching] チーム参加:", team.id);
      setStatus("チームに参加しました！");
      
      // teamIdをセット → useEffectが自動的にリアルタイム監視を開始
      setTeamId(team.id);

      // 30秒経ってもマッチングできなかったら
    //   setTimeout(() => {
    //     if (members.length < 4 && !isNavigatingRef.current) {
    //       console.log("⏰ [Matching] タイムアウト - ボットを追加");
    //       setStatus("ボットと対戦します！");

    //       setTimeout(() => {
    //         isNavigatingRef.current = true; // クイズ開始時は離脱しない
    //         router.replace({
    //           pathname: "/quiz",
    //           params: {
    //             teamId: team.id,
    //             sessionId: `session_${team.id}`,
    //             withBots: "true",
    //           },
    //         });
    //       }, 1000);
    //     }
    //   }, 30000);
    } catch (error) {
      console.error("❌ [Matching] マッチングエラー:", error);
      setStatus("マッチングに失敗しました");

      // エラー時はチームから離脱
      if (teamId && user) {
        await leaveTeam(teamId, user.id);
      }

      setTimeout(() => {
        router.back();
      }, 2000);
    }
  };

  const handleCancel = async () => {
    // キャンセル時はチームから離脱
    if (teamId && user) {
      console.log("🚫 [Matching] キャンセル - チームから離脱");
      await leaveTeam(teamId, user.id);
    }
    router.back();
  };

  return (
    <LinearGradient colors={["#ad46ff", "#4f39f6"]} style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Card style={styles.matchingCard}>
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color="#980ffa" />
          </View>

          <Text style={styles.title}>{status}</Text>
          <Text style={styles.subtitle}>
            {members.length < 4
              ? "他のプレイヤーを待っています..."
              : "まもなく開始します！"}
          </Text>

          {/* メンバー表示 */}
          {members.length > 0 && (
            <View style={styles.membersContainer}>
              <Text style={styles.membersTitle}>
                参加者 ({members.length}/4)
              </Text>
              <View style={styles.membersList}>
                {members.map((member, index) => (
                  <View key={index} style={styles.memberItem}>
                    <Avatar
                      initial={(member.username || "P")[0]}
                      size={40}
                      backgroundColor="#980ffa"
                      textColor="#ffffff"
                    />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.display_name || member.username}
                    </Text>
                    {member.is_ready && <Text style={styles.readyIcon}>✓</Text>}
                  </View>
                ))}

                {/* 空きスロット */}
                {[...Array(4 - members.length)].map((_, index) => (
                  <View key={`empty_${index}`} style={styles.emptySlot}>
                    <View style={styles.emptyAvatar}>
                      <Text style={styles.emptyText}>?</Text>
                    </View>
                    <Text style={styles.emptyName}>待機中...</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Button
            title="キャンセル"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        </Card>

        <Text style={styles.tipText}>
          💡 ヒント: 30秒以内にマッチングできない場合、ボットと対戦できます
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
  },
  matchingCard: {
    alignItems: "center",
    gap: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    color: "#0e162b",
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#45556c",
    textAlign: "center",
  },
  membersContainer: {
    width: "100%",
    gap: 12,
  },
  membersTitle: {
    fontSize: 14,
    color: "#45556c",
    fontWeight: "600",
    textAlign: "center",
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  memberItem: {
    width: "22%",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 12,
    color: "#0e162b",
    textAlign: "center",
  },
  readyIcon: {
    fontSize: 16,
    color: "#00c950",
  },
  emptySlot: {
    width: "22%",
    alignItems: "center",
    gap: 6,
    opacity: 0.5,
  },
  emptyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e1e8f0",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    color: "#94a3b8",
  },
  emptyName: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  cancelButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderColor: "#e1e8f0",
    borderWidth: 1,
  },
  cancelButtonText: {
    color: "#0e162b",
  },
  tipText: {
    fontSize: 14,
    color: "#daeafe",
    textAlign: "center",
    marginTop: 16,
  },
});
