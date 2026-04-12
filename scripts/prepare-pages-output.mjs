import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, ".deploy");

const excludedTopLevel = new Set([
  ".deploy",
  ".git",
  ".vs",
  ".wrangler",
  "node_modules",
  "scripts",
  "tmp"
]);

const excludedFiles = new Set([
  ".gitignore",
  "wrangler.jsonc",
  "tmp-walther-epistles-1.html",
  "tmp-walther-epistles-2.html"
]);

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(sourcePath, destinationPath) {
  const stats = fs.statSync(sourcePath);

  if (stats.isDirectory()) {
    ensureDir(destinationPath);
    for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
      copyRecursive(
        path.join(sourcePath, entry.name),
        path.join(destinationPath, entry.name)
      );
    }
    return;
  }

  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function main() {
  removeDir(outputDir);
  ensureDir(outputDir);

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (excludedTopLevel.has(entry.name) || excludedFiles.has(entry.name)) {
      continue;
    }

    copyRecursive(
      path.join(root, entry.name),
      path.join(outputDir, entry.name)
    );
  }

  console.log(`Prepared Pages output in ${outputDir}`);
}

main();
