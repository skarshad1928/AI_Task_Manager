const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();
const API_URL = (configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5000/api" : "")).replace(/\/+$/, "");
const API_CHECK_TIMEOUT_MS = 30_000;

export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function checkBackendConnection() {
  if (!API_URL) {
    return { ok: false, durationMs: 0, message: "VITE_API_URL is not configured for this build." };
  }

  const controller = new AbortController();
  const startedAt = Date.now();
  const timeoutId = setTimeout(() => controller.abort(), API_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;
    if (!response.ok) {
      return { ok: false, durationMs, message: `The API responded with HTTP ${response.status}.` };
    }

    const health = await response.json();
    if (health?.ok !== true) {
      return { ok: false, durationMs, message: "The API responded, but its health check did not pass." };
    }

    return { ok: true, durationMs, message: `Backend connected in ${durationMs} ms.` };
  } catch {
    const message = controller.signal.aborted
      ? "No response after 30 seconds."
      : "No API response. Check the server, VITE_API_URL, or browser CORS settings.";
    return { ok: false, durationMs: Date.now() - startedAt, message };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request(path, options = {}) {
  if (!API_URL) throw new Error("Set VITE_API_URL in client/.env to connect to the server.");
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch (error) {
    throw new Error(`Cannot reach the API at ${API_URL}. Start the server or check VITE_API_URL.`, { cause: error });
  }
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || `Server request failed (${response.status})`);
  return data;
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getTasks = (date = localDate()) => request(`/tasks?date=${encodeURIComponent(date)}`);
export const createTask = (data) => request("/tasks", json("POST", data));
export const updateTask = (id, data) => request(`/tasks/${encodeURIComponent(id)}`, json("PUT", data));
export const deleteTask = (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
export const saveSleep = (data) => request("/sleep", json("POST", data));
export const getSleep = (date = localDate()) => request(`/sleep/${encodeURIComponent(date)}`);
export const getProfile = () => request("/profile");
export const saveProfile = (data) => request("/profile", json("POST", data));
export const getScoreHistory = () => request("/score");
export const finishDay = (date = localDate()) => request(`/score/${encodeURIComponent(date)}`, { method: "POST" });

export function uploadBloodReportCsv(file) {
  const form = new FormData();
  form.append("csv", file, file.name);
  return request("/report", { method: "POST", body: form });
}
