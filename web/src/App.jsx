import { useEffect, useMemo, useState } from "react";
import {
  addTask,
  deleteTask,
  getProfile,
  getScore,
  getSleep,
  getTasks,
  getUsage,
  saveProfile,
  saveSleep,
  today,
  updateTask,
  uploadReport,
} from "./api.js";

const NAV = [
  { id: "tasks", label: "My tasks", icon: "▤" },
  { id: "focus", label: "Focus timer", icon: "◷" },
  { id: "sleep", label: "Sleep", icon: "☾" },
  { id: "health", label: "Health", icon: "♡" },
  { id: "score", label: "Daily score", icon: "✳" },
  { id: "usage", label: "App usage", icon: "▥" },
];

const formatTime = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const friendlyDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

export default function App() {
  const [active, setActive] = useState("tasks");
  const [visited, setVisited] = useState(() => new Set(["tasks"]));
  const [apiOnline, setApiOnline] = useState(true);
  const selected = NAV.find((item) => item.id === active) || NAV[0];
  const openTab = (id) => {
    setActive(id);
    setVisited((current) => current.has(id) ? current : new Set([...current, id]));
  };

  useEffect(() => {
    getTasks().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#tasks" onClick={() => setActive("tasks")}>
          <span className="brand-mark">d</span>
          <span>daymark<small>AI TASK MANAGER</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV.map((item) => (
          <button key={item.id} className={`nav-item ${active === item.id ? "is-active" : ""}`} onClick={() => openTab(item.id)}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
              {item.id === "tasks" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="sparkle">✦</span><strong>A little progress<br />goes a long way.</strong><small>Keep showing up for yourself.</small></div>
          <div className="user-chip"><div className="avatar">A</div><div><strong>Your day</strong><small>Personal workspace</small></div><span className="more-dots">···</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">d</span> daymark</div>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{selected.label}</strong></div>
          <div className="topbar-right"><span className={`api-status ${apiOnline ? "online" : "offline"}`}><i />{apiOnline ? "Connected" : "Server offline"}</span><span className="top-date">{friendlyDate}</span></div>
        </header>

        <div className="content-wrap">
          {visited.has("tasks") && <div hidden={active !== "tasks"}><TasksScreen onNavigate={openTab} /></div>}
          {visited.has("focus") && <div hidden={active !== "focus"}><FocusScreen /></div>}
          {visited.has("sleep") && <div hidden={active !== "sleep"}><SleepScreen /></div>}
          {visited.has("health") && <div hidden={active !== "health"}><HealthScreen /></div>}
          {visited.has("score") && <div hidden={active !== "score"}><ScoreScreen /></div>}
          {visited.has("usage") && <div hidden={active !== "usage"}><UsageScreen /></div>}
          <footer className="app-footer">Made for steadier days <span>✦</span></footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {NAV.map((item) => <button key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => openTab(item.id)} aria-label={item.label}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
    </div>
  );
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function Notice({ children, kind = "error" }) {
  if (!children) return null;
  return <div className={`notice ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}

function TasksScreen({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reminderText, setReminderText] = useState("");

  const load = async () => {
    try { setTasks(await getTasks()); setError(""); }
    catch (e) { setError(e.message || "Could not load your tasks."); }
  };
  useEffect(() => { load(); }, []);

  const completed = tasks.filter((task) => task.done).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const createTask = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try { const created = await addTask(title.trim()); setTasks((current) => [...current, created]); setTitle(""); setError(""); }
    catch (e) { setError(e.message || "Could not add this task."); }
    finally { setSaving(false); }
  };

  const toggleTask = async (task) => {
    try {
      const saved = await updateTask(task._id, { done: !task.done });
      setTasks((current) => current.map((item) => item._id === task._id ? saved : item));
    } catch (e) { setError(e.message || "Could not update this task."); }
  };

  const removeTask = async (task) => {
    try { await deleteTask(task._id); setTasks((current) => current.filter((item) => item._id !== task._id)); }
    catch (e) { setError(e.message || "Could not delete this task."); }
  };

  const enableReminders = async () => {
    if (!("Notification" in window)) { setReminderText("This browser does not support notifications."); return; }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") { setReminderText("Allow notifications in your browser to turn on reminders."); return; }
    localStorage.setItem("daymark-water-reminders", "on");
    setReminderText("Water reminders are on while this app is open.");
  };

  useEffect(() => {
    const check = () => {
      if (localStorage.getItem("daymark-water-reminders") !== "on" || !("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();
      const hour = now.getHours();
      const key = `daymark-water-${today()}-${hour}`;
      if ([10, 17].includes(hour) && now.getMinutes() === 0 && localStorage.getItem(key) !== "sent") {
        new Notification("Water time", { body: "Drink 1 liter of water now." });
        localStorage.setItem(key, "sent");
      }
    };
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const routineTasks = tasks.filter((task) => task.type === "routine");
  const studyTasks = tasks.filter((task) => task.type !== "routine");

  return <>
    <PageHeading eyebrow="YOUR PERSONAL SPACE" title="Make today count." subtitle="A calmer plan, one small step at a time." action={<button className="button button-soft reminder-button" onClick={enableReminders}><span>♧</span> Water reminders</button>} />
    <Notice>{error}</Notice>
    {reminderText && <Notice kind="success">{reminderText}</Notice>}

    <section className="welcome-card">
      <div className="welcome-copy"><div className="welcome-kicker">TODAY, AT YOUR PACE <span>✦</span></div><h2>Small steps add up.</h2><p>You’ve completed <strong>{completed} of {tasks.length}</strong> tasks today. Keep your momentum going.</p></div>
      <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` }}><div><strong>{progress}%</strong><small>complete</small></div></div>
      <div className="welcome-decoration decoration-one" /><div className="welcome-decoration decoration-two" />
    </section>

    <div className="task-layout">
      <section className="panel task-panel">
        <div className="section-heading"><div><div className="eyebrow">THE DAILY FLOW</div><h2>Today’s tasks <span className="count-pill">{tasks.length}</span></h2></div><span className="muted-label">{completed} completed</span></div>
        <form className="add-task-form" onSubmit={createTask}><span className="add-plus">＋</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Add a task for today..." aria-label="New task" /><button className="button button-primary" disabled={saving || !title.trim()}>{saving ? "Adding..." : "Add task"}</button></form>
        <div className="task-group"><div className="group-title"><span className="group-icon water-icon">↟</span><strong>Daily rituals</strong><span>{routineTasks.filter((task) => task.done).length}/{routineTasks.length}</span></div>
          {routineTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={toggleTask} />)}
          {!routineTasks.length && <p className="empty-inline">Your daily rituals will appear here.</p>}
        </div>
        <div className="task-group study-group"><div className="group-title"><span className="group-icon study-icon">✎</span><strong>Study & priorities</strong><span>{studyTasks.filter((task) => task.done).length}/{studyTasks.length}</span></div>
          {studyTasks.map((task) => <TaskRow key={task._id} task={task} onToggle={toggleTask} onDelete={removeTask} />)}
          {!studyTasks.length && <p className="empty-inline">Add a study task above to get started.</p>}
        </div>
      </section>
      <aside className="today-aside">
        <section className="panel aside-panel"><div className="aside-icon sun-icon">☼</div><div className="eyebrow">A GENTLE REMINDER</div><h3>Progress over perfection.</h3><p>You don’t need to do everything at once. Choose the next right thing and begin there.</p></section>
        <section className="panel aside-panel focus-aside"><div className="aside-icon focus-icon">◷</div><div className="eyebrow">NEED A RESET?</div><h3>Find your focus.</h3><p>Set aside a little time for one thing that matters.</p><button className="text-button" onClick={() => onNavigate("focus")}>Open focus timer <span>↗</span></button></section>
      </aside>
    </div>
  </>;
}

function TaskRow({ task, onToggle, onDelete }) {
  return <div className={`task-row ${task.done ? "task-done" : ""}`}>
    <button className={`check-control ${task.done ? "checked" : ""}`} onClick={() => onToggle(task)} aria-label={task.done ? "Mark incomplete" : "Mark complete"}>{task.done ? "✓" : ""}</button>
    <div className="task-copy"><span>{task.title}</span>{task.time && <small>Today · {task.time}</small>}</div>
    {task.type === "routine" && <span className="routine-tag">RITUAL</span>}
    {onDelete && <button className="icon-button delete-button" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>×</button>}
  </div>;
}

function FocusScreen() {
  const [tasks, setTasks] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const selectedTask = tasks.find((task) => task._id === selectedId);

  useEffect(() => { getTasks().then((items) => { const studies = items.filter((task) => task.type !== "routine"); setTasks(studies); if (studies.length) { setSelectedId(studies[0]._id); setSeconds(studies[0].timeSpentSec || 0); } }).catch((e) => setError(e.message)); }, []);
  useEffect(() => { if (!running) return undefined; const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(interval); }, [running]);

  const chooseTask = (task) => { if (running) return; setSelectedId(task._id); setSeconds(task.timeSpentSec || 0); setSaved(false); };
  const toggleTimer = async () => {
    if (!selectedTask) return;
    if (running) {
      setRunning(false);
      try {
        const updated = await updateTask(selectedTask._id, { timeSpentSec: seconds });
        setTasks((items) => items.map((task) => task._id === selectedTask._id ? updated : task));
        setSaved(true); setError("");
      } catch (e) { setError(e.message || "Could not save focus time."); }
    } else { setSaved(false); setRunning(true); }
  };

  return <>
    <PageHeading eyebrow="MAKE ROOM FOR DEEP WORK" title="Find your focus." subtitle="Give one important task your full attention." />
    <Notice>{error}</Notice>
    <div className="focus-layout">
      <section className="panel timer-panel">
        <div className="timer-caption"><span className="live-dot" />{running ? "FOCUS SESSION IN PROGRESS" : "YOUR FOCUS SESSION"}</div>
        <div className={`timer-display ${running ? "timer-running" : ""}`}>{formatTime(seconds)}</div>
        <p className="timer-task-name">{selectedTask ? selectedTask.title : "Choose a task to begin"}</p>
        <button className={`button ${running ? "button-pause" : "button-primary"} timer-button`} onClick={toggleTimer} disabled={!selectedTask}>{running ? <><span>Ⅱ</span> Pause & save</> : <><span>▶</span> Start focusing</>}</button>
        {saved && <div className="saved-label">✓ Focus time saved</div>}
        <div className="timer-tip"><span>✦</span> A focused 25 minutes can make a real difference.</div>
      </section>
      <section className="panel focus-task-panel"><div className="section-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Your study tasks</h2></div></div>
        {tasks.map((task) => <button key={task._id} className={`focus-task-row ${selectedId === task._id ? "selected" : ""}`} onClick={() => chooseTask(task)} disabled={running}><span className="focus-task-check">{task.done ? "✓" : ""}</span><span className="focus-task-copy"><strong>{task.title}</strong><small>{formatTime(task.timeSpentSec || 0)} focused</small></span><span className="focus-arrow">›</span></button>)}
        {!tasks.length && <div className="empty-state compact"><div>✎</div><h3>No study tasks yet</h3><p>Add a task on your Tasks page, then come back here.</p></div>}
      </section>
    </div>
  </>;
}

function SleepScreen() {
  const [bedtime, setBedtime] = useState("23:30");
  const [wakeTime, setWakeTime] = useState("06:30");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getSleep().then((log) => { if (log) { setBedtime(log.bedtime || "23:30"); setWakeTime(log.wakeTime || "06:30"); setResult(log); } }).catch((e) => setError(e.message)); }, []);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSaving(true);
    try { setResult(await saveSleep(bedtime, wakeTime)); }
    catch (e) { setError(e.message || "Could not save your sleep log."); }
    finally { setSaving(false); }
  };

  return <>
    <PageHeading eyebrow="REST IS PART OF THE PLAN" title="How did you sleep?" subtitle="A simple log can help you notice what supports your energy." />
    <Notice>{error}</Notice>
    <div className="sleep-layout">
      <section className="panel sleep-form-panel"><div className="section-heading"><div><div className="eyebrow">LAST NIGHT</div><h2>Log your sleep</h2></div><span className="moon-badge">☾</span></div>
        <form onSubmit={submit}>
          <div className="time-fields"><label className="field-label">I went to bed<input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} required /></label><span className="time-connector">→</span><label className="field-label">I woke up<input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} required /></label></div>
          <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Save sleep log"}</button>
        </form>
        {result?.hours != null && <div className="sleep-result"><span>✦</span><div><strong>{result.hours} hours of rest</strong><small>Your sleep log is saved for today.</small></div><b>✓</b></div>}
      </section>
      <section className="sleep-note-card"><div className="sleep-stars">✦　 ·　 ✧</div><div className="eyebrow">A THOUGHT FOR TONIGHT</div><h2>Rest is productive, too.</h2><p>Sleep gives your mind and body time to reset. A consistent wind-down routine can make it easier to get the rest you need.</p><div className="sleep-note-bottom"><span>Be kind to yourself</span><span>☾</span></div></section>
    </div>
  </>;
}

