// src/lib/redisClient.js

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Create a Redis client using the REDIS_URL from environment variables
const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true, // Enable TLS for secure connection
        rejectUnauthorized: false, // Accept self-signed certificates if any
        reconnectStrategy: (retries) => {
            if (retries > 3) return new Error('Too many retries');
            return Math.min(retries * 100, 3000); // Exponential backoff
        },
        connectTimeout: 5000, // 5 seconds timeout
        keepAlive: 5000, // Keep connection alive every 5 seconds
    },
});

// Event listeners for debugging and connection status
client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

client.on('connect', () => {
    console.log('Redis client connected');
});

client.on('ready', () => {
    console.log('Redis client is ready to use');
});

// Function to connect the Redis client
const connectRedis = async () => {
    if (!client.isOpen) { // Check if the client is not already open
        try {
            await client.connect();
            console.log('Successfully connected to Redis');
        } catch (err) {
            console.error('Failed to connect to Redis:', err);
            // Optionally, implement retry logic or exit the process
        }
    }
};

// Initialize connection immediately
connectRedis();

// Export the connected client for use in other modules
export default client;