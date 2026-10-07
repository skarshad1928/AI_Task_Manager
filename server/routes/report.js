const express = require("express");
const multer = require("multer");
const { asyncRoute, httpError } = require("../utils/errors");
const { dateDaysAgo, today } = require("../utils/date");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    callback(isPdf ? null : httpError(400, "upload a PDF file"), isPdf);
  },
});

function createReportRouter({ Profile, SleepLog }, foodAdvice) {
  const router = express.Router();
  router.post("/", upload.single("pdf"), asyncRoute(async (req, res) => {
    if (!req.file) throw httpError(400, "attach a PDF using the multipart field 'pdf'");
    const [profile, sleepLogs] = await Promise.all([
      Profile.findOne({}).lean(),
      SleepLog.find({ date: { $gte: dateDaysAgo(6), $lte: today() } }).sort({ date: -1 }).lean(),
    ]);
    const averageSleep = sleepLogs.length
      ? Math.round((sleepLogs.reduce((sum, entry) => sum + entry.hours, 0) / sleepLogs.length) * 10) / 10
      : null;
    const advice = await foodAdvice(req.file.buffer, {
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
