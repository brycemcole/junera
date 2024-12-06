// /lib/db.js
import sql from 'mssql';

/**
 * Database Class
 * Encapsulates all database operations using the mssql package.
 */
export default class Database {
  private pool: sql.ConnectionPool | null;
  private config: sql.config;
  private connected: boolean;
  
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.connected = false;
  }

  async connect() {
    try {
      if (!this.pool) {
        console.log('Creating new connection pool...');
        this.pool = await sql.connect(this.config);

        // Handle pool errors
        this.pool.on('error', (err) => {
          console.error('Database pool error:', err);
          this.pool = null; // Reset pool on error
          this.connected = false;
        });
      }

      if (this.pool.connected) {
        this.connected = true;
        console.log('Database connected successfully.');
        return this.pool;
      } else {
        console.log('Pool exists but not connected, creating new connection...');
        this.pool = await sql.connect(this.config);
        this.connected = true;
        return this.pool;
      }
    } catch (error) {
      console.error('Error connecting to the database:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        console.log('Database connection closed.');
        this.pool = null;
        this.connected = false;
      }
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  async executeQuery(query, params = {}) {
    try {
      if (!this.pool) await this.connect();
      const request = this.pool.request();

      // Add input parameters
      for (const [key, value] of Object.entries(params)) {
        // Determine SQL type dynamically or set a default type
        if (typeof value === 'number') {
          request.input(key, sql.Int, value);
        } else if (value instanceof Date) {
          request.input(key, sql.DateTime, value);
        } else {
          request.input(key, sql.NVarChar, value);
        }
      }

      const result = await request.query(query);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  public getPool() {
    return this.pool;
  }

  // ... other CRUD methods (create, read, update, delete) ...
}

/**
 * Database Configuration
 * Ensure that the following environment variables are set:
 * - DB_USER
 * - DB_PASSWORD
 * - DB_NAME
 * - DB_SERVER
 */
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  connectTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 20000,
  },
  options: {
    encrypt: true, // Use encryption
    trustServerCertificate: false, // Change to true for local dev / self-signed certs
    connectionTimeout: 20000,
    requestTimeout: 20000,
    abortTransactionOnError: true,
    cancelTimeout: 20000,
    packetSize: 16384,
  },
  debug: {
    pool: true,
    token: true,
    payload: true,
  },
  retryStrategy: {
    maxRetries: 3, // Number of retry attempts
    retryInterval: 2000, // Interval between retries in ms
  },
};

/**
 * Singleton Instance
 * Ensures that only one instance of the Database class exists.
 */
let databaseInstance = null;

/**
 * Creates and returns a singleton Database instance.
 * @returns {Database} - The Database instance.
 */
export const createDatabaseConnection = async () => {
  if (!databaseInstance) {
    databaseInstance = new Database(dbConfig);
    await databaseInstance.connect();
  }
  return databaseInstance;
};

export const getConnection = async () => {
  if (!databaseInstance) {
    databaseInstance = new Database(dbConfig);
    await databaseInstance.connect();
  }
  return databaseInstance.getPool();
}