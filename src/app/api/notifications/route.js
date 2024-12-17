import { query } from "@/lib/pgdb";
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(request) {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ message: 'Authorization header missing' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return new Response(JSON.stringify({ message: 'Token missing' }), { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        // First, get job match groups
        const groupQueryText = `
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND type = 'job_match' AND is_active = true
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `;

        const groupResult = await query(groupQueryText, [userId]);
        const groups = groupResult.rows;

        // Then get paginated notifications
        const queryText = `
            SELECT 
                n.id,
                n.type,
                n.message as important_message,
                n.related_id as jobid,
                n.created_at as "createdAt",
                n.is_read,
                n.metadata,
                j.job_id,
                CASE 
                    WHEN n.type = 'job_match' AND j.company IS NOT NULL THEN j.company
                    ELSE COALESCE(u.username, 'system')
                END AS "senderUsername",
                CASE 
                    WHEN n.type = 'job_match' AND j.company IS NOT NULL THEN j.company
                    ELSE COALESCE(u.full_name, 'System Notification')
                END AS "senderName",
                CASE 
                    WHEN n.type = 'job_match' AND j.company IS NOT NULL THEN 
                        concat('https://logo.clearbit.com/', replace(lower(j.company), ' ', '-'), '.com')
                    ELSE NULL
                END AS "senderLogo",
                COUNT(*) OVER() as total_count
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            LEFT JOIN jobpostings j ON n.type = 'job_match' AND n.related_id = j.id
            WHERE n.user_id = $1 AND n.is_active = true
            ORDER BY n.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await query(queryText, [userId, limit, offset]);
        const totalCount = result.rows[0]?.total_count || 0;

        return new Response(JSON.stringify({
            notifications: result.rows,
            groups,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        }), { status: 200 });
    } catch (error) {
        console.error('Authentication error:', error);
        return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
    }
}

export async function DELETE(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ message: 'Authorization header missing' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        const queryText = `
            UPDATE notifications 
            SET is_active = false 
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;

        const result = await query(queryText, [notificationId, userId]);

        if (result.rowCount === 0) {
            return new Response(JSON.stringify({ message: 'Notification not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Delete notification error:', error);
        return new Response(JSON.stringify({ message: 'Error deleting notification' }), { status: 500 });
    }
}

export async function PUT(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ message: 'Authorization header missing' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        let queryText;
        let queryParams;

        if (notificationId) {
            // Mark single notification as read
            queryText = `
                UPDATE notifications 
                SET is_read = true 
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `;
            queryParams = [notificationId, userId];
        } else {
            // Mark all notifications as read
            queryText = `
                UPDATE notifications 
                SET is_read = true 
                WHERE user_id = $1 AND is_read = false
                RETURNING id
            `;
            queryParams = [userId];
        }

        const result = await query(queryText, queryParams);
        return new Response(JSON.stringify({ success: true, updated: result.rowCount }), { status: 200 });
    } catch (error) {
        console.error('Update notification error:', error);
        return new Response(JSON.stringify({ message: 'Error updating notification' }), { status: 500 });
    }
}

export const dynamic = 'force-dynamic';