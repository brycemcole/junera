import { NextResponse } from 'next/server';
import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { processAllPendingTasks, processTask } from '@/services/agentProcessor';

// Get all agent tasks for a user
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        at.*,
        array_length(processed_job_ids, 1) as jobs_processed_count,
        array_length(agent_notes, 1) as notes_count
      FROM agent_tasks at
      WHERE at.user_id = $1
      ORDER BY created_at DESC
    `, [decoded.id]);

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error('Error fetching agent tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// Create a new agent task
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { search_title, search_location, search_experience_level } = await request.json();

    // First get the user's profile data
    const userResult = await query(`
      SELECT 
        username,
        full_name,
        headline,
        job_prefs_title,
        job_prefs_location,
        job_prefs_skills,
        job_prefs_level,
        job_prefs_relocatable
      FROM users 
      WHERE id = $1
    `, [decoded.id]);

    if (!userResult.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userProfile = {
      username: user.username,
      fullName: user.full_name,
      headline: user.headline,
      preferences: {
        titles: user.job_prefs_title || [],
        locations: user.job_prefs_location || [],
        skills: user.job_prefs_skills || [],
        level: user.job_prefs_level || [],
        relocatable: user.job_prefs_relocatable
      }
    };

    const result = await query(`
      INSERT INTO agent_tasks (
        user_id, 
        search_title, 
        search_location, 
        search_experience_level,
        processed_job_ids,
        agent_notes,
        user_profile,
        created_at,
        status
      ) VALUES ($1, $2, $3, $4, ARRAY[]::text[], ARRAY[]::text[], $5, NOW(), 'pending')
      RETURNING *
    `, [decoded.id, search_title, search_location, search_experience_level, JSON.stringify(userProfile)]);

    const newTask = result.rows[0];
    
    // Trigger immediate processing for this task in the background
    // We don't await this to respond quickly to the user
    (async () => {
      try {
        await query(`UPDATE agent_tasks SET status = 'processing' WHERE id = $1`, [newTask.id]);
        await processTask(newTask.id);
        await query(`UPDATE agent_tasks SET status = 'completed' WHERE id = $1`, [newTask.id]);
      } catch (error) {
        console.error(`Error processing task ${newTask.id}:`, error);
        await query(`UPDATE agent_tasks SET status = 'error' WHERE id = $1`, [newTask.id]);
      }
    })();

    return NextResponse.json({ task: newTask });
  } catch (error) {
    console.error('Error creating agent task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// Delete an agent task
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await query(`
      DELETE FROM agent_tasks 
      WHERE id = $1 AND user_id = $2
    `, [taskId, decoded.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}