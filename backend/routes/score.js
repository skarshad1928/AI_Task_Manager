const router = require("express").Router();
const Task = require("../models/Task");
const SleepLog = require("../models/SleepLog");
const DailyScore = require("../models/DailyScore");
const UsageLog = require("../models/UsageLog");
const { calculateDailyScore } = require("../services/dailyScore");
const { daySummary } = require("../services/gemini");

router.post("/:date", async (req, res) => {
  try {
    const date = req.params.date;
    const tasks = await Task.find({ date });
    const sleep = await SleepLog.findOne({ date });
    const usage = await UsageLog.findOne({ date }).lean();

    const { score, breakdown } = calculateDailyScore(tasks, sleep, usage);
    const summary = await daySummary({ score, breakdown, usage });
    const saved = await DailyScore.findOneAndUpdate({ date }, { date, score, breakdown, summary }, { upsert: true, new: true });
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