function HealthScreen() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profile, setProfile] = useState(null);
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { getProfile().then((data) => { if (data) { setProfile(data); setHeight(data.heightCm ? String(data.heightCm) : ""); setWeight(data.weightKg ? String(data.weightKg) : ""); setAdvice(data.lastAdvice || ""); } }).catch((e) => setError(e.message)); }, []);
  const saveMeasurements = async (event) => {
    event.preventDefault(); setError("");
    if (Number(height) <= 0 || Number(weight) <= 0) { setError("Enter a valid height and weight."); return; }
    setSaving(true);
    try { setProfile(await saveProfile(Number(height), Number(weight))); }
    catch (e) { setError(e.message || "Could not save your measurements."); }
    finally { setSaving(false); }
  };
  const sendReport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setAdvice("");
    if (file.type !== "application/pdf") { setError("Choose a PDF file."); event.target.value = ""; return; }
    setUploading(true);
    try { const response = await uploadReport(file); setAdvice(response.advice || "No guidance was returned."); }
    catch (e) { setError(e.message || "Report upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  };

  return <>
    <PageHeading eyebrow="CARE FOR YOUR WHOLE SELF" title="Your health, thoughtfully." subtitle="Keep a few useful details together and get general guidance from your report." />
    <Notice>{error}</Notice>
    <div className="health-grid">
      <section className="panel health-panel"><div className="health-title-icon">♡</div><div className="eyebrow">YOUR MEASUREMENTS</div><h2>A little context</h2><p className="panel-description">Your height and weight help us calculate your BMI.</p>
        <form onSubmit={saveMeasurements}>
          <div className="health-fields"><label className="field-label">Height <span>cm</span><input type="number" inputMode="decimal" min="1" step="0.1" placeholder="e.g. 168" value={height} onChange={(event) => setHeight(event.target.value)} /></label><label className="field-label">Weight <span>kg</span><input type="number" inputMode="decimal" min="1" step="0.1" placeholder="e.g. 62" value={weight} onChange={(event) => setWeight(event.target.value)} /></label></div>
          <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : "Calculate my BMI"}</button>
        </form>
        {profile?.bmi != null && <div className="bmi-result"><div className="bmi-number">{profile.bmi}<small>BMI</small></div><div><strong>{profile.bmiCategory}</strong><span>Based on your latest measurements</span></div><span className="bmi-check">✓</span></div>}
      </section>
      <section className="panel report-panel"><div className="report-top-icon">✧</div><div className="eyebrow">AI-POWERED INSIGHTS</div><h2>Understand your report</h2><p className="panel-description">Upload a blood report PDF to get food and sleep suggestions based on its values.</p>
        <label className={`upload-zone ${uploading ? "uploading" : ""}`}><input type="file" accept="application/pdf,.pdf" onChange={sendReport} disabled={uploading} /><span className="upload-icon">↑</span><strong>{uploading ? "Reviewing your report..." : "Choose a PDF to upload"}</strong><small>PDF only · up to 10 MB</small></label>
        {advice && <div className="advice-box"><div className="advice-heading"><span>✦</span> YOUR PERSONALIZED GUIDANCE</div><p>{advice}</p></div>}
        <div className="medical-note"><span>ⓘ</span> AI suggestions are general guidance, not medical advice.</div>
      </section>
    </div>
  </>;
}

function ScoreScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const breakdownLabels = useMemo(() => ({ water: "Water", study: "Study tasks", sleep: "Sleep", focus: "Focus time", routine: "Routine", digitalHabits: "Digital habits", waterBonus: "Water bonus" }), []);
  const calculate = async () => {
    setLoading(true); setError("");
    try { setData(await getScore()); }
    catch (e) { setError(e.message || "Could not calculate your score."); }
    finally { setLoading(false); }
  };

  return <>
    <PageHeading eyebrow="NOTICE THE GOOD YOU DID" title="Your day, in perspective." subtitle="A reflection on your routines, rest, focus, and digital habits." action={<button className="button button-primary" onClick={calculate} disabled={loading}>{loading ? "Calculating..." : "✳  Calculate today’s score"}</button>} />
    <Notice>{error}</Notice>
    {!data ? <section className="score-intro panel"><div className="score-art"><span>✦</span><span>✳</span><span>·</span></div><div><div className="eyebrow">A DAILY REFLECTION</div><h2>Every day is a fresh start.</h2><p>Calculate your score to see how your small habits came together today. Your score is a guide to help you reflect, never a measure of your worth.</p><button className="button button-primary" onClick={calculate} disabled={loading}>{loading ? "Calculating..." : "Calculate today’s score"}</button></div></section> : <div className="score-layout">
      <section className="panel score-total-panel"><div className="eyebrow">TODAY’S WELLNESS SCORE</div><div className="score-circle" style={{ "--score": `${Math.max(0, Math.min(100, data.score || 0)) * 3.6}deg` }}><div><strong>{data.score ?? "—"}</strong><small>out of 100</small></div></div><p>A snapshot of the habits you showed up for today.</p></section>
      <section className="panel breakdown-panel"><div className="section-heading"><div><div className="eyebrow">THE LITTLE THINGS ADD UP</div><h2>Your day’s breakdown</h2></div></div>
        {Object.entries(data.breakdown || {}).map(([key, value], index) => <div className="score-row" key={key}><span className={`score-row-icon tone-${index % 5}`}>{["◉", "✎", "☾", "◷", "↟"][index % 5]}</span><span className="score-row-name">{breakdownLabels[key] || key}</span><div className="score-track"><span style={{ width: `${Math.min(100, Number(value) * 10)}%` }} /></div><strong>{value}<small> pts</small></strong></div>)}
      </section>
      {data.summary && <section className="panel summary-panel"><span>✦</span><div><div className="eyebrow">A NOTE FOR YOUR DAY</div><p>{data.summary}</p></div></section>}
      <button className="button button-soft recalculate-button" onClick={calculate} disabled={loading}>{loading ? "Updating..." : "↻  Refresh score"}</button>
    </div>}
  </>;
}

