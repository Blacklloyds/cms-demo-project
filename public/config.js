const CONFIG = {
  API_URL: "", // adjust if your backend runs on another port

  ROUTES: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    QUESTIONS: "/api/quiz",
  },

  FIELDS: {
    LOGIN: ["email", "password"],
    REGISTER: ["email", "password", "name"],

    // optional frontend-only structure
    QUESTION: ["question", "answer", "keywords", "image"],
  },

  QUESTIONS_PER_PAGE: 5,

  STORAGE_KEY: "jwt_token",

  API_FIELDS: {
    SOLVED: "solved",
  },
};