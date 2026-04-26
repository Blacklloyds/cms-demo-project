const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/authenticate");
const isOwner = require("../middleware/isOwner");

/**
 * FORMAT RESPONSE
 */
function formatQuiz(question) {
  return {
    id: question.id,
    question: question.question,
    answer: question.answer,
    options: question.options.map((o) => o.text),
  };
}
router.use(authenticate);  

/**
 * GET ALL QUIZZES
 */
router.get("/", async (req, res) => {
  const quizzes = await prisma.question.findMany({
    include: { options: true },
    orderBy: { id: "asc" },
  });

  res.json(quizzes.map(formatQuiz));
});

/**
 * GET QUIZ BY ID
 */
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quizItem = await prisma.question.findUnique({
    where: { id: quizId },
    include: { options: true },
  });

  if (!quizItem) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  res.json(formatQuiz(quizItem));
});

/**
 * CREATE QUIZ
 */
router.post("/", async (req, res) => {
  const { question, options, answer } = req.body;

  if (!question || !Array.isArray(options) || !answer) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  const newQuiz = await prisma.question.create({
    data: {
      question,
      answer,
      options: {
        create: options.map((opt) => ({
          text: opt,
        })),
      },
    },
    include: { options: true },
  });

  res.status(201).json(formatQuiz(newQuiz));
});

/**
 * UPDATE QUIZ
 */
router.put("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, options, answer } = req.body;

  const existing = await prisma.question.findUnique({
    where: { id: quizId },
  });

  if (!existing) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  if (!question || !Array.isArray(options) || !answer) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  await prisma.option.deleteMany({
    where: { questionId: quizId },
  });

  const updated = await prisma.question.update({
    where: { id: quizId },
    data: {
      question,
      answer,
      options: {
        create: options.map((opt) => ({
          text: opt,
        })),
      },
    },
    include: { options: true },
  });

  res.json(formatQuiz(updated));
});

/**
 * DELETE QUIZ
 */
router.delete("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);

  const existing = await prisma.question.findUnique({
    where: { id: quizId },
  });

  if (!existing) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  await prisma.option.deleteMany({
    where: { questionId: quizId },
  });

  await prisma.question.delete({
    where: { id: quizId },
  });

  res.json({
    msg: "Quiz deleted successfully",
    id: quizId,
  });
});

module.exports = router;