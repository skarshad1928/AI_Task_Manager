import React, { useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { getScore } from "../services/api";
import s from "./styles";

export default function ScoreScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try { setData(await getScore()); } catch (e) { setData({ summary: "Could not reach server" }); }
    setLoading(false);
  };

  return (
    <ScrollView style={s.page}>
      <Text style={s.h}>Daily score</Text>
      <TouchableOpacity style={s.btn} onPress={run}><Text style={s.btnText}>Calculate today's score</Text></TouchableOpacity>
      {loading && <ActivityIndicator size="large" />}
      {data?.score !== undefined && (
        <>
          <Text style={s.big}>{data.score}/100</Text>
          <View style={s.card}>
            {Object.entries(data.breakdown || {}).map(([k, v]) => <Text key={k}>{k}: {v}</Text>)}
          </View>
        </>
      )}
      {!!data?.summary && <View style={s.card}><Text>{data.summary}</Text></View>}
    </ScrollView>
  );
}
