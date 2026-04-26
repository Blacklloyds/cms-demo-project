const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const quiz = [
  {
    id: 1,
    question: "What does HTTP stand for?",
    options: [
      "HyperText Transfer Protocol",
      "High Transfer Text Protocol",
      "Hyper Transfer Text Process",
      "Home Tool Transfer Protocol"
    ],
    answer: "HyperText Transfer Protocol"
  },
  {
    id: 2,
    question: "Which method is used to retrieve data from a server?",
    options: ["GET", "POST", "PUT", "DELETE"],
    answer: "GET"
  },
  {
    id: 3,
    question: "What is Node.js mainly used for?",
    options: [
      "Frontend design",
      "Running JavaScript on the server",
      "Database management",
      "Styling web pages"
    ],
    answer: "Running JavaScript on the server"
  }
];

async function main() {
  // clean old data
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.user.deleteMany();

  // create default user with HASHED password
  const hashedPassword = await bcrypt.hash("1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User"
    }
  });

  console.log("Created user:", user.email);

  // create questions linked to user
  for (const item of quiz) {
    await prisma.question.create({
      data: {
        id: item.id,
        question: item.question,
        answer: item.answer,

        userId: user.id,

        options: {
          create: item.options.map((opt) => ({
            text: opt
          }))
        }
      }
    });
  }

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });