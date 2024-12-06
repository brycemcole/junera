import { createDatabaseConnection } from '@/lib/db'; // Adjust the path as needed
import jwt from 'jsonwebtoken'; // Import JWT

const SECRET_KEY = process.env.SESSION_SECRET; // Ensure you have a secret key in your environment variables

export async function GET(request) {
    const pool = await createDatabaseConnection();
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
        const query = `                SELECT 
                    n.id, 
                    n.type, 
                    n.important_message,
                    n.senderUserId,
                    n.jobId,
                    n.createdAt,
                    COALESCE(u.username, 'system') AS senderUsername,
                    COALESCE(u.firstname, 'System') AS senderFirstName,
                    COALESCE(u.lastname, 'Notification') AS senderLastName,
                    COALESCE(u.avatar, '/default-system-avatar.png') AS senderAvatar
                FROM notifications n
                LEFT JOIN users u ON n.senderUserId = u.id
                WHERE n.receiverUserId = @userId
                ORDER BY n.createdAt DESC;`;
        // Fetch notifications for the authenticated user with sender's user info
        const notifications = await pool.executeQuery(query, { userId });
        return new Response(JSON.stringify(notifications.recordset), { status: 200 });
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

        const pool = await getConnection();
        await pool.request()
            .input('notificationId', notificationId)
            .input('userId', userId)
            .query(`
                DELETE FROM notifications 
                WHERE id = @notificationId AND receiverUserId = @userId
            `);

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Delete notification error:', error);
        return new Response(JSON.stringify({ message: 'Error deleting notification' }), { status: 500 });
    }
}