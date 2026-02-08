import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import io from "socket.io-client";

const socket = io("YOUR_BACKEND_URL");

export default function LotteryScreen({ isAdmin }) {
  const [currentName, setCurrentName] = useState("");
  const [winner, setWinner] = useState("");

  useEffect(() => {
    socket.on("winnerSelected", (data) => {
      startAnimation(data.userName);
    });

    return () => socket.off("winnerSelected");
  }, []);

  const startAnimation = (winnerName) => {
    // fake shuffle animation for users
    let count = 0;

    const interval = setInterval(() => {
      setCurrentName("Picking...");
      count++;

      if (count > 15) {
        clearInterval(interval);
        setWinner(winnerName);
        setCurrentName(winnerName);
      }
    }, 100);
  };

  const spinWinner = async () => {
    await fetch("/api/admin/spin-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chitFundId: "123",
        month: 1,
      }),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chit Lottery</Text>

      <View style={styles.box}>
        <Text style={styles.name}>{currentName}</Text>
      </View>

      {winner ? <Text style={styles.winner}>🏆 {winner}</Text> : null}

      {isAdmin && (
        <Pressable style={styles.button} onPress={spinWinner}>
          <Text style={{ color: "white" }}>Spin Winner</Text>
        </Pressable>
      )}
    </View>
  );
}
