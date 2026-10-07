import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { getTasks, addTask, updateTask, deleteTask } from "../services/api";
import s from "./styles";

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const load = async () => { try { setTasks(await getTasks()); } catch (e) {} };
  useEffect(() => { load(); }, []);

  const add = async () => { if (!title.trim()) return; await addTask(title.trim()); setTitle(""); load(); };
  const toggle = async (t) => { await updateTask(t._id, { done: !t.done }); load(); };

  return (
    <View style={s.page}>
      <Text style={s.h}>Today</Text>
      <FlatList data={tasks} keyExtractor={(t) => t._id} renderItem={({ item }) => (
        <View style={[s.card, s.row]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => toggle(item)}>
            <Text style={{ textDecorationLine: item.done ? "line-through" : "none", fontSize: 16 }}>
              {item.done ? "✅ " : "⬜ "}{item.time ? `${item.time}  ` : ""}{item.title}
            </Text>
          </TouchableOpacity>
          {item.type === "study" && (
            <TouchableOpacity onPress={async () => { await deleteTask(item._id); load(); }}><Text>🗑</Text></TouchableOpacity>
          )}
        </View>
      )} />
      <TextInput style={s.input} placeholder="New study / urgent task" value={title} onChangeText={setTitle} />
      <TouchableOpacity style={s.btn} onPress={add}><Text style={s.btnText}>Add task</Text></TouchableOpacity>
    </View>
  );
}
