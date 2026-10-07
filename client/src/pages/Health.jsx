import { useEffect, useState } from "react";
import { getProfile, saveProfile, uploadBloodReport } from "../api.js";
import { Alert, Loading, PageTitle } from "../components/UI.jsx";

export default function Health() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [profile, setProfile] = useState(null);
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getProfile().then((data) => {
      if (data) {
        setProfile(data);
        setHeight(data.heightCm ? String(data.heightCm) : "");
        setWeight(data.weightKg ? String(data.weightKg) : "");
        setAdvice(data.lastAdvice || "");
      }
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);

  const saveMeasurements = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try { setProfile(await saveProfile({ heightCm: Number(height), weightKg: Number(weight) })); setNotice("Your measurements are saved."); }
    catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice("");
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please choose a PDF file."); event.target.value = ""; return;
    }
    if (file.size > 10 * 1024 * 1024) { setError("PDFs must be 10 MB or smaller."); event.target.value = ""; return; }
    setUploading(true);
    try { const response = await uploadBloodReport(file); setAdvice(response.advice); setNotice("Your report guidance is ready."); }
    catch (requestError) { setError(requestError.message); }
    finally { setUploading(false); event.target.value = ""; }
  };

  return <>
    <PageTitle kicker="CARE FOR YOUR WHOLE SELF" title="Your health, thoughtfully." subtitle="Keep useful details close and get general guidance from your blood report." />
    <Alert>{error}</Alert><Alert type="success">{notice}</Alert>
    {loading ? <Loading /> : <div className="health-grid">
      <section className="card health-card">
        <div className="health-icon">♡</div><div className="kicker">YOUR MEASUREMENTS</div><h2>A little context</h2><p className="card-copy">Your height and weight help us calculate your BMI on the server.</p>
        <form className="health-form" onSubmit={saveMeasurements}>
          <label className="field-label">Height <small>cm</small><input type="number" min="30" max="275" step="0.1" inputMode="decimal" placeholder="e.g. 168" value={height} onChange={(event) => setHeight(event.target.value)} required /></label>
          <label className="field-label">Weight <small>kg</small><input type="number" min="2" max="500" step="0.1" inputMode="decimal" placeholder="e.g. 62" value={weight} onChange={(event) => setWeight(event.target.value)} required /></label>
          <button className="button button-primary full-width" disabled={saving}>{saving ? "Saving…" : "Calculate my BMI"}</button>
        </form>
        {profile?.bmi != null && <div className="bmi-result"><strong>{profile.bmi}<small>BMI</small></strong><span><b>{profile.bmiCategory}</b><small>From your latest measurements</small></span><i>✓</i></div>}
      </section>

      <section className="card report-card">
        <div className="report-icon">✧</div><div className="kicker">AI-POWERED INSIGHTS</div><h2>Understand your report</h2><p className="card-copy">Upload a blood report PDF for food suggestions and practical sleep tips.</p>
        <label className={`upload-zone ${uploading ? "busy" : ""}`}><input type="file" accept="application/pdf,.pdf" onChange={upload} disabled={uploading} /><span className="upload-arrow">↑</span><strong>{uploading ? "Reviewing your report…" : "Choose a PDF to upload"}</strong><small>PDF only · up to 10 MB</small></label>
        {advice && <div className="advice-box"><div className="advice-heading">✦ &nbsp;YOUR GUIDANCE</div><p>{advice}</p></div>}
        <div className="medical-note">ⓘ &nbsp;AI suggestions are general guidance, not medical advice.</div>
      </section>
    </div>}
  </>;
}
