const router = require("express").Router();
const SleepLog = require("../models/SleepLog");

const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

router.post("/", async (req, res) => {
  const { date, bedtime, wakeTime } = req.body;
  let diff = toMin(wakeTime) - toMin(bedtime);
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.round((diff / 60) * 10) / 10;
  const log = await SleepLog.findOneAndUpdate({ date }, { date, bedtime, wakeTime, hours }, { upsert: true, new: true });
  res.json(log);
});

router.get("/:date", async (req, res) => res.json(await SleepLog.findOne({ date: req.params.date })));
module.exports = router;
