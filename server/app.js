const cors = require("cors");
const express = require("express");
const models = require("./models");
const services = require("./services");
const tasksRouter = require("./routes/tasks");
const sleepRouter = require("./routes/sleep");
const profileRouter = require("./routes/profile");
const reportRouter = require("./routes/report");
const scoreRouter = require("./routes/score");

function getClientOrigins(value) {
  return value.split(",").map((item) => {
    try {
      const url = new URL(item.trim());
      return ["http:", "https:"].includes(url.protocol) ? url.origin : null;
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function getVercelProjectPatterns(origins) {
  return origins.flatMap((origin) => {
    const hostname = new URL(origin).hostname;
    const match = hostname.match(/^(?<project>.+)-[a-z0-9]{9}-(?<scope>[a-z0-9-]+)\.vercel\.app$/i);
    if (!match) return [];

    const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [new RegExp(`^${escape(match.groups.project)}(?:-[a-z0-9-]+)?-${escape(match.groups.scope)}\\.vercel\\.app$`, "i")];
  });
}

function createApp(dependencies = {}) {
  const app = express();
  const selectedModels = { ...models, ...(dependencies.models || {}) };
  const selectedServices = { ...services, ...(dependencies.services || {}) };
  const clientOrigins = new Set(getClientOrigins(dependencies.clientUrl || process.env.CLIENT_URL || "http://localhost:5173"));
  const vercelProjectPatterns = getVercelProjectPatterns([...clientOrigins]);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.has(origin)) return callback(null, true);

      let hostname;
      try {
        const url = new URL(origin);
        if (url.protocol !== "https:") return callback(null, false);
        hostname = url.hostname;
      } catch {
        return callback(null, false);
      }

      return callback(null, vercelProjectPatterns.some((pattern) => pattern.test(hostname)));
    },
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
      report: "POST /api/report (multipart field: csv)",
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
    const message = status === 413 ? "CSV files must be 1 MB or smaller"
      : error.status ? error.message
        : error.code === "LIMIT_UNEXPECTED_FILE" ? "Only one CSV can be uploaded using the field 'csv'"
          : error.publicMessage || "The server could not complete this request";
    res.status(status).json({ error: message });
  });

  return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
