import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { saveSleep } from "../services/api";
import s from "./styles";

export default function SleepScreen() {
  const [bed, setBed] = useState("23:30");
  const [wake, setWake] = useState("06:30");
  const [result, setResult] = useState(null);

  const save = async () => {
    const ok = /^\d{1,2}:\d{2}$/;
    if (!ok.test(bed) || !ok.test(wake)) return setResult({ error: "Use HH:MM (24-hour)" });
    setResult(await saveSleep(bed, wake));
  };

  return (
    <View style={s.page}>
      <Text style={s.h}>Sleep log</Text>
      <Text>Bedtime (24h, e.g. 23:30)</Text>
      <TextInput style={s.input} value={bed} onChangeText={setBed} />
      <Text>Wake-up time (e.g. 06:30)</Text>
      <TextInput style={s.input} value={wake} onChangeText={setWake} />
      <TouchableOpacity style={s.btn} onPress={save}><Text style={s.btnText}>Save</Text></TouchableOpacity>
      {result && <View style={s.card}><Text>{result.error || `You slept ${result.hours} hours`}</Text></View>}
    </View>
  );
}
