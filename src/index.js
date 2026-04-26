const express = require('express'); 
const app = express();
const quizRouter = require("./routes/quiz");
const authRouter = require("./routes/auth");


const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/quiz", quizRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
