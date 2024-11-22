import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET; // Match the key name used in login route

export function verifyToken(token) {
  try {
    if (!SECRET_KEY) {
      throw new Error("JWT secret key is not configured");
    }
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    throw new Error("Invalid token");
  }
}