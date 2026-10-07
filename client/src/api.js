const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function request(path, options = {}) {
  if (!API_URL) throw new Error("Set VITE_API_URL in client/.env to connect to the server.");
  const response = await fetch(`${API_URL}${path}`, options);
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

export function uploadBloodReport(file) {
  const form = new FormData();
  form.append("pdf", file, file.name);
  return request("/report", { method: "POST", body: form });
}