function UsageScreen() {
  const [days, setDays] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getUsage(7).then((items) => { setDays(Array.isArray(items) ? items : []); setError(""); }).catch((e) => setError(e.message || "Could not load usage history.")).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const peakMinutes = Math.max(1, ...days.map((day) => Math.max(Number(day.chromeMinutes) || 0, Number(day.youtubeMinutes) || 0)));

  return <>
    <PageHeading eyebrow="YOUR DIGITAL RHYTHM" title="Make space for what matters." subtitle="A gentle look at the screen-time totals synced to your account." action={<button className="button button-soft" onClick={load} disabled={loading}>↻ &nbsp; Refresh</button>} />
    <Notice>{error}</Notice>
    <section className="panel usage-info"><span className="usage-info-icon">⌁</span><p><strong>About these numbers</strong><br />The web app can show usage history synced from the Android app. Browsers do not provide access to device-wide app usage, so this page can’t collect new Chrome or YouTube totals.</p></section>
    <section className="panel usage-panel"><div className="section-heading"><div><div className="eyebrow">LAST 7 DAYS</div><h2>Your screen time</h2></div><div className="usage-legend"><span><i className="chrome-dot" />Chrome</span><span><i className="youtube-dot" />YouTube</span></div></div>
      {loading ? <div className="loading-state"><span className="spinner" />Loading your history...</div> : days.length ? <div className="usage-days">{days.map((day) => <div className="usage-day" key={day.date}><div className="usage-date">{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${day.date}T12:00:00`))}</div><div className="usage-bars"><div className="usage-bar chrome-bar" style={{ height: `${Math.max(4, (Number(day.chromeMinutes) || 0) / peakMinutes * 100)}%` }} title={`Chrome ${day.chromeMinutes} minutes`} /><div className="usage-bar youtube-bar" style={{ height: `${Math.max(4, (Number(day.youtubeMinutes) || 0) / peakMinutes * 100)}%` }} title={`YouTube ${day.youtubeMinutes} minutes`} /></div><strong>{(Number(day.chromeMinutes) || 0) + (Number(day.youtubeMinutes) || 0)}<small> min</small></strong></div>)}</div> : <div className="empty-state"><div>⌁</div><h3>No usage history yet</h3><p>Once your Android app syncs usage data, your daily totals will appear here.</p></div>}
      {days.length > 0 && <div className="usage-table">{days.map((day) => <div className="usage-table-row" key={`table-${day.date}`}><strong>{day.date}</strong><span><i className="chrome-dot" /> Chrome <b>{day.chromeOpens || 0} opens · {day.chromeMinutes || 0} min</b></span><span><i className="youtube-dot" /> YouTube <b>{day.youtubeOpens || 0} opens · {day.youtubeMinutes || 0} min</b></span></div>)}</div>}
    </section>
  </>;
}
