const express = require('express');

const app = express();
const quizRouter = require("./routes/quiz");
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/quiz", quizRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: "Not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});