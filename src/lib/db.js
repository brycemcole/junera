'use server';

import sql from 'mssql';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    connectTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 20000
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 20000,
      requestTimeout: 20000,
      abortTransactionOnError: true,
      cancelTimeout: 20000,
      packetSize: 16384
    },
    debug: {
      pool: true,
      token: true,
      payload: true,
  },
    retryStrategy: {
      maxRetries: 3, // Number of retry attempts
      retryInterval: 2000, // Interval between retries (ms)
  },
  };

let pool;

export const getConnection = async () => {
  try {
    if (!pool) {
      console.log('Creating new connection pool...');
      pool = await sql.connect(dbConfig);
      
      // Handle pool errors
      pool.on('error', err => {
        console.error('Database pool error:', err);
        pool = null; // Reset pool on error
      });
    }
    
    // Test if the connection is still valid
    if (pool.connected) {
      return pool;
    } else {
      console.log('Pool exists but not connected, creating new connection...');
      pool = await sql.connect(dbConfig);
      return pool;
    }
  } catch (err) {
    console.error('Failed to get connection:', err);
    pool = null; // Reset pool on error
    throw err;
  }
};