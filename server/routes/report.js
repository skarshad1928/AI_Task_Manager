const express = require("express");
const multer = require("multer");
const { asyncRoute, httpError } = require("../utils/errors");
const { dateDaysAgo, today } = require("../utils/date");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const isCsv = file.originalname.toLowerCase().endsWith(".csv");
    callback(isCsv ? null : httpError(400, "upload a CSV file"), isCsv);
  },
});

function createReportRouter({ Profile, SleepLog }, foodAdvice) {
  const router = express.Router();
  router.post("/", upload.single("csv"), asyncRoute(async (req, res) => {
    if (!req.file) throw httpError(400, "attach a CSV file using the multipart field 'csv'");
    const csvText = req.file.buffer.toString("utf8").replace(/^\uFEFF/, "").trim();
    if (!csvText) throw httpError(400, "the CSV file is empty");
    if (csvText.includes("\u0000")) throw httpError(400, "the CSV file must contain UTF-8 text");
    const [profile, sleepLogs] = await Promise.all([
      Profile.findOne({}).lean(),
      SleepLog.find({ date: { $gte: dateDaysAgo(6), $lte: today() } }).sort({ date: -1 }).lean(),
    ]);
    const averageSleep = sleepLogs.length
      ? Math.round((sleepLogs.reduce((sum, entry) => sum + entry.hours, 0) / sleepLogs.length) * 10) / 10
      : null;
    const advice = await foodAdvice(csvText, {
      bmi: profile?.bmi ?? null,
      bmiCategory: profile?.bmiCategory ?? null,
      averageSleep,
    });
    await Profile.findOneAndUpdate({}, { $set: { lastAdvice: advice } }, { upsert: true, new: true });
    res.json({ advice, averageSleep });
  }));
  return router;
}

module.exports = createReportRouter;
