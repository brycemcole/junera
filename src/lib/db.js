'use server';

import sql from 'mssql';

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    connectTimeout: 30000,
    pool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 20000
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 20000,
      requestTimeout: 20000,
      cancelTimeout: 20000,
      packetSize: 16384
    },
  };

let pool;

export const getConnection = async () => {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
};