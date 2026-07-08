const path = require("path");
const fs = require("fs");

// 録画ファイルの保存先。ここを唯一の定義とする（S3等へ移行する際はこのモジュールを差し替える）。
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * storageKey から実ファイルパスを解決する。
 * path.basename で階層要素を除去し、パストラバーサルを構造的に防ぐ。
 */
function resolveUploadPath(storageKey) {
  return path.join(UPLOAD_DIR, path.basename(storageKey));
}

module.exports = { UPLOAD_DIR, resolveUploadPath };
