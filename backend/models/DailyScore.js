const mongoose = require("mongoose");
module.exports = mongoose.model("DailyScore", new mongoose.Schema({
  date: { type: String, unique: true },
  score: Number, breakdown: Object, summary: String,
}));
