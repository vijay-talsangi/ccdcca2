import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import logger from './logger.js';

// Configure Neon for different environments
const isLocal = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('neon-local');

if (isLocal) {
  // Configuration for Neon Local proxy
  logger.info('Configuring database for Neon Local development environment');
  neonConfig.fetchEndpoint = 'http://neon-local:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
  
  // Disable SSL verification for local development
  neonConfig.fetchConnectionCache = true;
} else {
  // Configuration for Neon serverless (production)
  logger.info('Configuring database for Neon serverless (production)');
  neonConfig.useSecureWebSocket = true;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, {
  logger: process.env.NODE_ENV === 'development'
});

// Test database connection
try {
  await sql`SELECT 1 as test`;
  logger.info('Database connection established successfully');
} catch (error) {
  logger.error('Failed to connect to database:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export { db, sql };
