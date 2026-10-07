const router = require("express").Router();
const Task = require("../models/Task");
const SleepLog = require("../models/SleepLog");
const DailyScore = require("../models/DailyScore");
const { daySummary } = require("../services/gemini");

router.post("/:date", async (req, res) => {
  try {
    const date = req.params.date;
    const tasks = await Task.find({ date });
    const water = tasks.filter((t) => t.type === "routine");
    const study = tasks.filter((t) => t.type === "study");
    const sleep = await SleepLog.findOne({ date });

    const ratio = (arr) => (arr.length ? arr.filter((t) => t.done).length / arr.length : 0);
    const focusMin = study.reduce((a, t) => a + t.timeSpentSec, 0) / 60;

    let sleepScore = 0;
    if (sleep) {
      const h = sleep.hours;
      sleepScore = h >= 7 && h <= 9 ? 15 : h >= 6 ? 10 : 5;
      const bedHour = Number(sleep.bedtime.split(":")[0]);
      if (bedHour >= 21 && bedHour <= 23) sleepScore += 5; // bedtime before midnight
    }

    const breakdown = {
      water: Math.round(ratio(water) * 20),
      study: Math.round(ratio(study) * 30),
      sleep: sleepScore,
      focus: Math.min(10, Math.round((focusMin / 60) * 10)), // 60 min focus = full 10
    };
    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const summary = await daySummary({ score, breakdown });
    const saved = await DailyScore.findOneAndUpdate({ date }, { date, score, breakdown, summary }, { upsert: true, new: true });
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
