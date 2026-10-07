const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const today = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok || (data && typeof data === "object" && data.error)) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
}

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getTasks = () => request(`/tasks?date=${today()}`);
export const addTask = (title) => request("/tasks", json("POST", { title, date: today() }));
export const updateTask = (id, data) => request(`/tasks/${id}`, json("PUT", data));
export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });
export const getSleep = () => request(`/sleep/${today()}`);
export const saveSleep = (bedtime, wakeTime) => request("/sleep", json("POST", { date: today(), bedtime, wakeTime }));
export const getProfile = () => request("/profile");
export const saveProfile = (heightCm, weightKg) => request("/profile", json("POST", { heightCm, weightKg }));
export const getScore = () => request(`/score/${today()}`, { method: "POST" });
export const getUsage = (days = 7) => request(`/usage?days=${days}`);

export async function uploadReport(file) {
  const form = new FormData();
  form.append("pdf", file, file.name);
  return request("/report", { method: "POST", body: form });
}
