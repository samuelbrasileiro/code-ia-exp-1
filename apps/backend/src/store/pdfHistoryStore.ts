import type { PdfGenerationRecord } from "../../../packages/shared/src/types.js";
import { readJson, writeJson } from "./fileStore.js";

const FILE = "pdf-history.json";

export async function getPdfHistory(): Promise<PdfGenerationRecord[]> {
  return readJson<PdfGenerationRecord[]>(FILE, []);
}

export async function savePdfHistory(records: PdfGenerationRecord[]): Promise<void> {
  await writeJson(FILE, records);
}

export async function appendPdfHistory(record: PdfGenerationRecord): Promise<void> {
  const history = await getPdfHistory();
  history.unshift(record);
  await savePdfHistory(history);
}
