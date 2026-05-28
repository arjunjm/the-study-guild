/**
 * Builds a self-contained App Service deployment folder for the API.
 *
 * Expected inputs:
 *   - shared/dist exists from `npm run build --workspace=shared`
 *   - server/dist exists from `npm run build --workspace=server`
 *
 * Output:
 *   - server/deploy with compiled API, a file-based shared package, and package.json
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const serverDir = resolve(repoRoot, 'server');
const sharedDir = resolve(repoRoot, 'shared');
const outDir = resolve(serverDir, 'deploy');

const serverDist = resolve(serverDir, 'dist');
const sharedDist = resolve(sharedDir, 'dist');

if (!existsSync(serverDist)) {
  throw new Error('Missing server/dist. Run npm run build --workspace=server first.');
}

if (!existsSync(sharedDist)) {
  throw new Error('Missing shared/dist. Run npm run build --workspace=shared first.');
}

const serverPkg = JSON.parse(readFileSync(resolve(serverDir, 'package.json'), 'utf8'));
const sharedPkg = JSON.parse(readFileSync(resolve(sharedDir, 'package.json'), 'utf8'));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(serverDist, resolve(outDir, 'dist'), { recursive: true });

const deploySharedDir = resolve(outDir, 'shared');
mkdirSync(deploySharedDir, { recursive: true });
cpSync(sharedDist, resolve(deploySharedDir, 'dist'), { recursive: true });
writeFileSync(
  resolve(deploySharedDir, 'package.json'),
  JSON.stringify({
    name: sharedPkg.name,
    version: sharedPkg.version,
    main: './dist/index.js',
    types: './dist/index.d.ts',
  }, null, 2),
);

writeFileSync(
  resolve(outDir, 'package.json'),
  JSON.stringify({
    name: '@study-guild/api-deploy',
    version: serverPkg.version,
    private: true,
    main: 'dist/index.js',
    scripts: {
      start: 'node dist/index.js',
    },
    engines: {
      node: '>=22',
    },
    dependencies: {
      ...serverPkg.dependencies,
      '@study-guild/shared': 'file:shared',
    },
  }, null, 2),
);

console.log(`Prepared API deployment package at ${outDir}`);
