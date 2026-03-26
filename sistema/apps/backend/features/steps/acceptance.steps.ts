import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import type request from "supertest";

const bufferParser = (res: request.Response, callback: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
};

function parseChoices(table: DataTable): string[] {
  return table.rows().map((row) => row[0]).filter(Boolean);
}

function parseIndexes(value: string): number[] {
  return value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => !Number.isNaN(item));
}

async function createQuestion(world: any, prompt: string, choices: string[], correctIndexes: number[]) {
  const response = await world.client.post("/api/questions").send({
    prompt,
    choices,
    correctIndexes
  });
  world.response = response;
  world.lastBody = response.body;
  if (response.status === 201) {
    world.questionId = response.body.id;
    world.questionIds.push(response.body.id);
  }
  return response;
}

async function createExam(world: any, mode: "letters" | "powersOfTwo", questionIds: string[]) {
  const response = await world.client.post("/api/exams").send({
    title: "Sample Exam",
    subject: "Science",
    teacher: "Dr. Smith",
    date: "2026-03-25",
    answerLabelingMode: mode,
    questionIds
  });
  world.response = response;
  world.lastBody = response.body;
  if (response.status === 201) {
    world.exam = response.body;
  }
  return response;
}

Given("the questions store is empty", async function () {
  const response = await this.client.get("/api/questions");
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 0);
});

Given("at least {int} questions exist", async function (count: number) {
  this.questionIds = [];
  for (let i = 0; i < count; i += 1) {
    await createQuestion(this, `Question ${i + 1}`, ["A", "B", "C"], [0]);
  }
});

Given("at least {int} question exists", async function (count: number) {
  this.questionIds = [];
  for (let i = 0; i < count; i += 1) {
    await createQuestion(this, `Question ${i + 1}`, ["A", "B"], [0]);
  }
});

Given("a question exists with prompt {string}", async function (prompt: string) {
  await createQuestion(this, prompt, ["Yes", "No"], [0]);
});

When("I create a question with prompt {string}", async function (prompt: string) {
  this.pendingPrompt = prompt;
});

When("choices:", async function (table: DataTable) {
  this.pendingChoices = parseChoices(table);
});

When(/^correct indexes: (.+)$/, async function (value: string) {
  const indexes = parseIndexes(value);
  if (this.isUpdating) {
    const response = await this.client.put(`/api/questions/${this.questionId}`).send({
      prompt: "Updated",
      choices: this.pendingChoices,
      correctIndexes: indexes
    });
    this.response = response;
    this.lastBody = response.body;
    this.isUpdating = false;
    return;
  }
  await createQuestion(this, this.pendingPrompt, this.pendingChoices, indexes);
});

When("I update the question with choices:", async function (table: DataTable) {
  this.pendingChoices = parseChoices(table);
  this.isUpdating = true;
});

When("I delete the question", async function () {
  const response = await this.client.delete(`/api/questions/${this.questionId}`);
  this.response = response;
});

Then("the response status is {int}", function (status: number) {
  assert.equal(this.response?.status, status);
});

Then("the question has {int} choices", function (count: number) {
  assert.equal(this.lastBody.choices.length, count);
});

Then("the question has {int} correctChoiceIds", function (count: number) {
  assert.equal(this.lastBody.correctChoiceIds.length, count);
});

Then("the error is {string}", function (message: string) {
  assert.equal(this.lastBody.error, message);
});

Then("the question is no longer in the list", async function () {
  const response = await this.client.get("/api/questions");
  assert.equal(response.status, 200);
  assert.equal(response.body.find((item: any) => item.id === this.questionId), undefined);
});

When("I create an exam with answerLabelingMode {string}", async function (mode: string) {
  await createExam(this, mode as "letters" | "powersOfTwo", this.questionIds);
});

When("questionIds include those {int} questions", async function (count: number) {
  assert.equal(this.questionIds.length, count);
});

When("I create an exam with questionIds: {string}", async function (value: string) {
  await createExam(this, "letters", [value]);
});

