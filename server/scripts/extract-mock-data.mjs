/**
 * Extracts MOCK_COURSES and MOCK_LESSONS from the Vite client build.
 * Run: node server/scripts/extract-mock-data.mjs
 * Outputs: server/scripts/mock-seed-data.json
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../client');

const server = await createServer({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  server: { port: 5299 },
  logLevel: 'error',
});

await server.listen();

// Use the module runner to evaluate mockData in the Vite context
const modRunner = server.environments?.client?.moduleRunner;
if (!modRunner) {
  // Fallback: use ssrLoadModule
  const mod = await server.ssrLoadModule('/src/lib/mockData.ts');
  const { MOCK_COURSES, MOCK_LESSONS } = mod;
  const outPath = resolve(__dirname, 'mock-seed-data.json');
  writeFileSync(outPath, JSON.stringify({ courses: MOCK_COURSES, lessons: MOCK_LESSONS }, null, 2), 'utf8');
  console.log(`Written ${MOCK_COURSES.length} courses and ${MOCK_LESSONS.length} lessons to mock-seed-data.json`);
} else {
  const mod = await modRunner.import('/src/lib/mockData.ts');
  const { MOCK_COURSES, MOCK_LESSONS } = mod;
  const outPath = resolve(__dirname, 'mock-seed-data.json');
  writeFileSync(outPath, JSON.stringify({ courses: MOCK_COURSES, lessons: MOCK_LESSONS }, null, 2), 'utf8');
  console.log(`Written ${MOCK_COURSES.length} courses and ${MOCK_LESSONS.length} lessons to mock-seed-data.json`);
}

await server.close();
