'use server'

import { query } from "@/lib/pgdb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { id } from "date-fns/locale";

const SECRET_KEY = process.env.SESSION_SECRET;

const validateInput = (data) => {
  // Basic input validation
  if (!data || typeof data !== 'string') return false;
  // Check for suspicious patterns
  if (data.includes('<script>') || data.includes('javascript:')) return false;
  // Check for reasonable length
  if (data.length > 100) return false;
  return true;
};

async function loginUser(emailOrUsername, password) {
  try {
    const result = await query(`
      SELECT id, password, username, full_name, avatar, email, job_prefs_title, job_prefs_location, job_prefs_level
      FROM users
      WHERE email = $1 OR username = $1;
    `, [emailOrUsername]);

    if (result.rows.length === 0) {
      return { error: "User not found" };
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { error: "Invalid password" };
    }

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      avatar: user.avatar || '/default.png',
      jobPrefsTitle: user.job_prefs_title,
      jobPrefsLocation: user.job_prefs_location,
      jobPrefsLevel: user.job_prefs_level
    };
  } catch (error) {
    console.error('Database error during login:', error);
    throw new Error('Internal server error');
  }
}

export async function loginAction(data) {
  try {
    if (!data.emailOrUsername || !data.password) {
      return { error: 'Email/Username and password are required' };
    }

    const user = await loginUser(data.emailOrUsername, data.password);

    if (user.error) {
      return { error: user.error };
    }

    const token = jwt.sign({
      id: user.userId,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      jobPrefsTitle: user.jobPrefsTitle,
      jobPrefsLocation: user.jobPrefsLocation,
      jobPrefsLevel: user.jobPrefsLevel
    }, SECRET_KEY);

    return {
      token,
      username: user.username,
      id: user.userId,
      fullName: user.fullName,
      avatar: user.avatar,
      jobPrefsTitle: user.jobPrefsTitle,
      jobPrefsLocation: user.jobPrefsLocation,
      jobPrefsLevel: user.jobPrefsLevel
    };

  } catch (error) {
    console.error('Login action error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return { error: 'An error occurred during login' };
  }
}

export async function registerAction(formData) {
  const fullname = formData.get('fullname')?.trim();
  const email = formData.get('email')?.trim();
  const username = formData.get('username')?.trim();
  const password = formData.get('password')?.trim();

  // Get cookies asynchronously
  const cookieStore = await cookies();
  const ip = cookieStore.get('x-real-ip')?.value || 'unknown';

  try {
    // Check rate limit
    const allowed = await checkRateLimit('register', ip);
    if (!allowed) {
      return { error: "Too many accounts created recently. Please try again later." };
    }

    // Validate all inputs
    if (!validateInput(fullname) || !validateInput(email) ||
      !validateInput(username) || !validateInput(password)) {
      return { error: "Invalid input detected" };
    }

    // Check username requirements
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return { error: "Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens" };
    }

    // Add a small delay to prevent timing attacks
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

    // Check if email already exists
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return { error: "Email already registered" };
    }

    // Check if username already exists
    const usernameCheck = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return { error: "Username already taken" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(`
      INSERT INTO users (full_name, email, username, password, last_login, created_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id;
    `, [fullname, email, username, hashedPassword]);

    const userId = result.rows[0].id;

    const token = jwt.sign({
      id: userId,
      email,
      fullName: fullname,
      username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }, SECRET_KEY);

    return { token, username, userId };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "An unexpected error occurred during registration" };
  }
}
