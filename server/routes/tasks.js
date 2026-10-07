const express = require("express");
const mongoose = require("mongoose");
const { asyncRoute, httpError } = require("../utils/errors");
const { isValidDate, today } = require("../utils/date");
const { ensureWaterRoutines } = require("../services/routines");
const USER_TASK_TYPES = new Set(["study", "immediate", "routine"]);

function createTasksRouter(Task) {
  const router = express.Router();

  router.get("/", asyncRoute(async (req, res) => {
    const date = req.query.date || today();
    if (!isValidDate(date)) throw httpError(400, "date must be a real date in YYYY-MM-DD format");
    await ensureWaterRoutines(Task, date);
    const tasks = await Task.find({ date }).sort({ time: 1, createdAt: 1 }).lean();
    res.json(tasks);
  }));

  router.post("/", asyncRoute(async (req, res) => {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const date = req.body.date || today();
    const type = req.body.type || "study";
    if (!title || title.length > 160) throw httpError(400, "title must be between 1 and 160 characters");
    if (!isValidDate(date)) throw httpError(400, "date must be a real date in YYYY-MM-DD format");
    if (!USER_TASK_TYPES.has(type)) throw httpError(400, "type must be study, immediate, or routine");
    res.status(201).json(await Task.create({ title, date, type }));
  }));

  router.put("/:id", asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "task id is invalid");
    const updates = {};
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== "string" || !req.body.title.trim() || req.body.title.trim().length > 160) {
        throw httpError(400, "title must be between 1 and 160 characters");
      }
      updates.title = req.body.title.trim();
    }
    if (req.body.done !== undefined) {
      if (typeof req.body.done !== "boolean") throw httpError(400, "done must be true or false");
      updates.done = req.body.done;
      updates.completedAt = req.body.done ? new Date() : null;
    }
    if (req.body.timeSpentSec !== undefined) {
      if (!Number.isFinite(req.body.timeSpentSec) || req.body.timeSpentSec < 0 || req.body.timeSpentSec > 604800) {
        throw httpError(400, "timeSpentSec must be a number between 0 and 604800");
      }
      updates.timeSpentSec = Math.round(req.body.timeSpentSec);
    }
    if (req.body.type !== undefined) {
      if (!USER_TASK_TYPES.has(req.body.type)) throw httpError(400, "type must be study, immediate, or routine");
      updates.type = req.body.type;
    }
    if (!Object.keys(updates).length) throw httpError(400, "provide at least one task field to update");
    const task = await Task.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!task) throw httpError(404, "task was not found");
    res.json(task);
  }));

  router.delete("/:id", asyncRoute(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "task id is invalid");
    const task = await Task.findById(req.params.id).lean();
    if (!task) throw httpError(404, "task was not found");
    if (task.type === "water") throw httpError(400, "daily water routines cannot be deleted");
    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }));

  return router;
}

module.exports = createTasksRouter;
