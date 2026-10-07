const router = require("express").Router();
const Task = require("../models/Task");

const ROUTINE = [
  { title: "Drink 1 liter water", time: "10:00" },
  { title: "Drink 1 liter water", time: "17:00" },
];

// Get tasks for a date; auto-create daily routine tasks
router.get("/", async (req, res) => {
  const date = req.query.date;
  const hasRoutine = await Task.exists({ date, type: "routine" });
  if (!hasRoutine) await Task.insertMany(ROUTINE.map((r) => ({ ...r, type: "routine", date })));
  res.json(await Task.find({ date }).sort({ time: 1, _id: 1 }));
});

router.post("/", async (req, res) => res.json(await Task.create({ ...req.body, type: "study" })));
router.put("/:id", async (req, res) =>
  res.json(await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })));
router.delete("/:id", async (req, res) => { await Task.findByIdAndDelete(req.params.id); res.json({ ok: true }); });

module.exports = router;
