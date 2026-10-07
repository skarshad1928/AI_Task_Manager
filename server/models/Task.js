const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  type: { type: String, enum: ["water", "study", "immediate", "routine"], required: true },
  time: { type: String, default: "" },
  done: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  timeSpentSec: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

taskSchema.index({ date: 1, time: 1 }, {
  unique: true,
  partialFilterExpression: { type: "water" },
});

module.exports = mongoose.model("Task", taskSchema);
