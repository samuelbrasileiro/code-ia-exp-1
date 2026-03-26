import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(__dirname, "../../../data");
async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}
function filePath(name) {
    return path.join(DATA_DIR, name);
}
export async function readJson(name, fallback) {
    await ensureDataDir();
    const fullPath = filePath(name);
    try {
        const raw = await fs.readFile(fullPath, "utf-8");
        return JSON.parse(raw);
    }
    catch (err) {
        if (err.code === "ENOENT") {
            return fallback;
        }
        throw err;
    }
}
export async function writeJson(name, data) {
    await ensureDataDir();
    const fullPath = filePath(name);
    const tempPath = `${fullPath}.tmp`;
    const payload = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, payload, "utf-8");
    await fs.rename(tempPath, fullPath);
}
