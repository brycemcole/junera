
import { NextResponse } from 'next/server';
import { initializeDatabaseExtensions } from '../dashboard/init-db';

export async function GET() {
  try {
    await initializeDatabaseExtensions();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}