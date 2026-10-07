import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTasks, localDate, updateTask } from "../api.js";
import { Alert, Loading, PageTitle } from "../components/UI.jsx";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [remindersOn, setRemindersOn] = useState(() => localStorage.getItem("daylight-water-reminders") === "on");

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setTasks(await getTasks()); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const completed = tasks.filter((task) => task.done).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const toggleTask = async (task) => {
    try {
      const updated = await updateTask(task._id, { done: !task.done });
      setTasks((items) => items.map((item) => item._id === task._id ? updated : item));
      setError("");
    } catch (requestError) { setError(requestError.message); }
  };

  const enableReminders = async () => {
    if (!("Notification" in window)) { setReminderMessage("This browser does not support notifications."); return; }
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") { setReminderMessage("Allow notifications in your browser to turn on water reminders."); return; }
    localStorage.setItem("daylight-water-reminders", "on");
    setRemindersOn(true);
    setReminderMessage("Reminders are on while the app or PWA is open.");
  };

  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const waterTasks = tasks.filter((task) => task.type === "water");
  const plannedTasks = tasks.filter((task) => task.type !== "water");

  return <>
    <PageTitle kicker="YOUR DAY, YOUR PACE" title="Make today count." subtitle={dateLabel} action={<button className="button button-soft" onClick={enableReminders}>{remindersOn ? "✓ Reminders on" : "♧ Enable water reminders"}</button>} />
    <Alert>{error}</Alert>
    <Alert type="success">{reminderMessage}</Alert>
    <div className="reminder-note"><span>ⓘ</span><p>Water reminders are browser notifications at 10:00 and 17:00. They work while this app or PWA is open.</p></div>

    <section className="hero-card">
      <div className="hero-content"><div className="hero-kicker">A FRESH START, EVERY DAY <span>✦</span></div><h2>Small steps add up.</h2><p>You’ve completed <strong>{completed} of {tasks.length}</strong> tasks today. Keep your momentum going.</p><Link to="/tasks" className="hero-link">See your tasks <span>→</span></Link></div>
      <div className="progress-donut" style={{ "--progress": `${percent * 3.6}deg` }}><div><strong>{percent}%</strong><small>complete</small></div></div>
      <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
    </section>

    <div className="dashboard-grid">
      <section className="card today-card">
        <div className="card-heading"><div><div className="kicker">YOUR DAILY FLOW</div><h2>Today’s plan <span className="count-badge">{tasks.length}</span></h2></div><span className="subtle">{completed} complete</span></div>
        {loading ? <Loading label="Loading today’s tasks…" /> : <>
          <div className="task-section-label"><span className="section-icon water-icon">↟</span><strong>Water breaks</strong><span>{waterTasks.filter((task) => task.done).length}/{waterTasks.length}</span></div>
          {waterTasks.map((task) => <TaskLine key={task._id} task={task} onToggle={toggleTask} />)}
          <div className="task-section-label planned-label"><span className="section-icon plan-icon">✎</span><strong>Study & routines</strong><span>{plannedTasks.filter((task) => task.done).length}/{plannedTasks.length}</span></div>
          {plannedTasks.slice(0, 4).map((task) => <TaskLine key={task._id} task={task} onToggle={toggleTask} />)}
          {!tasks.length && <div className="empty-inline">Your tasks for today will show up here.</div>}
          {plannedTasks.length > 4 && <Link to="/tasks" className="inline-link">See all tasks →</Link>}
        </>}
      </section>
      <aside className="dashboard-aside">
        <section className="card thought-card"><div className="thought-icon">☼</div><div className="kicker">A GENTLE REMINDER</div><h3>Progress over perfection.</h3><p>You don’t need to do everything at once. Choose the next right thing and begin there.</p></section>
        <section className="card thought-card focus-prompt"><div className="thought-icon">◷</div><div className="kicker">NEED A RESET?</div><h3>Find a little focus.</h3><p>Give one important task your full attention.</p><Link to="/tasks" className="inline-link">Start a focus session →</Link></section>
      </aside>
    </div>
  </>;
}

function TaskLine({ task, onToggle }) {
  return <div className={`task-line ${task.done ? "completed" : ""}`}>
    <button className={`check-button ${task.done ? "checked" : ""}`} onClick={() => onToggle(task)} aria-label={task.done ? "Mark incomplete" : "Mark complete"}>{task.done ? "✓" : ""}</button>
    <span className="task-line-title">{task.title}</span>
    {task.time && <span className="task-time">{task.time}</span>}
  </div>;
}