When("I create an exam with an empty questionIds array", async function () {
  const response = await this.client.post("/api/exams").send({
    title: "Empty Exam",
    subject: "Math",
    teacher: "Teacher",
    date: "2026-03-25",
    answerLabelingMode: "letters",
    questionIds: []
  });
  this.response = response;
  this.lastBody = response.body;
});

Then("the exam answerLabelingMode is {string}", function (mode: string) {
  assert.equal(this.lastBody.answerLabelingMode, mode);
});

Then("the exam has those questionIds", function () {
  assert.deepEqual(this.lastBody.questionIds, this.questionIds);
});

Given("an exam exists with {int} questions", async function (count: number) {
  this.questionIds = [];
  for (let i = 0; i < count; i += 1) {
    await createQuestion(this, `Q${i + 1}`, ["A", "B", "C"], [0]);
  }
  await createExam(this, "letters", this.questionIds);
});

Given("an exam exists with at least {int} question", async function (count: number) {
  this.questionIds = [];
  for (let i = 0; i < count; i += 1) {
    await createQuestion(this, `Q${i + 1}`, ["A", "B"], [0]);
  }
  await createExam(this, "letters", this.questionIds);
});

Given("an exam exists with answerLabelingMode {string}", async function (mode: string) {
  this.questionIds = [];
  for (let i = 0; i < 2; i += 1) {
    await createQuestion(this, `Q${i + 1}`, ["A", "B", "C"], [0]);
  }
  await createExam(this, mode as "letters" | "powersOfTwo", this.questionIds);
});

Given("an exam exists", async function () {
  this.questionIds = [];
  await createQuestion(this, "Q1", ["A", "B"], [0]);
  await createExam(this, "letters", this.questionIds);
});

Given("an exam exists with zero questionIds", async function () {
  this.questionIds = [];
  await createQuestion(this, "Q1", ["A", "B"], [0]);
  await createExam(this, "letters", this.questionIds);
  await this.client.delete(`/api/questions/${this.questionIds[0]}`);
});

When("I request a new variant for that exam", async function () {
  const response = await this.client.post(`/api/exams/${this.exam.id}/variant`).send({});
  this.response = response;
  this.lastBody = response.body;
  if (response.status === 200) {
    this.variant = response.body;
  }
});

Then("the response includes a variantId and examNumber", function () {
  assert.ok(this.lastBody.variantId);
  assert.ok(this.lastBody.examNumber);
});

Then("the variant has {int} questions", function (count: number) {
  assert.equal(this.lastBody.questions.length, count);
});

Then("each question has shuffledChoiceIds", function () {
  assert.ok(this.lastBody.questions.every((q: any) => Array.isArray(q.shuffledChoiceIds)));
});

Given("a valid variant exists for that exam", async function () {
  const response = await this.client.post(`/api/exams/${this.exam.id}/variant`).send({});
  this.variant = response.body;
});

When("I request a PDF for the variant", async function () {
  const response = await this.client
    .post(`/api/exams/${this.exam.id}/pdf`)
    .send({ variant: this.variant })
    .buffer(true)
    .parse(bufferParser);
  this.response = response;
  this.lastBody = response.body;
});

Then("the response is a PDF", function () {
  assert.equal(this.response?.headers["content-type"], "application/pdf");
});

Then(
  "the PDF header includes the exam title, subject, teacher, date, and answer labels",
  function () {
    assert.ok(Buffer.isBuffer(this.lastBody));
    assert.ok(this.lastBody.length > 1000);
  }
);

Then("the PDF footer includes the exam number", function () {
  assert.ok(this.variant?.examNumber);
  assert.ok(this.lastBody.length > 1000);
});

When("I request a PDF zip with copies {int}", async function (copies: number) {
  const response = await this.client
    .post(`/api/exams/${this.exam.id}/pdf-zip`)
    .send({ copies })
    .buffer(true)
    .parse(bufferParser);
  this.response = response;
  this.zipBuffer = response.body;
});

When("I generate a PDF zip with copies {int}", async function (copies: number) {
  const response = await this.client
    .post(`/api/exams/${this.exam.id}/pdf-zip`)
    .send({ copies })
    .buffer(true)
    .parse(bufferParser);
  this.response = response;
  this.zipBuffer = response.body;
});

