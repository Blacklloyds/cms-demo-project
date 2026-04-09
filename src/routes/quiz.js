const express = require('express');
const router = express.Router();

const quiz = require("../data/quiz");

// GET all quizzes
router.get("/", (req, res) => {
  res.json(quiz);
});

// GET single quiz by ID
router.get("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const quizItem = quiz.find(q => q.id === quizId);

  if (!quizItem) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  res.json(quizItem);
});

// POST create new quiz
router.post("/", (req, res) => {
  const { question, options, answer, keywords } = req.body;

  if (!question || !options || !answer) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  const maxId = quiz.length ? Math.max(...quiz.map(q => q.id)) : 0;

  const newQuiz = {
    id: maxId + 1,
    question,
    options,
    answer,
    keywords: Array.isArray(keywords) ? keywords : []
  };

  quiz.push(newQuiz);

  res.status(201).json(newQuiz);
});

// PUT update quiz
router.put("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const quizItem = quiz.find(q => q.id === quizId);

  if (!quizItem) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  const { question, options, answer, keywords } = req.body;

  if (!question || !options || !answer) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  quizItem.question = question;
  quizItem.options = options;
  quizItem.answer = answer;
  quizItem.keywords = Array.isArray(keywords) ? keywords : [];

  res.json(quizItem);
});

// DELETE quiz
router.delete("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const quizIndex = quiz.findIndex(q => q.id === quizId);

  if (quizIndex === -1) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  const deletedQuiz = quiz.splice(quizIndex, 1)[0];

  res.json({
    msg: "Quiz deleted successfully",
    quiz: deletedQuiz
  });
});

module.exports = router;