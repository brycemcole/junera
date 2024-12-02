import { getUsers } from "@/lib/usersCache";
import { getConnection } from "@/lib/db";
import sql from "mssql";

export async function GET(req, { params }) {
    try {
        const { username } = params;

        if (!username) {
            return new Response(JSON.stringify({ error: "Username is required" }), { status: 400 });
        }

        // Fetch user information
        const users = await getUsers();
        const usersArray = Array.isArray(users) ? users : Object.values(users);
        const user = usersArray.find(u => u.username === username);

        if (!user) {
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
        }

        // Connect to the database
        const pool = await getConnection();

        // Query relationships
        const result = await pool.request()
            .input("userId", sql.NVarChar, user.id)
            .query(`
                SELECT 
                    r1.follower_id AS user_id,
                    r2.followed_id AS reciprocal_follow,
                    r1.created_at AS followed_since,
                    r2.created_at AS follower_since
                FROM user_relationships r1
                LEFT JOIN user_relationships r2
                    ON r1.follower_id = r2.followed_id AND r2.follower_id = @userId
                WHERE r1.followed_id = @userId OR r1.follower_id = @userId
            `);

        // Deduplicate relationships
        const uniqueRelationships = Array.from(
            new Map(result.recordset.map((rel) => [`${rel.user_id}-${rel.followed_since}`, rel])).values()
        );

        // Map and categorize relationships
        const relationships = uniqueRelationships.map(rel => {
            const friendDetails = usersArray.find(u => u.id === rel.user_id) || {};
            return {
                id: rel.user_id,
                username: friendDetails.username || "Unknown",
                firstname: friendDetails.firstname || "Unknown",
                lastname: friendDetails.lastname || "Unknown",
                relationship: rel.reciprocal_follow ? "friend" : 
                              rel.followed_since && !rel.follower_since ? "following" : 
                              "request",
                followed_since: rel.followed_since,
                follower_since: rel.follower_since,
            };
        });

        // Categorize relationships
        const categorizedRelationships = {
            requests: relationships.filter((rel) => rel.relationship === "request"),
            friends: relationships.filter((rel) => rel.relationship === "friend"),
            following: relationships.filter((rel) => rel.relationship === "following"),
        };

        return new Response(JSON.stringify(categorizedRelationships), { status: 200 });
    } catch (error) {
        console.error("Error fetching relationships:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch relationships" }), { status: 500 });
    }
}