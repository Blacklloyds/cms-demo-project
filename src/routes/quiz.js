const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/authenticate");
const isOwner = require("../middleware/isOwner");

const path = require("path");
const multer = require("multer");

/**
 * MULTER SETUP
 */
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
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * FORMAT RESPONSE
 */
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

/**
 * AUTH MIDDLEWARE
 */
router.use(authenticate);

/**
 * GET ALL QUIZZES (pagination + search)
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 5);
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || "";

    const where = keyword
      ? { question: { contains: keyword } }
      : {};

    const [quizzes, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        include: {
          options: true,
          user: true,
          likes: {
            where: { userId: req.user.id },
            take: 1,
          },
          _count: {
            select: { likes: true },
          },
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
    console.error(err);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

/**
 * GET QUIZ BY ID
 */
router.get("/:quizId", async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    const quizItem = await prisma.question.findUnique({
      where: { id: quizId },
      include: {
        options: true,
        user: true,
        likes: {
          where: { userId: req.user.id },
          take: 1,
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!quizItem) {
      return res.status(404).json({ msg: "Quiz not found" });
    }

    res.json(formatQuiz(quizItem));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

/**
 * CREATE QUIZ
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newQuiz = await prisma.question.create({
      data: {
        question,
        answer,
        imageUrl,
        userId: req.user.id,
      },
      include: {
        options: true,
        user: true,
        likes: true,
        _count: {
          select: { likes: true },
        },
      },
    });

    res.status(201).json(formatQuiz(newQuiz));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

/**
 * UPDATE QUIZ
 */
router.put("/:quizId", isOwner, upload.single("image"), async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.question.update({
      where: { id: quizId },
      data: {
        question,
        answer,
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        options: true,
        user: true,
        likes: {
          where: { userId: req.user.id },
          take: 1,
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    res.json(formatQuiz(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

/**
 * PLAY QUIZ (check answer)
 */
router.post("/:quizId/play", async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);
    const { answer } = req.body;

    const quizItem = await prisma.question.findUnique({
      where: { id: quizId },
    });

    if (!quizItem) {
      return res.status(404).json({ msg: "Quiz not found" });
    }

    const correct =
      answer?.trim().toLowerCase() === quizItem.answer.trim().toLowerCase();

    res.json({ correct, correctAnswer: quizItem.answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check answer" });
  }
});

/**
 * DELETE QUIZ
 */
router.delete("/:quizId", isOwner, async (req, res) => {
  try {
    const quizId = Number(req.params.quizId);

    await prisma.question.delete({
      where: { id: quizId },
    });

    res.json({ msg: "Quiz deleted successfully", id: quizId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

module.exports = router;