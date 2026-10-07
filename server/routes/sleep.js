const express = require("express");
const { asyncRoute, httpError } = require("../utils/errors");
const { isValidDate, today } = require("../utils/date");

const isTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const minutes = (value) => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};

function createSleepRouter(SleepLog) {
  const router = express.Router();
  router.post("/", asyncRoute(async (req, res) => {
    const { bedtime, wakeTime } = req.body;
    const date = req.body.date || today();
    if (!isValidDate(date)) throw httpError(400, "date must be a real date in YYYY-MM-DD format");
    if (!isTime(bedtime) || !isTime(wakeTime)) throw httpError(400, "bedtime and wakeTime must use 24-hour HH:MM format");
    let elapsed = minutes(wakeTime) - minutes(bedtime);
    if (elapsed <= 0) elapsed += 24 * 60;
    const hours = Math.round((elapsed / 60) * 10) / 10;
    const log = await SleepLog.findOneAndUpdate(
      { date }, { $set: { date, bedtime, wakeTime, hours } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(log);
  }));
  router.get("/:date", asyncRoute(async (req, res) => {
    if (!isValidDate(req.params.date)) throw httpError(400, "date must be a real date in YYYY-MM-DD format");
    res.json(await SleepLog.findOne({ date: req.params.date }).lean());
  }));
  return router;
}

module.exports = createSleepRouter;
