import { readJson, writeJson } from "./fileStore.js";
const FILE = "pdf-history.json";
export async function getPdfHistory() {
    return readJson(FILE, []);
}
export async function savePdfHistory(records) {
    await writeJson(FILE, records);
}
export async function appendPdfHistory(record) {
    const history = await getPdfHistory();
    history.unshift(record);
    await savePdfHistory(history);
}
