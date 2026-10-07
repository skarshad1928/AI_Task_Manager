const cors = require("cors");
const express = require("express");
const models = require("./models");
const services = require("./services");
const tasksRouter = require("./routes/tasks");
const sleepRouter = require("./routes/sleep");
const profileRouter = require("./routes/profile");
const reportRouter = require("./routes/report");
const scoreRouter = require("./routes/score");

function createApp(dependencies = {}) {
  const app = express();
  const selectedModels = { ...models, ...(dependencies.models || {}) };
  const selectedServices = { ...services, ...(dependencies.services || {}) };
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  app.use(cors({
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }));
  app.use(express.json({ limit: "1mb" }));

  // Make the configured API base URL useful when opened directly in a browser.
  app.get("/api", (req, res) => res.json({
    ok: true,
    service: "AI Task Manager API",
    endpoints: {
      health: "GET /api/health",
      tasks: "GET/POST /api/tasks; PUT/DELETE /api/tasks/:id",
      sleep: "POST /api/sleep; GET /api/sleep/:date",
      profile: "GET/POST /api/profile",
      report: "POST /api/report (multipart field: pdf)",
      score: "GET /api/score; POST /api/score/:date",
    },
  }));
  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.use("/api/tasks", tasksRouter(selectedModels.Task));
  app.use("/api/sleep", sleepRouter(selectedModels.SleepLog));
  app.use("/api/profile", profileRouter(selectedModels.Profile));
  app.use("/api/report", reportRouter(selectedModels, selectedServices.foodAdvice));
  app.use("/api/score", scoreRouter(selectedModels, selectedServices.daySummary));

  app.use((req, res) => res.status(404).json({ error: "Route not found" }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = Number.isInteger(error.status) ? error.status
      : error.code === "LIMIT_FILE_SIZE" ? 413
        : error.code === "LIMIT_UNEXPECTED_FILE" ? 400
          : 500;
    const message = status === 413 ? "PDFs must be 10 MB or smaller"
      : error.status ? error.message
        : status === 400 ? "Only one PDF can be uploaded using the field 'pdf'"
          : error.publicMessage || "The server could not complete this request";
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
