const express = require("express");
const { asyncRoute, httpError } = require("../utils/errors");

function bmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function createProfileRouter(Profile) {
  const router = express.Router();
  router.get("/", asyncRoute(async (req, res) => res.json(await Profile.findOne({}).lean())));
  router.post("/", asyncRoute(async (req, res) => {
    const heightCm = Number(req.body.heightCm);
    const weightKg = Number(req.body.weightKg);
    if (!Number.isFinite(heightCm) || heightCm < 30 || heightCm > 275) throw httpError(400, "heightCm must be between 30 and 275");
    if (!Number.isFinite(weightKg) || weightKg < 2 || weightKg > 500) throw httpError(400, "weightKg must be between 2 and 500");
    const bmi = Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
    const profile = await Profile.findOneAndUpdate(
      {}, { $set: { heightCm, weightKg, bmi, bmiCategory: bmiCategory(bmi) } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(profile);
  }));
  return router;
}

module.exports = createProfileRouter;
