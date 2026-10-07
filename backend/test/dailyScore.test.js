const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateDailyScore } = require("../services/dailyScore");

test("all goals with usage below the limits total 100 points", () => {
  const result = calculateDailyScore(
    [
      { type: "routine", done: true },
      { type: "routine", done: true },
      { type: "study", done: true, timeSpentSec: 3600 },
    ],
    { hours: 8, bedtime: "22:30" },
    { chromeMinutes: 120, youtubeMinutes: 120 }
  );

  assert.equal(result.score, 100);
  assert.deepEqual(result.breakdown, {
    water: 15,
    study: 25,
    sleep: 20,
    focus: 10,
    routine: 10,
    habits: 10,
    waterBonus: 10,
  });
});

test("each app over 120 minutes removes five digital-habits points", () => {
  const result = calculateDailyScore([], null, { chromeMinutes: 121, youtubeMinutes: 121 });

  assert.equal(result.breakdown.habits, 0);
});

test("missing usage data does not award digital-habits points", () => {
  const result = calculateDailyScore([], null, null);

  assert.equal(result.breakdown.habits, 0);
});