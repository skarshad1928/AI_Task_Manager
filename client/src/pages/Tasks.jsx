import { useEffect, useMemo, useState } from "react";
import { createTask, deleteTask, getTasks, localDate, updateTask } from "../api.js";
import { Alert, Loading, PageTitle } from "../components/UI.jsx";

const formatTime = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("study");
  const [selectedId, setSelectedId] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
      setError("");
      if (!selectedId) {
        const firstTask = data.find((task) => task.type === "study" || task.type === "immediate");
        if (firstTask) { setSelectedId(firstTask._id); setSeconds(firstTask.timeSpentSec || 0); }
      }
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const selectedTask = tasks.find((task) => task._id === selectedId);
  const taskList = useMemo(() => [...tasks].sort((a, b) => {
    const order = { water: 0, routine: 1, study: 2, immediate: 3 };
    return order[a.type] - order[b.type] || (a.time || "").localeCompare(b.time || "");
  }), [tasks]);

  const add = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const task = await createTask({ title: title.trim(), type, date: localDate() });
      setTasks((items) => [...items, task]); setTitle("");
      if ((task.type === "study" || task.type === "immediate") && !selectedId) { setSelectedId(task._id); setSeconds(0); }
      setNotice("Task added to today’s plan.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const toggle = async (task) => {
    try {
      const updated = await updateTask(task._id, { done: !task.done });
      setTasks((items) => items.map((item) => item._id === task._id ? updated : item)); setError("");
    } catch (requestError) { setError(requestError.message); }
  };

  const remove = async (task) => {
    try {
      await deleteTask(task._id);
      setTasks((items) => items.filter((item) => item._id !== task._id));
      if (selectedId === task._id) { setSelectedId(""); setSeconds(0); setRunning(false); }
    } catch (requestError) { setError(requestError.message); }
  };

  const selectTask = (task) => {
    if (running) return;
    setSelectedId(task._id); setSeconds(task.timeSpentSec || 0); setNotice("");
  };

  const toggleTimer = async () => {
    if (!selectedTask) return;
    if (!running) { setNotice(""); setRunning(true); return; }
    setRunning(false); setError("");
    try {
      const updated = await updateTask(selectedTask._id, { timeSpentSec: seconds });
      setTasks((items) => items.map((item) => item._id === selectedTask._id ? updated : item));
      setNotice(`Saved ${formatTime(seconds)} of focus time for “${selectedTask.title}”.`);
    } catch (requestError) { setError(requestError.message); }
  };

  const waterTasks = taskList.filter((task) => task.type === "water");
  const otherTasks = taskList.filter((task) => task.type !== "water");

  return <>
    <PageTitle kicker="GET IT OUT OF YOUR HEAD" title="Tasks & focus." subtitle="Make a clear plan, then give one task your attention." />
    <Alert>{error}</Alert><Alert type="success">{notice}</Alert>
    <div className="tasks-layout">
      <section className="card tasks-card">
        <div className="card-heading"><div><div className="kicker">TODAY’S PLAN</div><h2>Your tasks <span className="count-badge">{tasks.length}</span></h2></div></div>
        <form className="task-form" onSubmit={add}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="Add a task you want to finish…" aria-label="Task title" />
          <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Task type"><option value="study">Study</option><option value="immediate">Immediate</option><option value="routine">Personal routine</option></select>
          <button className="button button-primary" disabled={saving || !title.trim()}>{saving ? "Adding…" : "Add task"}</button>
        </form>
        {loading ? <Loading label="Loading tasks…" /> : <>
          <div className="task-section-label"><span className="section-icon water-icon">↟</span><strong>Water routine</strong><span>{waterTasks.filter((task) => task.done).length}/{waterTasks.length}</span></div>
          {waterTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={toggle} />)}
          <div className="task-section-label planned-label"><span className="section-icon plan-icon">✎</span><strong>Study, immediate & personal routines</strong><span>{otherTasks.filter((task) => task.done).length}/{otherTasks.length}</span></div>
          {otherTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={toggle} onDelete={remove} onFocus={selectTask} selected={selectedId === task._id} disabled={running} />)}
          {!taskList.length && <div className="empty-state"><span>✎</span><h3>Start with one small task</h3><p>Add a study task, something immediate, or a personal routine.</p></div>}
        </>}
      </section>

      <section className="card focus-card">
        <div className="focus-head"><div className="focus-mark">◷</div><div className="kicker">ONE THING AT A TIME</div><h2>Focus timer</h2><p>Choose a study or immediate task and begin.</p></div>
        <div className={`timer-clock ${running ? "is-running" : ""}`}>{formatTime(seconds)}</div>
        <div className="timer-current">{selectedTask ? selectedTask.title : "Select a task below"}</div>
        <button className={`button timer-control ${running ? "button-pause" : "button-primary"}`} onClick={toggleTimer} disabled={!selectedTask}>{running ? "Ⅱ  Pause & save" : "▶  Start focus"}</button>
        <div className="focus-tip">Focus time saves to this task when you pause.</div>
        {otherTasks.filter((task) => task.type === "study" || task.type === "immediate").map((task) => <button key={task._id} className={`focus-select ${selectedId === task._id ? "selected" : ""}`} onClick={() => selectTask(task)} disabled={running}><span>{task.done ? "✓" : "○"}</span><span>{task.title}<small>{formatTime(task.timeSpentSec || 0)} focused</small></span><b>›</b></button>)}
      </section>
    </div>
  </>;
}

function TaskRow({ task, onToggle, onDelete, onFocus, selected, disabled }) {
  const labels = { water: task.time === "10:00" ? "10 AM" : "5 PM", routine: "ROUTINE", study: "STUDY", immediate: "NOW" };
  return <div className={`task-row ${task.done ? "is-done" : ""} ${selected ? "is-selected" : ""}`}>
    {onFocus && <button className="focus-pick" onClick={() => onFocus(task)} disabled={disabled} aria-label={`Focus on ${task.title}`}>◷</button>}
    <button className={`check-button ${task.done ? "checked" : ""}`} onClick={() => onToggle(task)} aria-label={task.done ? "Mark incomplete" : "Mark complete"}>{task.done ? "✓" : ""}</button>
    <span className="task-row-title">{task.title}</span><span className={`type-tag tag-${task.type}`}>{labels[task.type]}</span>
    {onDelete && <button className="delete-task" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>×</button>}
  </div>;
}
