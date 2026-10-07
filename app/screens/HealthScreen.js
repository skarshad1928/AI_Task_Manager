import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { getProfile, saveProfile, uploadReport } from "../services/api";
import s from "./styles";

export default function HealthScreen() {
  const [h, setH] = useState("");
  const [w, setW] = useState("");
  const [bmi, setBmi] = useState(null);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) { setH(String(p.heightCm || "")); setW(String(p.weightKg || "")); setBmi(p); setAdvice(p.lastAdvice || ""); }
    }).catch(() => {});
  }, []);

  const calc = async () => {
    if (!Number(h) || !Number(w)) return;
    setBmi(await saveProfile(Number(h), Number(w)));
  };

  const pickPdf = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (r.canceled) return;
    setLoading(true);
    try {
      const out = await uploadReport(r.assets[0]);
      setAdvice(out.advice || out.error);
    } catch (e) { setAdvice("Upload failed: " + e.message); }
    setLoading(false);
  };

  return (
    <ScrollView style={s.page}>
      <Text style={s.h}>Health</Text>
      <TextInput style={s.input} placeholder="Height (cm)" keyboardType="numeric" value={h} onChangeText={setH} />
      <TextInput style={s.input} placeholder="Weight (kg)" keyboardType="numeric" value={w} onChangeText={setW} />
      <TouchableOpacity style={s.btn} onPress={calc}><Text style={s.btnText}>Check BMI</Text></TouchableOpacity>
      {bmi?.bmi && <View style={s.card}><Text style={{ fontSize: 18 }}>BMI {bmi.bmi} - {bmi.bmiCategory}</Text></View>}

      <TouchableOpacity style={s.btn} onPress={pickPdf}><Text style={s.btnText}>Upload blood report (PDF)</Text></TouchableOpacity>
      {loading && <ActivityIndicator size="large" />}
      {!!advice && <View style={s.card}><Text>{advice}</Text></View>}
      <Text style={s.note}>AI suggestions are general guidance, not medical advice.</Text>
    </ScrollView>
  );
}
