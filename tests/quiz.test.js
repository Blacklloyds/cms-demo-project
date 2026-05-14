const { resetDb, registerAndLogin, createQuiz, request, app, prisma } = require("./helpers");

beforeEach(resetDb);

describe("quiz tests", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/quiz");
    expect(res.status).toBe(401);
  });

  it("returns 200 and a list of quizzes", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/quiz")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.any(Array));
  });

  it("returns 404 for unknown quiz", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/quiz/99999")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Quiz not found");
  });

  it("returns 400 for invalid quiz body", async () => {
    const token = await registerAndLogin();
    const res = await request(app).post("/api/quiz")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "" });
    expect(res.status).toBe(400);
  });

  it("creates a quiz successfully", async () => {
    const token = await registerAndLogin();
    const res = await request(app).post("/api/quiz")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "What is 2+2?", answer: "4" });
    expect(res.status).toBe(201);
    expect(res.body.question).toBe("What is 2+2?");
  });

  it("returns 403 when editing someone else's quiz", async () => {
    const aliceToken = await registerAndLogin("alice@test.io", "Alice");
    const quiz = await createQuiz(aliceToken, { question: "Alice's question", answer: "42" });
    const bobToken = await registerAndLogin("bob@test.io", "Bob");
    const res = await request(app).put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ question: "hijacked", answer: "x" });
    expect(res.status).toBe(403);
    const after = await prisma.question.findUnique({ where: { id: quiz.id } });
    expect(after.question).toBe("Alice's question");
  });

  it("deletes own quiz successfully", async () => {
    const token = await registerAndLogin();
    const quiz = await createQuiz(token);
    const res = await request(app).delete(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});