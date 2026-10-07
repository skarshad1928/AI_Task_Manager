import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { getTasks, updateTask } from "../services/api";
import s from "./styles";

const fmt = (n) => { const m = Math.floor(n / 60), sec = n % 60; return `${m}:${String(sec).padStart(2, "0")}`; };

export default function TimerScreen() {
  const [tasks, setTasks] = useState([]);
  const [sel, setSel] = useState(null);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);

  useEffect(() => { getTasks().then((t) => setTasks(t.filter((x) => x.type === "study"))).catch(() => {}); }, []);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs((v) => v + 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const pick = (t) => { setSel(t); setSecs(t.timeSpentSec); setRunning(false); };
  const toggle = async () => {
    if (running && sel) await updateTask(sel._id, { timeSpentSec: secs }); // save on pause
    setRunning(!running);
  };

  return (
    <View style={s.page}>
      <Text style={s.h}>Focus timer</Text>
      <Text style={s.big}>{fmt(secs)}</Text>
      <Text style={{ textAlign: "center", marginBottom: 10 }}>{sel ? sel.title : "Pick a task below"}</Text>
      {sel && <TouchableOpacity style={s.btn} onPress={toggle}><Text style={s.btnText}>{running ? "Pause & save" : "Start"}</Text></TouchableOpacity>}
      <FlatList data={tasks} keyExtractor={(t) => t._id} renderItem={({ item }) => (
        <TouchableOpacity style={s.card} onPress={() => pick(item)}>
          <Text>{item.title}  ·  {fmt(item.timeSpentSec)}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}
