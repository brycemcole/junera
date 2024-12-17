// /lib/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Ensure you have dotenv installed and configured

const pool = new Pool({
    user: process.env.DB_USER,       // e.g., 'postgres'
    host: process.env.DB_HOST,       // e.g., 'localhost'
    database: process.env.DB_NAME, // e.g., 'jobdb'
    password: process.env.DB_PASS, // your PostgreSQL password
    port: process.env.DB_PORT,         // 5432
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};