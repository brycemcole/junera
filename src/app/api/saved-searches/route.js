"use strict";
import { NextResponse } from 'next/server';
import { createDatabaseConnection } from '@/lib/db';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { getCached, setCached } from '@/lib/cache'; // ...existing code...

const SECRET_KEY = process.env.SESSION_SECRET || 'your-secret-key';

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

  const cachedSavedSearches = getCached('saved-searches', token);
  if (cachedSavedSearches) {
    return NextResponse.json({ savedSearches: cachedSavedSearches }, { status: 200 });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.id;

    const pool = await createDatabaseConnection();
    const query = `SELECT * FROM saved_searches WHERE user_id = @userId;`;
    const result = await pool.executeQuery(query, { userId });

    setCached('saved-searches', token, result.recordset);
    
    return NextResponse.json({ savedSearches: result.recordset }, { status: 200 });
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
    const { searchParams } = await request.json();

    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('searchParams', sql.NVarChar, JSON.stringify(searchParams))
      .query(`
        INSERT INTO saved_searches (user_id, search_params) 
        OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.search_params, INSERTED.created_at, INSERTED.updated_at
        VALUES (@userId, @searchParams);
      `);

    const insertedSearch = result.recordset[0];

    return NextResponse.json(insertedSearch, { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const { id, searchParams } = await request.json();

    const pool = await getConnection();
    await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.NVarChar, userId)
      .input('searchParams', sql.NVarChar, JSON.stringify(searchParams))
      .query(`
        UPDATE saved_searches 
        SET search_params = @searchParams, updated_at = GETDATE()
        WHERE id = @id AND user_id = @userId;
      `);

    return NextResponse.json({ message: 'Saved search updated successfully' }, { status: 200 });
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

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.NVarChar, userId)
      .query(`
        DELETE FROM saved_searches 
        WHERE id = @id AND user_id = @userId;
      `);

    if (result.rowsAffected[0] > 0) {
      return NextResponse.json({ message: 'Saved search deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}