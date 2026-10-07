const router = require("express").Router();
const UsageLog = require("../models/UsageLog");

const validDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date || "");
const metrics = ["chromeOpens", "chromeMinutes", "youtubeOpens", "youtubeMinutes"];

router.post("/", async (req, res) => {
  try {
    const { date } = req.body;
    if (!validDate(date)) return res.status(400).json({ error: "date must use YYYY-MM-DD" });
    if (metrics.some((key) => !Number.isFinite(req.body[key]) || req.body[key] < 0)) {
      return res.status(400).json({ error: "Usage values must be non-negative numbers" });
    }

    const saved = await UsageLog.findOneAndUpdate(
      { date },
      Object.fromEntries(["date", ...metrics].map((key) => [key, req.body[key]])),
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const parsedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isFinite(parsedDays) ? Math.min(30, Math.max(1, parsedDays)) : 7;
    const firstDate = new Date();
    firstDate.setUTCHours(0, 0, 0, 0);
    firstDate.setUTCDate(firstDate.getUTCDate() - days + 1);

    const logs = await UsageLog.find({ date: { $gte: firstDate.toISOString().slice(0, 10) } })
      .sort({ date: -1 })
      .limit(days)
      .lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;