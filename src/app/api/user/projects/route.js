import { query } from '@/lib/pgdb';
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const result = await query(
            `SELECT * FROM user_projects 
             WHERE user_id = $1 
             ORDER BY is_current DESC, start_date DESC`,
            [userId]
        );

        return NextResponse.json({ projects: result.rows });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const project = await req.json();

        const insertQuery = `
            INSERT INTO user_projects (
                user_id, project_name, start_date, end_date, 
                is_current, description, technologies_used, project_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `;

        const result = await query(insertQuery, [
            userId,
            project.project_name,
            project.start_date,
            project.end_date,
            project.is_current,
            project.description,
            project.technologies_used,
            project.project_url
        ]);

        return NextResponse.json({
            message: 'Project added successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error adding project:', error);
        return NextResponse.json({ error: 'Error adding project' }, { status: 500 });
    }
};

export const PUT = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { id, ...project } = await req.json();

        const updateQuery = `
            UPDATE user_projects 
            SET project_name = $1,
                start_date = $2,
                end_date = $3,
                is_current = $4,
                description = $5,
                technologies_used = $6,
                project_url = $7
            WHERE id = $8 AND user_id = $9
        `;

        await query(updateQuery, [
            project.project_name,
            project.start_date,
            project.end_date,
            project.is_current,
            project.description,
            project.technologies_used,
            project.project_url,
            id,
            userId
        ]);

        return NextResponse.json({ message: 'Project updated successfully' });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Error updating project' }, { status: 500 });
    }
};

export const DELETE = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { id } = await req.json();

        const deleteQuery = `
            DELETE FROM user_projects 
            WHERE id = $1 AND user_id = $2
        `;

        await query(deleteQuery, [id, userId]);

        return NextResponse.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Error deleting project' }, { status: 500 });
    }
};
