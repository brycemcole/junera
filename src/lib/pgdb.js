// /lib/db.js
const { Pool } = require('pg');
const cron = require('node-cron');
require('dotenv').config(); // Ensure you have dotenv installed and configured

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const expireCache = async () => {
    try {
        const retentionPeriod = '1 hour'; // Adjust as needed
        const queryText = `CALL expire_rows($1);`;
        await pool.query(queryText, [retentionPeriod]);
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
    query: (text, params) => pool.query(text, params),
};