import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL!;

// Create the postgres.js client
// For serverless environments (Vercel), use max 1 connection
const client = postgres(connectionString, {
  max: 1,
  prepare: false, // Required for some serverless environments
});

// Export the Drizzle ORM instance with schema for relational queries
export const db = drizzle(client, { schema });
