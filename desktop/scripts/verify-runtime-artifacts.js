const path = require('node:path');
const { constants } = require('node:fs');
const { access, stat } = require('node:fs/promises');

async function ensureFile(filePath) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) { throw new Error(`Expected file not found: ${filePath}`); }
  await access(filePath, constants.R_OK);
}

async function ensureDirectory(directoryPath) {
  const directoryStats = await stat(directoryPath);
  if (!directoryStats.isDirectory()) { throw new Error(`Expected directory not found: ${directoryPath}`); }
  await access(directoryPath, constants.R_OK);
}

async function main() {
  const desktopRoot = process.cwd();
  const monorepoRoot = path.resolve(desktopRoot, '..');
  const backendEntry = path.join(monorepoRoot, 'backend', 'dist', 'backend', 'src', 'main.js');
  const backendDependencies = path.join(monorepoRoot, 'backend', 'node_modules');
  const frontendBrowserDist = path.join(monorepoRoot, 'frontend', 'dist', 'wikidocs-frontend', 'browser');
  const frontendIndex = path.join(frontendBrowserDist, 'index.html');
  await ensureFile(backendEntry);
  await ensureDirectory(backendDependencies);
  await ensureDirectory(frontendBrowserDist);
  await ensureFile(frontendIndex);
}

main().catch((error) => {
  console.error(`Runtime artifact check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
