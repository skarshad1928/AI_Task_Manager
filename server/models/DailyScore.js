const mongoose = require("mongoose");

const dailyScoreSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  score: { type: Number, required: true, min: 0, max: 100 },
  breakdown: { type: mongoose.Schema.Types.Mixed, required: true },
  summary: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("DailyScore", dailyScoreSchema);
