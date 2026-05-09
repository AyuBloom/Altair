import { watch } from "fs";
import { execSync } from "child_process";
import { resolve, relative } from "path";

const SRC_DIR = resolve("src");
const DEBOUNCE_MS = 300;

let timeout = null;

function build(trigger) {
  console.log(`\x1b[36m[dev]\x1b[0m Change detected in \x1b[33m${trigger}\x1b[0m`);
  try {
    execSync("pnpm run build", { stdio: "ignore" });
    console.log(`\x1b[32m[dev]\x1b[0m Build succeeded. Watching for changes...\n`);
  } catch {
    console.error(`\x1b[31m[dev]\x1b[0m Build failed. Watching for changes...\n`);
  }
}

// Initial build
console.log(`\x1b[36m[dev]\x1b[0m Running initial build...\n`);
build("startup");

// Watch src/ recursively
watch(SRC_DIR, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  clearTimeout(timeout);
  timeout = setTimeout(() => build(relative(".", resolve(SRC_DIR, filename))), DEBOUNCE_MS);
});

// Watch package.json for metadata changes
const PKG_PATH = resolve("package.json");
watch(PKG_PATH, () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => build("package.json"), DEBOUNCE_MS);
});

console.log(`\x1b[36m[dev]\x1b[0m Watching \x1b[33msrc/\x1b[0m and \x1b[33mpackage.json\x1b[0m for changes...\n`);
