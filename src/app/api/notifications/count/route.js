import { query } from "@/lib/pgdb";
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

export async function GET(request) {
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

        const queryText = `
            SELECT COUNT(*) as count
            FROM notifications n
            WHERE n.user_id = $1 AND n.is_active = true AND n.is_read = false
        `;

        const result = await query(queryText, [userId]);
        console.log(result);
        return new Response(JSON.stringify(result.rows), { status: 200 });
    } catch (error) {
        console.error('Authentication error:', error);
        return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
    }
}

export const dynamic = 'force-dynamic';