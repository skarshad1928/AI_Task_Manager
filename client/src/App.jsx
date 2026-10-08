import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { checkBackendConnection, localDate } from "./api.js";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Sleep from "./pages/Sleep.jsx";
import Health from "./pages/Health.jsx";
import Scores from "./pages/Scores.jsx";

const REMINDER_SCHEDULE = [
  { id: "water-10", type: "water", hour: 10, minute: 0, title: "Water reminder", body: "Drink 1 liter of water now." },
  { id: "breakfast", type: "meal", hour: 8, minute: 30, title: "Breakfast reminder", body: "It’s time for breakfast." },
  { id: "lunch", type: "meal", hour: 12, minute: 40, title: "Lunch reminder", body: "It’s time for lunch." },
  { id: "dinner", type: "meal", hour: 19, minute: 45, title: "Dinner reminder", body: "It’s time for dinner." },
  { id: "water-17", type: "water", hour: 17, minute: 0, title: "Water reminder", body: "Drink 1 liter of water now." },
];

const NAVIGATION = [
  { to: "/", label: "Today", icon: "⌂", end: true },
  { to: "/tasks", label: "Tasks & focus", icon: "✓" },
  { to: "/sleep", label: "Sleep", icon: "☾" },
  { to: "/health", label: "Health", icon: "♡" },
  { to: "/scores", label: "Score history", icon: "✳" },
];

export default function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}>
    <Route index element={<Dashboard />} />
    <Route path="tasks" element={<Tasks />} />
    <Route path="sleep" element={<Sleep />} />
    <Route path="health" element={<Health />} />
    <Route path="scores" element={<Scores />} />
    <Route path="*" element={<Dashboard />} />
  </Route></Routes></BrowserRouter>;
}

function Layout() {
  const location = useLocation();
  const [installEvent, setInstallEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendCheck, setBackendCheck] = useState({ state: "idle", message: "" });
  const activePage = NAVIGATION.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label || "Today";

  useEffect(() => {
    const onInstall = (event) => { event.preventDefault(); setInstallEvent(event); };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const notifyIfDue = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const waterEnabled = localStorage.getItem("daylight-water-reminders") === "on";
      const mealsEnabled = localStorage.getItem("daylight-meal-reminders") === "on";
      if (!waterEnabled && !mealsEnabled) return;
      const now = new Date();
      for (const reminder of REMINDER_SCHEDULE) {
        const enabled = reminder.type === "water" ? waterEnabled : mealsEnabled;
        if (!enabled || now.getHours() !== reminder.hour || now.getMinutes() !== reminder.minute) continue;
        const key = reminder.type === "water"
          ? `daylight-water-${localDate()}-${reminder.hour}`
          : `daylight-${reminder.id}-${localDate()}`;
        if (localStorage.getItem(key) === "sent") continue;
        new Notification(reminder.title, { body: reminder.body });
        localStorage.setItem(key, "sent");
      }
    };
    notifyIfDue();
    const timer = window.setInterval(notifyIfDue, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  const checkBackend = async () => {
    setBackendCheck({ state: "checking", message: "Checking backend, with a 30-second timeout." });
    const result = await checkBackendConnection();
    setBackendCheck({ state: result.ok ? "connected" : "unavailable", ...result });
  };

  const backendStatusLabel = backendCheck.state === "checking"
    ? "Checking…"
    : backendCheck.state === "connected"
      ? `Connected · ${backendCheck.durationMs} ms`
      : backendCheck.state === "unavailable" ? "Backend unavailable" : "";

  return <div className="app-layout">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-icon">d</span><span>daylight<small>AI TASK MANAGER</small></span></NavLink>
      <div className="nav-caption">YOUR SPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {NAVIGATION.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          <span className="nav-symbol">{item.icon}</span><span>{item.label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-quote"><span>✦</span><strong>A little progress<br />goes a long way.</strong><small>Keep showing up for yourself.</small></div>
      <div className="profile-chip"><div className="profile-avatar">Y</div><div><strong>Your workspace</strong><small>One day at a time</small></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <NavLink to="/" className="mobile-brand"><span className="brand-icon">d</span> daylight</NavLink>
        <div className="crumb">My day <span>/</span> <strong>{activePage}</strong></div>
        <div className="topbar-actions">
          <div className="backend-check-group">
            <button
              type="button"
              className="backend-check-button"
              onClick={checkBackend}
              disabled={backendCheck.state === "checking"}
              title={backendCheck.message || "Check whether the backend responds. Times out after 30 seconds."}
              aria-label="Check backend connection"
            >{backendCheck.state === "checking" ? "Checking…" : "Check API"}</button>
            {backendStatusLabel && <span className={`backend-check-result ${backendCheck.state}`} role="status" aria-live="polite" title={backendCheck.message}>{backendStatusLabel}</span>}
          </div>
          <span className={`connection ${isOnline ? "connected" : "disconnected"}`}><i />{isOnline ? "Online" : "Offline"}</span>
          {installEvent && <button className="install-button" onClick={install}>＋ Install app</button>}
        </div>
      </header>
      <div className="page-wrap"><Outlet /></div>
    </main>

    <nav className="bottom-nav" aria-label="Mobile navigation">
      {NAVIGATION.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-link ${isActive ? "active" : ""}`}>
        <span>{item.icon}</span><small>{item.label}</small>
      </NavLink>)}
    </nav>
  </div>;
}
