import { useEffect, useState } from "react";
import { getSleep, localDate, saveSleep } from "../api.js";
import { Alert, Loading, PageTitle } from "../components/UI.jsx";

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function Sleep() {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [wakeups, setWakeups] = useState(0);
  const [sleepLog, setSleepLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getSleep().then((data) => {
      if (data) {
        setSleepLog(data);
        setBedtime(data.bedtime);
        setWakeTime(data.wakeTime);
        setWakeups(data.wakeups ?? 0);
      }
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const data = await saveSleep({ date: localDate(), bedtime, wakeTime, wakeups });
      setSleepLog(data); setWakeups(data.wakeups ?? wakeups); setNotice("Your sleep log is saved.");
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  return <>
    <PageTitle kicker="REST IS PART OF THE PLAN" title="How did you sleep?" subtitle="Track your bedtime and wake-up time to notice your patterns." />
    <Alert>{error}</Alert><Alert type="success">{notice}</Alert>
    <div className="sleep-layout">
      <section className="card sleep-form-card">
        <div className="card-heading"><div><div className="kicker">LAST NIGHT</div><h2>Log your sleep</h2></div><span className="moon-badge">☾</span></div>
        {loading ? <Loading /> : <form className="sleep-form" onSubmit={submit}>
          <label className="field-label">Sleep start<input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} required /><button className="button button-soft time-capture" type="button" onClick={() => setBedtime(currentTime())}>Start now</button></label>
          <span className="sleep-arrow">→</span>
          <label className="field-label">Sleep end<input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} required /><button className="button button-soft time-capture" type="button" onClick={() => setWakeTime(currentTime())}>End now</button></label>
          <div className="wake-count-row">
            <div><strong>Wake-ups during the night</strong><small>Count a waking; this button does not record a time.</small></div>
            <output aria-live="polite" aria-label="Wake-up count">{wakeups}</output>
            <button className="button button-soft" type="button" onClick={() => setWakeups((count) => Math.min(count + 1, 100))} disabled={wakeups >= 100}>Count</button>
          </div>
          <button className="button button-primary save-sleep" disabled={saving}>{saving ? "Saving…" : "Save sleep log"}</button>
        </form>}
        {sleepLog && <div className="sleep-result"><span>✦</span><div><strong>{sleepLog.hours} hours of rest</strong><small>{sleepLog.wakeups ?? 0} middle-of-night wake-ups · saved for {sleepLog.date}</small></div><b>✓</b></div>}
      </section>
      <aside className="sleep-note"><div className="sleep-stars">✦　 ·　 ✧</div><div className="kicker">A THOUGHT FOR TONIGHT</div><h2>Rest is productive, too.</h2><p>Sleep gives your mind and body time to reset. A steady wind-down routine can make it easier to get the rest you need.</p><div className="sleep-note-foot"><span>Be kind to yourself</span><span>☾</span></div></aside>
    </div>
  </>;
}