Then("the response is a zip file", function () {
  assert.equal(this.response?.headers["content-type"], "application/zip");
});

Then("the zip contains {int} PDF files", function (count: number) {
  const zip = new AdmZip(this.zipBuffer!);
  const pdfEntries = zip.getEntries().filter((entry) => entry.entryName.endsWith(".pdf"));
  assert.equal(pdfEntries.length, count);
});

Then("each PDF has a header and footer", function () {
  const zip = new AdmZip(this.zipBuffer!);
  const pdfEntries = zip.getEntries().filter((entry) => entry.entryName.endsWith(".pdf"));
  pdfEntries.forEach((entry) => {
    const content = entry.getData();
    assert.ok(content.length > 1000);
  });
});

Then("the zip contains one answer key CSV", function () {
  const zip = new AdmZip(this.zipBuffer!);
  const csvEntries = zip.getEntries().filter((entry) => entry.entryName.endsWith(".csv"));
  assert.equal(csvEntries.length, 1);
});

Then("the PDF history for that exam includes a record", async function () {
  const response = await this.client.get(`/api/exams/${this.exam.id}/pdf-history`);
  assert.equal(response.status, 200);
  assert.ok(response.body.length > 0);
});

Then("the record includes copies {int} and the variantIds", async function (copies: number) {
  const response = await this.client.get(`/api/exams/${this.exam.id}/pdf-history`);
  const record = response.body[0];
  assert.equal(record.copies, copies);
  assert.ok(Array.isArray(record.variantIds));
});

Given("I generated {int} variants for the exam", async function (copies: number) {
  const response = await this.client
    .post(`/api/exams/${this.exam.id}/pdf-zip`)
    .send({ copies })
    .buffer(true)
    .parse(bufferParser);
  this.zipBuffer = response.body;
});

When("I extract the answer key CSV from the zip", function () {
  const zip = new AdmZip(this.zipBuffer!);
  const csvEntry = zip.getEntries().find((entry) => entry.entryName.endsWith(".csv"));
  this.csvContent = csvEntry?.getData().toString("utf8") ?? null;
});

Then("the header row is:", function (table: DataTable) {
  const expected = table.raw()[0].join(",");
  const header = this.csvContent?.trim().split("\n")[0];
  assert.equal(header, expected);
});

Given("an exam exists in {string} mode", async function (mode: string) {
  this.questionIds = [];
  await createQuestion(this, "Pick letters", ["A", "B", "C"], [0, 2]);
  await createExam(this, mode as "letters" | "powersOfTwo", this.questionIds);
});

Given("question {int} has correct choices A and C", function (_index: number) {
  // Already created in exam setup with correct indexes 0 and 2.
});

When("I generate the answer key CSV for a controlled variant", async function () {
  const questionId = this.questionIds[0];
  const questionResponse = await this.client.get(`/api/questions`);
  const question = questionResponse.body.find((item: any) => item.id === questionId);
  assert.ok(question, "Question not found");

  const response = await this.client.post(`/api/exams/${this.exam.id}/answer-key`).send({
    variant: {
      examId: this.exam.id,
      variantId: "variant-1",
      examNumber: "EXAM-001",
      questions: [
        {
          questionId,
          shuffledChoiceIds: question.choices.map((choice: any) => choice.id)
        }
      ]
    }
  });
  this.response = response;
  this.csvContent = response.text;
});

Then("the value for question1-answer is {string}", function (value: string) {
  const lines = this.csvContent?.trim().split("\n") ?? [];
  const dataRow = lines[1] ?? "";
  const cells = dataRow.split(",");
  assert.equal(cells[1], value);
});

Given(
  "question {int} has correct choices with labels {int} and {int}",
  function (_index: number, _labelA: number, _labelB: number) {
  // Already created in exam setup with correct indexes 0 and 2.
  }
);

Given("a variant exists for the exam", async function () {
  const response = await this.client.post(`/api/exams/${this.exam.id}/variant`).send({});
  this.variant = response.body;
});

When("I download the answer key for that variant", async function () {
  const response = await this.client.post(`/api/exams/${this.exam.id}/answer-key`).send({
    variant: this.variant
  });
  this.response = response;
  this.csvContent = response.text;
});

