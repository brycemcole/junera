'use server'

import { query } from "@/lib/pgdb";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';

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

export async function loginAction(data) {
  try {
    if (!data.emailOrUsername || !data.password) {
      return { error: 'Email/Username and password are required' };
    }

    // Get base URL with fallback for production

    // Construct the full URL properly
    const apiUrl = `/api/login`;

    console.log('Attempting login with URL:', apiUrl); // Debug log

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Login failed:', errorData);
      return { error: errorData.error || 'Login failed' };
    }

    const result = await response.json();

    if (!result.token) {
      return { error: 'No token received from server' };
    }

    return {
      token: result.token,
      username: result.username
    };

  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'An error occurred during login' };
  }
}

export async function registerAction(formData) {
  const fullname = formData.get('fullname')?.trim();
  const email = formData.get('email')?.trim();
  const username = formData.get('username')?.trim();
  const password = formData.get('password')?.trim();

  const ip = cookies().get('x-real-ip')?.value || 'unknown';

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

    // Add complexity requirements for password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return { error: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number" };
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
