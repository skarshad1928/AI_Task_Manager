import { API_URL } from "../config";

export const today = () => new Date().toISOString().slice(0, 10);

const call = async (path, method = "GET", body) => {
  const res = await fetch(API_URL + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

export const getTasks = () => call(`/tasks?date=${today()}`);
export const addTask = (title) => call("/tasks", "POST", { title, date: today() });
export const updateTask = (id, data) => call(`/tasks/${id}`, "PUT", data);
export const deleteTask = (id) => call(`/tasks/${id}`, "DELETE");
export const saveSleep = (bedtime, wakeTime) => call("/sleep", "POST", { date: today(), bedtime, wakeTime });
export const getProfile = () => call("/profile");
export const saveProfile = (heightCm, weightKg) => call("/profile", "POST", { heightCm, weightKg });
export const getScore = () => call(`/score/${today()}`, "POST");

export const uploadReport = async (file) => {
  const form = new FormData();
  form.append("pdf", { uri: file.uri, name: file.name, type: "application/pdf" });
  const res = await fetch(API_URL + "/report", { method: "POST", body: form });
  return res.json();
};
