const mongoose = require("mongoose");

module.exports = mongoose.model("UsageLog", new mongoose.Schema({
  date: { type: String, unique: true, required: true },
  chromeOpens: { type: Number, min: 0, default: 0 },
  chromeMinutes: { type: Number, min: 0, default: 0 },
  youtubeOpens: { type: Number, min: 0, default: 0 },
  youtubeMinutes: { type: Number, min: 0, default: 0 },
}));