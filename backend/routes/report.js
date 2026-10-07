const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const Profile = require("../models/Profile");
const SleepLog = require("../models/SleepLog");
const { foodAdvice } = require("../services/gemini");

router.post("/", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
    const profile = (await Profile.findOne()) || {};
    const logs = await SleepLog.find().sort({ date: -1 }).limit(7);
    const sleep = logs.length ? (logs.reduce((a, l) => a + l.hours, 0) / logs.length).toFixed(1) : null;
    const advice = await foodAdvice(req.file.buffer, { bmi: profile.bmi, bmiCategory: profile.bmiCategory, sleep });
    await Profile.findOneAndUpdate({}, { lastAdvice: advice }, { upsert: true });
    res.json({ advice });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
