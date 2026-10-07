const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  heightCm: { type: Number, min: 30, max: 275 },
  weightKg: { type: Number, min: 2, max: 500 },
  bmi: Number,
  bmiCategory: String,
  lastAdvice: String,
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);
