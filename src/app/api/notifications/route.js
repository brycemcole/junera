import { getConnection } from '@/lib/db'; // Adjust the path as needed
import jwt from 'jsonwebtoken'; // Import JWT

const SECRET_KEY = process.env.SESSION_SECRET; // Ensure you have a secret key in your environment variables

export async function GET(request) {
    const pool = await getConnection();
    // Extract the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ message: 'Authorization header missing' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1]; // Expected format: 'Bearer <token>'
    if (!token) {
        return new Response(JSON.stringify({ message: 'Token missing' }), { status: 401 });
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id; // Adjust based on your token's payload

        // Fetch notifications for the authenticated user with sender's user info
        const notifications = await pool.request()
            .input('userId', userId)
            .query(`
                SELECT 
                    n.id, 
                    n.type, 
                    n.important_message,
                    n.senderUserId,
                    n.createdAt,
                    u.username AS senderUsername,
                    u.firstname AS senderFirstName,
                    u.lastname AS senderLastName,
                    u.avatar AS senderAvatar
                FROM notifications n
                JOIN users u ON n.senderUserId = u.id
                WHERE n.receiverUserId = @userId
                ORDER BY n.createdAt DESC;
            `);

        return new Response(JSON.stringify(notifications.recordset), { status: 200 });
    } catch (error) {
        console.error('Authentication error:', error);
        return new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
    }
}