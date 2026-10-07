const mongoose = require("mongoose");
module.exports = mongoose.model("SleepLog", new mongoose.Schema({
  date: { type: String, unique: true },
  bedtime: String, wakeTime: String, hours: Number,
}));
