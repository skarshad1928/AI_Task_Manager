const mongoose = require("mongoose");

const sleepLogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  bedtime: { type: String, required: true },
  wakeTime: { type: String, required: true },
  hours: { type: Number, required: true, min: 0, max: 24 },
}, { timestamps: true });

module.exports = mongoose.model("SleepLog", sleepLogSchema);
