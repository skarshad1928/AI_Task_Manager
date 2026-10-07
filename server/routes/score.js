const express = require("express");
const { calculateDailyScore } = require("../services/dailyScore");
const { ensureWaterRoutines } = require("../services/routines");
const { asyncRoute, httpError } = require("../utils/errors");
const { isValidDate } = require("../utils/date");

function createScoreRouter({ Task, SleepLog, DailyScore }, daySummary) {
  const router = express.Router();
  router.get("/", asyncRoute(async (req, res) => {
    const requested = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(requested, 90)) : 30;
    res.json(await DailyScore.find({}).sort({ date: -1 }).limit(limit).lean());
  }));
  router.post("/:date", asyncRoute(async (req, res) => {
    const { date } = req.params;
    if (!isValidDate(date)) throw httpError(400, "date must be a real date in YYYY-MM-DD format");
    await ensureWaterRoutines(Task, date);
    const [tasks, sleep] = await Promise.all([
      Task.find({ date }).lean(),
      SleepLog.findOne({ date }).lean(),
    ]);
    const { score, breakdown } = calculateDailyScore(tasks, sleep);
    const summary = await daySummary({ date, score, breakdown });
    const saved = await DailyScore.findOneAndUpdate(
      { date }, { $set: { date, score, breakdown, summary } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(saved);
  }));
  return router;
}

module.exports = createScoreRouter;
