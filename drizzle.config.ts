import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './apps/web/drizzle/schema.ts',
  out: './apps/web/drizzle/migrations',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DRIZZLE_DATABASE_URL ?? './apps/web/drizzle/billux.db',
  },
});
