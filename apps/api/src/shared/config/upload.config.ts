import path from "path";
import fs from "fs";

export const uploadDir = path.join(process.cwd(), "public/uploads");
export function initUploadPath() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
