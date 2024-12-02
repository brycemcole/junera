// /lib/usersCache.js

import { getConnection } from "@/lib/db";

let userCache = [];
let lastFetched = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getUsers() {
  const now = Date.now();
  
  // Refresh cache if expired
  if (now - lastFetched > CACHE_DURATION) {
    try {
      const pool = await getConnection();
      const query = `SELECT id, username, firstname, lastname, avatar FROM users WITH (NOLOCK);`;
      const result = await pool.request().query(query);
      userCache = result.recordset.reduce((acc, user) => {
        acc[user.id] = {
          id: user.id,  
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            avatar: user.avatar,
        };
        return acc;
      }, {});
      lastFetched = now;
      console.log("User cache refreshed.");
    } catch (error) {
      console.error("Error fetching users:", error);
      // keep old cache if fetch fails
    
    }
  }

  return userCache;
}