import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/pgdb';
import { getCached, setCached } from '@/lib/cache';

const SECRET_KEY = process.env.SESSION_SECRET;

// Handle GET requests to retrieve saved searches
export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const result = await query(
      'SELECT * FROM saved_searches WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    setCached('saved-searches', token, result.rows);

    return NextResponse.json({ savedSearches: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handle POST requests to create a new saved search
export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const body = await request.json();

    if (!body.searchName) {
      return NextResponse.json({ error: 'Search name is required' }, { status: 400 });
    }

    const searchCriteria = {
      title: body.searchCriteria.title || '',
      location: body.searchCriteria.location || '',
      experienceLevel: body.searchCriteria.experienceLevel || ''
    };

    const result = await query(
      `INSERT INTO saved_searches 
        (user_id, search_name, search_criteria, notify) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        userId,
        body.searchName,
        JSON.stringify(searchCriteria),
        body.notify || false
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}

// Handle PUT requests to update a saved search
export async function PUT(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const { id, searchName, searchCriteria, notify } = await request.json();

    const result = await query(
      `UPDATE saved_searches 
       SET search_name = $1, 
           search_criteria = $2, 
           notify = $3,
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [searchName, searchCriteria, notify, id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error('Error updating saved search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Handle DELETE requests to remove a saved search
export async function DELETE(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;
    const { id } = await request.json();

    const result = await query(
      `DELETE FROM saved_searches 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Saved search deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';