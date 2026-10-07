const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const { createApp } = require("../app");
const { calculateDailyScore } = require("../services/dailyScore");

const DAY = new Date().toISOString().slice(0, 10);

function query(value) {
  return {
    sort() { return this; },
    limit() { return this; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

function makeModels() {
  const data = { tasks: [], sleeps: [], profile: null, scores: [] };
  let nextId = 1;
  const id = () => String(nextId++).padStart(24, "0");
  const matches = (item, filter) => Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && "$gte" in value) return item[key] >= value.$gte && item[key] <= value.$lte;
    return item[key] === value;
  });

  const Task = {
    exists: async (filter) => data.tasks.some((item) => matches(item, filter)),
    create: async (record) => { const item = { _id: id(), done: false, timeSpentSec: 0, ...record }; data.tasks.push(item); return item; },
    find: (filter = {}) => query(data.tasks.filter((item) => matches(item, filter))),
    findById: (itemId) => query(data.tasks.find((item) => item._id === itemId) || null),
    findByIdAndUpdate: (itemId, change) => {
      const item = data.tasks.find((record) => record._id === itemId);
      if (item) Object.assign(item, change.$set);
      return query(item || null);
    },
    findByIdAndDelete: async (itemId) => {
      const index = data.tasks.findIndex((item) => item._id === itemId);
      return index < 0 ? null : data.tasks.splice(index, 1)[0];
    },
  };

  const SleepLog = {
    findOne: (filter) => query(data.sleeps.find((item) => matches(item, filter)) || null),
    find: (filter = {}) => query(data.sleeps.filter((item) => matches(item, filter))),
    findOneAndUpdate: (filter, change) => {
      let item = data.sleeps.find((record) => matches(record, filter));
      if (!item) { item = { _id: id() }; data.sleeps.push(item); }
      Object.assign(item, change.$set);
      return query(item);
    },
  };

  const Profile = {
    findOne: () => query(data.profile),
    findOneAndUpdate: (_filter, change) => {
      data.profile = { _id: data.profile?._id || id(), ...data.profile, ...change.$set };
      return query(data.profile);
    },
  };

  const DailyScore = {
    find: () => query([...data.scores].sort((a, b) => b.date.localeCompare(a.date))),
    findOneAndUpdate: (_filter, change) => {
      let item = data.scores.find((record) => record.date === change.$set.date);
      if (!item) { item = { _id: id() }; data.scores.push(item); }
      Object.assign(item, change.$set);
      return query(item);
    },
  };

  return { models: { Task, SleepLog, Profile, DailyScore }, data };
}

async function json(response) {
  return response.json();
}

test("API routes support the task, sleep, profile, blood report, and score workflows", async (t) => {
  const { models, data } = makeModels();
  let reportContext;
  const app = createApp({
    models,
    services: {
      foodAdvice: async (_buffer, context) => { reportContext = context; return "Add lentils with lemon and keep a steady bedtime.\n\nGeneral guidance only - please consult a doctor."; },
      daySummary: async ({ date, score }) => `A thoughtful day on ${date}. You scored ${score}. Try one small step tomorrow.`,
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const healthResponse = await fetch(`${base}/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await json(healthResponse), { ok: true });

  const taskListResponse = await fetch(`${base}/tasks?date=${DAY}`);
  assert.equal(taskListResponse.status, 200);
  const dailyTasks = await json(taskListResponse);
  assert.equal(dailyTasks.length, 2);
  assert.deepEqual(dailyTasks.map((task) => task.time), ["10:00", "17:00"]);

  const createdResponse = await fetch(`${base}/tasks`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Read a chapter", type: "study", date: DAY }),
  });
  assert.equal(createdResponse.status, 201);
  const createdTask = await json(createdResponse);

  const updatedResponse = await fetch(`${base}/tasks/${createdTask._id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done: true, timeSpentSec: 900 }),
  });
  assert.equal(updatedResponse.status, 200);
  assert.equal((await json(updatedResponse)).timeSpentSec, 900);

  const deletedResponse = await fetch(`${base}/tasks/${createdTask._id}`, { method: "DELETE" });
  assert.equal(deletedResponse.status, 200);
  assert.deepEqual(await json(deletedResponse), { ok: true });

  const sleepResponse = await fetch(`${base}/sleep`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: DAY, bedtime: "23:30", wakeTime: "06:30" }),
  });
  assert.equal(sleepResponse.status, 200);
  assert.equal((await json(sleepResponse)).hours, 7);
  const readSleepResponse = await fetch(`${base}/sleep/${DAY}`);
  assert.equal((await json(readSleepResponse)).wakeTime, "06:30");

  const readProfileResponse = await fetch(`${base}/profile`);
  assert.equal(await json(readProfileResponse), null);
  const profileResponse = await fetch(`${base}/profile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heightCm: 170, weightKg: 65 }),
  });
  const profile = await json(profileResponse);
  assert.equal(profile.bmi, 22.5);
  assert.equal(profile.bmiCategory, "Normal");

  const form = new FormData();
  form.append("pdf", new Blob(["%PDF-1.4 sample"], { type: "application/pdf" }), "blood-report.pdf");
  const reportResponse = await fetch(`${base}/report`, { method: "POST", body: form });
  assert.equal(reportResponse.status, 200);
  assert.match((await json(reportResponse)).advice, /consult a doctor\.$/);
  assert.deepEqual(reportContext, { bmi: 22.5, bmiCategory: "Normal", averageSleep: 7 });
  assert.match(data.profile.lastAdvice, /consult a doctor\.$/);

  const finishResponse = await fetch(`${base}/score/${DAY}`, { method: "POST" });
  assert.equal(finishResponse.status, 200);
  const score = await json(finishResponse);
  assert.equal(score.score, 40);
  assert.equal(score.breakdown.water, 0);
  assert.equal(score.breakdown.routine, 20);
  assert.equal(Object.values(score.breakdown).reduce((sum, value) => sum + value, 0), score.score);
  const historyResponse = await fetch(`${base}/score`);
  assert.equal((await json(historyResponse)).length, 1);

  const invalidProfile = await fetch(`${base}/profile`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heightCm: -1, weightKg: 0 }),
  });
  assert.equal(invalidProfile.status, 400);
  assert.equal(typeof (await json(invalidProfile)).error, "string");

  const badOrigin = await fetch(`${base}/health`, { headers: { Origin: "https://untrusted.example" } });
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  assert.equal(badOrigin.headers.get("access-control-allow-origin"), allowedOrigin);
  assert.notEqual(badOrigin.headers.get("access-control-allow-origin"), "https://untrusted.example");
});

test("daily score totals 100 and water is not counted as a personal routine", () => {
  const tasks = [
    { type: "water", done: true },
    { type: "water", done: true },
    { type: "routine", done: true },
    { type: "study", done: true, timeSpentSec: 3600 },
  ];
  const full = calculateDailyScore(tasks, { bedtime: "22:30", hours: 8 });
  assert.deepEqual(full.breakdown, { water: 20, routine: 20, study: 30, sleep: 20, focus: 10 });
  assert.equal(full.score, 100);

  const noWater = calculateDailyScore([{ type: "water", done: false }], null);
  const completeWater = calculateDailyScore([{ type: "water", done: true }], null);
  assert.equal(noWater.breakdown.routine, completeWater.breakdown.routine);
  assert.equal(completeWater.breakdown.water - noWater.breakdown.water, 10);
});
