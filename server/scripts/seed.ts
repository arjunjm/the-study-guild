/**
 * Seed CosmosDB with course and lesson data from mock-seed-data.json.
 * Run from repo root: npx tsx server/scripts/seed.ts
 * Generate the JSON first with: node server/scripts/extract-mock-data.mjs
 */
import dotenv from 'dotenv';
import path from 'path';
import { CosmosClient } from '@azure/cosmos';
import { readFileSync } from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DATABASE = 'study-guild' } = process.env;
if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.error('Missing COSMOS_ENDPOINT or COSMOS_KEY in .env');
  process.exit(1);
}

const dataPath = path.resolve(__dirname, 'mock-seed-data.json');
const { courses, lessons } = JSON.parse(readFileSync(dataPath, 'utf8')) as {
  courses: Array<{ id: string }>;
  lessons: Array<{ id: string }>;
};

const CONTAINERS = {
  COURSES: 'courses',
  LESSONS: 'lessons',
};

async function upsertBatch<T extends { id: string }>(
  db: ReturnType<InstanceType<typeof CosmosClient>['database']>,
  containerId: string,
  items: T[],
  label: string,
) {
  const container = db.container(containerId);
  let ok = 0;
  let fail = 0;
  for (const item of items) {
    try {
      await container.items.upsert(item);
      ok++;
      if (ok % 10 === 0) process.stdout.write('.');
    } catch (err: unknown) {
      console.error(`\n  Failed to upsert ${label} ${item.id}:`, (err as Error).message);
      fail++;
    }
  }
  console.log(`\n  ${label}: ${ok} upserted, ${fail} failed`);
}

async function seed() {
  const client = new CosmosClient({ endpoint: COSMOS_ENDPOINT!, key: COSMOS_KEY! });
  const db = client.database(COSMOS_DATABASE);

  // Ensure database and containers exist
  await client.databases.createIfNotExists({ id: COSMOS_DATABASE });
  for (const containerId of Object.values(CONTAINERS)) {
    await db.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ['/id'] },
    });
  }
  console.log(`Connected to database "${COSMOS_DATABASE}" — seeding ${courses.length} courses and ${lessons.length} lessons`);

  await upsertBatch(db, CONTAINERS.COURSES, courses, 'course');
  await upsertBatch(db, CONTAINERS.LESSONS, lessons, 'lesson');

  console.log('Seed complete.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
