const express = require("express");
const app = express();
const path = require("path");

// Prisma
const prisma = require("./lib/prisma");

// Routes
const quizRouter = require("./routes/quiz");
const authRouter = require("./routes/auth");

// --------------------
// Middleware
// --------------------
app.use(express.json());

// ✅ FIX 1: serve frontend correctly
app.use(express.static(path.join(__dirname, "..", "public")));

// ✅ FIX 2: safer uploads path (optional but better)
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// --------------------
// API Routes
// --------------------
app.use("/api/quiz", quizRouter);
app.use("/api/auth", authRouter);

// --------------------
// Health check
// --------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// --------------------
// IMPORTANT FIX (THIS HELPS FRONTEND LOAD CLEANLY)
// --------------------

// Serve index.html on root "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// --------------------
// 404 handler (LAST)
// --------------------
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

// --------------------
// Start server
// --------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// --------------------
// Graceful shutdown
// --------------------
async function shutdown() {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("Prisma shutdown error:", err);
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);