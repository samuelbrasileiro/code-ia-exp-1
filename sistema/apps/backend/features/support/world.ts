import { BeforeAll, Before, AfterAll, setWorldConstructor } from "@cucumber/cucumber";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Express } from "express";
import request from "supertest";

let dataDir: string | null = null;
let appInstance: Express | null = null;

async function clearDataDir(): Promise<void> {
  if (!dataDir) {
    return;
  }
  await fs.mkdir(dataDir, { recursive: true });
  const entries = await fs.readdir(dataDir);
  await Promise.all(
    entries.map((entry) => fs.rm(path.join(dataDir!, entry), { recursive: true, force: true }))
  );
}

class CustomWorld {
  app: Express;
  client: request.SuperTest<request.Test>;
  response: request.Response | null = null;
  lastBody: unknown = null;
  questionIds: string[] = [];
  questionId: string | null = null;
  exam: any = null;
  variant: any = null;
  zipBuffer: Buffer | null = null;
  csvContent: string | null = null;
  keyCsv: string | null = null;
  answersCsv: string | null = null;

  constructor() {
    if (!appInstance) {
      throw new Error("App not initialized");
    }
    this.app = appInstance;
    this.client = request(this.app);
  }
}

setWorldConstructor(CustomWorld);

BeforeAll(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "exam-builder-tests-"));
  process.env.DATA_DIR = dataDir;
  const module = await import("../../src/app.ts");
  appInstance = module.app as Express;
});

Before(async () => {
  await clearDataDir();
});

AfterAll(async () => {
  if (dataDir) {
    await fs.rm(dataDir, { recursive: true, force: true });
  }
});
