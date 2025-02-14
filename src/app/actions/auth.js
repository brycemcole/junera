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

const generateAuthToken = (user) => {
  return jwt.sign({
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.fullName || user.full_name,
    avatar: user.avatar,
    githubUsername: user.github_user,
    jobPrefsTitle: user.job_prefs_title,
    jobPrefsLocation: user.job_prefs_location,
    jobPrefsLevel: user.job_prefs_level,
    jobPrefsIndustry: user.job_prefs_industry,
    jobPrefsSalary: user.job_prefs_salary,
    jobPrefsRelocatable: user.job_prefs_relocatable,
    jobPrefsLanguage: user.job_prefs_language,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  }, SECRET_KEY);
};

async function loginUser(emailOrUsername, password) {
  try {
    const result = await query(`
      SELECT id, password, username, full_name, avatar, email, 
             job_prefs_title, job_prefs_location, job_prefs_level,
             job_prefs_industry, job_prefs_salary, job_prefs_relocatable,
             job_prefs_language, github_user
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

    // Update last_login after successful password match
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      avatar: user.avatar || '/default.png',
      githubUser: user.github_user,
      jobPrefsTitle: user.job_prefs_title,
      jobPrefsLocation: user.job_prefs_location,
      jobPrefsLevel: user.job_prefs_level,
      jobPrefsIndustry: user.job_prefs_industry,
      jobPrefsSalary: user.job_prefs_salary,
      jobPrefsRelocatable: user.job_prefs_relocatable,
      jobPrefsLanguage: user.job_prefs_language
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

    const token = generateAuthToken(user);

    return {
      token,
      username: user.username,
      id: user.id,
      fullName: user.fullName,
      avatar: user.avatar,
      githubUsername: user.githubUser,
      jobPrefsTitle: user.jobPrefsTitle,
      jobPrefsLocation: user.jobPrefsLocation,
      jobPrefsLevel: user.jobPrefsLevel,
      jobPrefsIndustry: user.jobPrefsIndustry,
      jobPrefsSalary: user.jobPrefsSalary,
      jobPrefsRelocatable: user.jobPrefsRelocatable,
      jobPrefsLanguage: user.jobPrefsLanguage
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

  const githubId = formData.get('github_id');
  const githubUser = formData.get('github_user');
  const avatarUrl = formData.get('avatar_url');

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
      INSERT INTO users (
        full_name, email, username, password, 
        github_id, github_user, avatar,
        last_login, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id;
    `, [
      fullname, email, username, hashedPassword,
      githubId || null, githubUser || null, avatarUrl || null
    ]);

    const userId = result.rows[0].id;

    const token = generateAuthToken({
      id: userId,
      email,
      fullName: fullname,
      username,
      avatar: avatarUrl,
      github_user: githubUser,
      job_prefs_title: null,
      job_prefs_location: null,
      job_prefs_level: null,
      job_prefs_industry: null,
      job_prefs_salary: null,
      job_prefs_relocatable: null,
      job_prefs_language: null
    });

    return { token, username, userId };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: "An unexpected error occurred during registration" };
  }
}

export async function updateGithubUserAction(userId, githubData) {
  try {
    // Validate inputs
    if (!userId || !githubData) {
      return { error: 'Missing required data' };
    }

    // Update user with GitHub information
    const result = await query(`
      UPDATE users 
      SET github_user = $1,
          github_id = $2,
          github_access_token = $3,
          avatar = COALESCE($4, avatar),
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, email, username, full_name, avatar, github_user,
                job_prefs_title, job_prefs_location, job_prefs_level,
                job_prefs_industry, job_prefs_salary, job_prefs_relocatable,
                job_prefs_language;
    `, [
      githubData.username,
      githubData.id,
      githubData.access_token,
      githubData.avatar_url,
      userId
    ]);

    if (result.rows.length === 0) {
      return { error: 'User not found' };
    }

    const updatedUser = result.rows[0];
    const token = generateAuthToken(updatedUser);

    return {
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        avatar: updatedUser.avatar,
        githubUsername: updatedUser.github_user,
        jobPrefsTitle: updatedUser.job_prefs_title,
        jobPrefsLocation: updatedUser.job_prefs_location,
        jobPrefsLevel: updatedUser.job_prefs_level,
        jobPrefsIndustry: updatedUser.job_prefs_industry,
        jobPrefsSalary: updatedUser.job_prefs_salary,
        jobPrefsRelocatable: updatedUser.job_prefs_relocatable,
        jobPrefsLanguage: updatedUser.job_prefs_language
      }
    };

  } catch (error) {
    console.error('Error updating GitHub user:', error);
    return { error: 'Failed to update GitHub user information' };
  }
}

// Export the token generator for use in GitHub callback
export { generateAuthToken };