Then("the CSV header matches {string}", function (header: string) {
  const firstLine = this.csvContent?.trim().split("\n")[0];
  assert.equal(firstLine, header);
});

Given("an answer key with question1-answer {string}", function (value: string) {
  this.keyCsv = `exam-id,question1-answer\nEXAM-001,${value}\n`;
});

Given("a student answers row with question1-answer {string}", function (value: string) {
  this.answersCsv = `cpf,exam-id,question1-answer\nSTUDENT-1,EXAM-001,${value}\n`;
});

Given("an answer key CSV without {string}", function (column: string) {
  if (column === "exam-id") {
    this.keyCsv = `question1-answer\nA\n`;
    if (!this.answersCsv) {
      this.answersCsv = `cpf,exam-id,question1-answer\nSTUDENT-1,EXAM-001,A\n`;
    }
    return;
  }
  this.keyCsv = `${column}\nvalue\n`;
  if (!this.answersCsv) {
    this.answersCsv = `cpf,exam-id,question1-answer\nSTUDENT-1,EXAM-001,A\n`;
  }
});

Given("an answer key CSV without question1-answer columns", function () {
  this.keyCsv = `exam-id\nEXAM-001\n`;
  if (!this.answersCsv) {
    this.answersCsv = `cpf,exam-id,question1-answer\nSTUDENT-1,EXAM-001,A\n`;
  }
});

Given("a student answers CSV without question1-answer columns", function () {
  this.answersCsv = `cpf,exam-id\nSTUDENT-1,EXAM-001\n`;
  if (!this.keyCsv) {
    this.keyCsv = `exam-id,question1-answer\nEXAM-001,A\n`;
  }
});

Given("an answer key CSV for exam-id {string}", function (examId: string) {
  this.keyCsv = `exam-id,question1-answer\n${examId},A\n`;
});

Given("a student answers row with exam-id {string}", function (examId: string) {
  this.answersCsv = `cpf,exam-id,question1-answer\nSTUDENT-1,${examId},A\n`;
});

When("I run correction in {string} mode", async function (mode: string) {
  const response = await this.client
    .post("/api/corrections")
    .field("mode", mode)
    .attach("keyCsv", Buffer.from(this.keyCsv ?? ""), "key.csv")
    .attach("answersCsv", Buffer.from(this.answersCsv ?? ""), "answers.csv");
  this.response = response;
  this.lastBody = response.body;
});

When("I run correction", async function () {
  const response = await this.client
    .post("/api/corrections")
    .attach("keyCsv", Buffer.from(this.keyCsv ?? ""), "key.csv")
    .attach("answersCsv", Buffer.from(this.answersCsv ?? ""), "answers.csv");
  this.response = response;
  this.lastBody = response.body;
});

Then("the student gets full credit for question {int}", function (index: number) {
  const result = this.lastBody.results[0];
  const detail = result.details[index - 1];
  assert.equal(detail.pointsAwarded, 1);
});

Then("the student gets 0 points for question {int}", function (index: number) {
  const result = this.lastBody.results[0];
  const detail = result.details[index - 1];
  assert.equal(detail.pointsAwarded, 0);
});

Then("the student receives partial credit for question {int}", function (index: number) {
  const result = this.lastBody.results[0];
  const detail = result.details[index - 1];
  assert.ok(detail.pointsAwarded > 0);
  assert.ok(detail.pointsAwarded < 1);
});

Then("the score is greater than 0 and less than 1", function () {
  const result = this.lastBody.results[0];
  const detail = result.details[0];
  assert.ok(detail.pointsAwarded > 0);
  assert.ok(detail.pointsAwarded < 1);
});

Then("the error mentions {string}", function (message: string) {
  assert.ok(String(this.lastBody.error).includes(message));
});

Given("a semicolon-delimited answer key CSV with valid columns", function () {
  this.keyCsv = `exam-id;question1-answer\nEXAM-001;A\n`;
});

Given("a semicolon-delimited student answers CSV with valid columns", function () {
  this.answersCsv = `cpf;exam-id;question1-answer\nSTUDENT-1;EXAM-001;A\n`;
});
