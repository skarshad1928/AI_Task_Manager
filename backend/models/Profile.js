const mongoose = require("mongoose");
module.exports = mongoose.model("Profile", new mongoose.Schema({
  heightCm: Number, weightKg: Number, bmi: Number, bmiCategory: String,
  lastAdvice: String,
}));
