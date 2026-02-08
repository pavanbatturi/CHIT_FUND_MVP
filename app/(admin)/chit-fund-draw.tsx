import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import io, { Socket } from "socket.io-client";
import { apiPost } from "@/lib/api";

const BACKEND_URL = "https://chit-fund-manager--pavanbatturi.replit.app";

export default function LotteryScreen() {
  const isAdmin = true; // 🔥 Replace with real role logic

  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<any>(null);

  const [currentName, setCurrentName] = useState("Waiting...");
  const [winner, setWinner] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- SOCKET CONNECTION ---------------- */
  useEffect(() => {
    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
    });

    socketRef.current.on("winnerSelected", (data) => {
      startAnimation(data.userName);
    });

    return () => {
      socketRef.current?.disconnect();
      stopAnimation();
    };
  }, []);

  /* ---------------- SPIN ANIMATION ---------------- */

  const startAnimation = (winnerName: string) => {
    stopAnimation();

    setIsSpinning(true);
    setWinner("");

    let count = 0;

    intervalRef.current = setInterval(() => {
      setCurrentName("🎰 Picking Winner...");
      count++;

      if (count > 20) {
        stopAnimation();
        setWinner(winnerName);
        setCurrentName(winnerName);
        setIsSpinning(false);
      }
    }, 100);
  };

  const stopAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /* ---------------- ADMIN ACTION ---------------- */

  const spinWinner = async () => {
    if (!isAdmin || loading) return;

    try {
      setLoading(true);

      await apiPost("/api/admin/spin-winner", {
        chitFundId: "27d710a3-7fa4-4541-81a5-e3cfc7191db5",
        month: 1,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎰 Chit Lottery</Text>

      <View style={[styles.box, winner && styles.winnerBox]}>
        {isSpinning ? (
          <ActivityIndicator size="large" />
        ) : (
          <Text style={styles.name}>{currentName}</Text>
        )}
      </View>

      {winner ? (
        <Text style={styles.winnerText}>🏆 Winner: {winner}</Text>
      ) : null}

      {isAdmin && (
        <Pressable
          style={[
            styles.button,
            (loading || isSpinning) && styles.disabledButton,
          ]}
          disabled={loading || isSpinning}
          onPress={spinWinner}
        >
          <Text style={styles.buttonText}>
            {loading ? "Selecting..." : "Spin Winner"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  box: {
    height: 120,
    borderRadius: 20,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  winnerBox: { backgroundColor: "#bbf7d0" },
  name: { fontSize: 26, fontWeight: "bold" },
  winnerText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "green",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#94a3b8" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
