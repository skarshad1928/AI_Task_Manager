const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/tasks", require("./routes/tasks"));
app.use("/sleep", require("./routes/sleep"));
app.use("/profile", require("./routes/profile"));
app.use("/report", require("./routes/report"));
app.use("/score", require("./routes/score"));
app.use("/usage", require("./routes/usage"));
app.get("/health", (req, res) => res.json({ ok: true }));

const webBuild = path.resolve(__dirname, "../web/dist");
app.use(express.static(webBuild));
app.get("/", (req, res) => {
  if (require("fs").existsSync(path.join(webBuild, "index.html"))) return res.sendFile(path.join(webBuild, "index.html"));
  res.send("Task manager API running");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, "0.0.0.0", () => console.log("Server started"));
  })
  .catch((e) => console.error("MongoDB error:", e.message));
