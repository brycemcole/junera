// /lib/db.js
const { Pool } = require('pg');
const cron = require('node-cron');
require('dotenv').config(); // Ensure you have dotenv installed and configured

// Configure pool with proper settings
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    // Add these important configurations
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // how long to wait when connecting a new client
    maxUses: 7500, // number of times a client can be used before being replaced
    statement_timeout: 60000 // 60 seconds global timeout
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Wrapper function for queries with timeout and error handling
const query = async (text, params, timeout = 10000) => {
    const client = await pool.connect();
    try {
        // Set per-query timeout
        await client.query(`SET statement_timeout = ${timeout}`);

        const start = Date.now();
        const res = await client.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries for optimization
        if (duration > timeout / 2) { // Log if query takes more than half the timeout
            console.warn('Slow query:', { text, duration, rows: res.rowCount });
        }

        return res;
    } catch (err) {
        // Handle specific database errors
        if (err.code === '57014') {
            throw new Error(`Query timeout after ${timeout}ms`);
        }
        throw err;
    } finally {
        client.release(true); // true = destroy client if it's been used too many times
    }
};

// Specialized version for long-running queries
const longQuery = async (text, params) => {
    return query(text, params, 300000); // 5 minute timeout for long operations
};

// Health check function
const checkDB = async () => {
    try {
        const result = await query('SELECT 1');
        return result.rows.length > 0;
    } catch (err) {
        console.error('Database health check failed:', err);
        return false;
    }
};

const expireCache = async () => {
    try {
        const retentionPeriod = '1 hour'; // Adjust as needed
        await query('CALL expire_rows($1)', [retentionPeriod]);
        console.log(`[${new Date().toISOString()}] Cache expiration job executed successfully.`);
    } catch (error) {
        console.error('Error executing cache expiration job:', error);
    }
};

// Schedule the cache expiration job to run every hour at minute 0
cron.schedule('0 * * * *', () => {
    expireCache();
});

module.exports = {
    query,
    longQuery,
    checkDB,
    pool, // Export pool for graceful shutdown
};