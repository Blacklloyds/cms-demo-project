const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/authenticate");
const isOwner = require("../middleware/isOwner");
const { NotFoundError, ValidationError } = require("../lib/errors");
const { z } = require("zod");

const path = require("path");
const multer = require("multer");

// MULTER SETUP
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const newName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, newName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError("Only image files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ZOD SCHEMA
const QuizInput = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  keywords: z.string().optional(),
});

// FORMAT RESPONSE
function formatQuiz(q) {
  return {
    id: q.id,
    userId: q.userId,
    question: q.question,
    answer: q.answer,
    imageUrl: q.imageUrl || null,
    userName: q.user?.name || null,
    likeCount: q._count?.likes || 0,
    liked: q.likes?.length > 0,
    options: q.options.map((o) => o.text),
  };
}

// AUTH MIDDLEWARE
router.use(authenticate);

// Multer error handler (must be inside router)
router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    err?.message === "Only image files are allowed"
  ) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// GET ALL QUIZZES
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 5);
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || "";

    const where = keyword ? { question: { contains: keyword } } : {};

    const [quizzes, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        include: {
          options: true,
          user: true,
          likes: { where: { userId: req.user.id }, take: 1 },
          _count: { select: { likes: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      data: quizzes.map(formatQuiz),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    throw err;
  }
});

// GET QUIZ BY ID
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quizItem = await prisma.question.findUnique({
    where: { id: quizId },
    include: {
      options: true,
      user: true,
      likes: { where: { userId: req.user.id }, take: 1 },
      _count: { select: { likes: true } },
    },
  });

  if (!quizItem) throw new NotFoundError("Quiz not found");

  res.json(formatQuiz(quizItem));
});

// CREATE QUIZ
router.post("/", upload.single("image"), async (req, res) => {
  const data = QuizInput.parse(req.body);

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const newQuiz = await prisma.question.create({
    data: {
      question: data.question,
      answer: data.answer,
      imageUrl,
      userId: req.user.id,
    },
    include: {
      options: true,
      user: true,
      likes: true,
      _count: { select: { likes: true } },
    },
  });

  res.status(201).json(formatQuiz(newQuiz));
});

// UPDATE QUIZ
router.put("/:quizId", isOwner, upload.single("image"), async (req, res) => {
  const quizId = Number(req.params.quizId);
  const data = QuizInput.parse(req.body);

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const updated = await prisma.question.update({
    where: { id: quizId },
    data: {
      question: data.question,
      answer: data.answer,
      ...(imageUrl !== undefined && { imageUrl }),
    },
    include: {
      options: true,
      user: true,
      likes: { where: { userId: req.user.id }, take: 1 },
      _count: { select: { likes: true } },
    },
  });

  res.json(formatQuiz(updated));
});

// PLAY QUIZ
router.post("/:quizId/play", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { answer } = req.body;

  const quizItem = await prisma.question.findUnique({
    where: { id: quizId },
  });

  if (!quizItem) throw new NotFoundError("Quiz not found");

  const correct =
    answer?.trim().toLowerCase() === quizItem.answer.trim().toLowerCase();

  res.json({ correct, correctAnswer: quizItem.answer });
});

// DELETE QUIZ
router.delete("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);

  await prisma.question.delete({ where: { id: quizId } });

  res.json({ msg: "Quiz deleted successfully", id: quizId });
});

module.exports = router;