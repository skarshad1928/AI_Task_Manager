const router = require("express").Router();
const Profile = require("../models/Profile");

router.get("/", async (req, res) => res.json(await Profile.findOne()));

router.post("/", async (req, res) => {
  const { heightCm, weightKg } = req.body;
  const m = heightCm / 100;
  const bmi = Math.round((weightKg / (m * m)) * 10) / 10;
  const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const p = await Profile.findOneAndUpdate({}, { heightCm, weightKg, bmi, bmiCategory }, { upsert: true, new: true });
  res.json(p);
});
module.exports = router;
