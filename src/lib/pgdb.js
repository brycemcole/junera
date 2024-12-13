// /lib/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Ensure you have dotenv installed and configured

const pool = new Pool({
    user: 'bryce',       // e.g., 'postgres'
    host: 'localhost',       // e.g., 'localhost'
    database: 'junera', // e.g., 'jobdb'
    password: 'Ebony!$314', // your PostgreSQL password
    port: 5432,         // 5432
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};