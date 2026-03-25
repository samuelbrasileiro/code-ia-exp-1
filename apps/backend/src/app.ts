import express from "express";
import cors from "cors";
import questionsRouter from "./routes/questions.js";
import examsRouter from "./routes/exams.js";
import correctionsRouter from "./routes/corrections.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/questions", questionsRouter);
app.use("/api/exams", examsRouter);
app.use("/api/corrections", correctionsRouter);
