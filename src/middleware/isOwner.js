const prisma = require("../lib/prisma");

async function isOwner(req, res, next) {
  const id = Number(req.params.quizId);

  const quiz = await prisma.question.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!quiz) {
    return res.status(404).json({ msg: "Quiz not found" });
  }

  if (quiz.userId !== req.user.id) {
    return res.status(403).json({ msg: "Forbidden: You do not own this quiz" });
  }

  req.quiz = quiz;
  next();
}

module.exports = isOwner;