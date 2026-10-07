const mongoose = require("mongoose");
module.exports = mongoose.model("Task", new mongoose.Schema({
  title: String,
  type: { type: String, enum: ["routine", "study"], default: "study" },
  date: String, // YYYY-MM-DD
  time: String, // e.g. "10:00" for routine tasks
  done: { type: Boolean, default: false },
  timeSpentSec: { type: Number, default: 0 },
}));
