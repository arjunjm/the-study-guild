/**
 * Finalizes server/deploy after `npm install --omit=dev --prefix server/deploy`.
 *
 * Azure App Service/Oryx may pack node_modules separately, and npm file:
 * dependencies can become fragile in that flow. Materialize the shared
 * workspace package as a real directory inside node_modules so runtime
 * require('@study-guild/shared') is stable after deployment extraction.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const deployDir = resolve(__dirname, '../deploy');
const deploySharedDir = resolve(deployDir, 'shared');
const nodeModulesSharedScope = resolve(deployDir, 'node_modules/@study-guild');
const nodeModulesSharedPackage = resolve(nodeModulesSharedScope, 'shared');

if (!existsSync(deploySharedDir)) {
  throw new Error('Missing server/deploy/shared. Run prepare-deploy.mjs first.');
}

if (!existsSync(resolve(deployDir, 'node_modules'))) {
  throw new Error('Missing server/deploy/node_modules. Run npm install --omit=dev --prefix server/deploy first.');
}

mkdirSync(nodeModulesSharedScope, { recursive: true });
rmSync(nodeModulesSharedPackage, { recursive: true, force: true });
cpSync(deploySharedDir, nodeModulesSharedPackage, { recursive: true });

console.log('Materialized @study-guild/shared in server/deploy/node_modules');
