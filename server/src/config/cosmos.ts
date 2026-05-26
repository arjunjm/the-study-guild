import { CosmosClient, Database, Container } from '@azure/cosmos';
import { env } from './env';

let client: CosmosClient | null = null;
let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  if (!env.cosmos.endpoint || !env.cosmos.key) {
    throw new Error('CosmosDB credentials not configured. Set COSMOS_ENDPOINT and COSMOS_KEY in .env');
  }

  client = new CosmosClient({ endpoint: env.cosmos.endpoint, key: env.cosmos.key });
  const { database } = await client.databases.createIfNotExists({ id: env.cosmos.database });
  db = database;
  return db;
}

export async function getContainer(containerId: string): Promise<Container> {
  const database = await getDatabase();
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/id'] },
  });
  return container;
}

export const CONTAINERS = {
  USERS: 'users',
  COURSES: 'courses',
  LESSONS: 'lessons',
  PROGRESS: 'progress',
  RATINGS: 'ratings',
  XP_EVENTS: 'xp-events',
  ACHIEVEMENTS: 'achievements',
} as const;
