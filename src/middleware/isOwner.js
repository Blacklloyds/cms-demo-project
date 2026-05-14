const prisma = require("../lib/prisma");
const { NotFoundError, ForbiddenError } = require("../lib/errors");

async function isOwner(req, res, next) {
  const id = Number(req.params.quizId);

  const quiz = await prisma.question.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!quiz) throw new NotFoundError("Quiz not found");

  if (quiz.userId !== req.user.id)
    throw new ForbiddenError("You can only modify your own quizzes");

  req.quiz = quiz;
  next();
}

module.exports = isOwner;