import { useEffect, useState } from "react";
import { finishDay, getScoreHistory, localDate } from "../api.js";
import { Alert, Loading, PageTitle } from "../components/UI.jsx";

const CATEGORIES = [
  ["water", "Water goals", "20 points"],
  ["routine", "Personal routines", "20 points"],
  ["study", "Study tasks", "30 points"],
  ["sleep", "Sleep", "20 points"],
  ["focus", "Focus time", "10 points"],
];

export default function Scores() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setLoading(true);
    try { setHistory(await getScoreHistory()); setError(""); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const finish = async () => {
    setFinishing(true); setError(""); setNotice("");
    try {
      await finishDay(localDate());
      setNotice("Your day is saved. Take a moment to notice the progress you made.");
      await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setFinishing(false); }
  };

  return <>
    <PageTitle kicker="NOTICE THE GOOD YOU DID" title="Your day, in perspective." subtitle="A reflection on your routines, rest, study, and focus." action={<button className="button button-primary" onClick={finish} disabled={finishing}>{finishing ? "Saving your day…" : "✳  Finish my day"}</button>} />
    <Alert>{error}</Alert><Alert type="success">{notice}</Alert>
    <section className="score-guide card"><div className="guide-mark">✦</div><div><div className="kicker">A GENTLE DAILY REFLECTION</div><h2>Every day is a fresh start.</h2><p>Your score is a snapshot of your habits, not a measure of your worth. Water and custom routines are scored separately so water goals count only once.</p><div className="score-key">{CATEGORIES.map(([key, label, max]) => <span key={key}><i className={`key-${key}`} />{label} <small>{max}</small></span>)}</div></div></section>
    <div className="history-heading"><div><div className="kicker">YOUR JOURNEY</div><h2>Score history</h2></div><button className="button button-soft" onClick={refresh} disabled={loading}>↻ &nbsp; Refresh</button></div>
    {loading ? <Loading label="Loading your score history…" /> : history.length ? <div className="score-history">{history.map((entry) => <ScoreCard key={entry._id || entry.date} entry={entry} />)}</div> : <div className="card empty-state"><span>✳</span><h3>Your first reflection is waiting</h3><p>At the end of your day, choose “Finish my day” to save a score and Gemini’s friendly summary.</p></div>}
  </>;
}

function ScoreCard({ entry }) {
  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${entry.date}T12:00:00`));
  return <article className="card score-card">
    <div className="score-card-top"><div><div className="kicker">{date}</div><h3>Daily reflection</h3></div><div className="score-bubble"><strong>{entry.score}</strong><small>/100</small></div></div>
    <div className="breakdown-grid">{CATEGORIES.map(([key, label, max]) => <div className="breakdown-item" key={key}><span>{label}</span><strong>{entry.breakdown?.[key] ?? 0}<small> / {Number.parseInt(max, 10)}</small></strong></div>)}</div>
    <div className="score-summary"><span>✦</span><p>{entry.summary}</p></div>
  </article>;
}
