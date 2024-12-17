
import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300 });

export async function POST(req) {
  const savedSearchJobsCache = cache.get('savedSearchJobs');
  if (savedSearchJobsCache) {
    return NextResponse.json({ success: true, notificationCount: 0 });
  }
  try {
    const { jobId, title, company, location } = await req.json();
    const pool = await getConnection();

    const savedSearches = await pool.request().query(`
      SELECT ss.user_id, ss.search_params
      FROM saved_searches ss WITH (NOLOCK)
    `);

    const notifications = [];
    for (const search of savedSearches.recordset) {
      const searchParams = JSON.parse(search.search_params);
      if ((searchParams.title && title.toLowerCase().includes(searchParams.title.toLowerCase())) ||
          (searchParams.location && location.toLowerCase().includes(searchParams.location.toLowerCase())) ||
          (searchParams.company && company.toLowerCase().includes(searchParams.company.toLowerCase()))) {
        notifications.push({
          userId: search.user_id,
          message: `New job match: ${title} at ${company}`
        });
      }
    }

    if (notifications.length > 0) {
      await pool.request().query(`
        INSERT INTO notifications (receiverUserId, type, important_message, jobId, createdAt)
        VALUES ${notifications.map(n => `(
          ${n.userId},
          'job_match',
          '${n.message.replace("'", "''")}',
          ${jobId},
          GETDATE()
        )`).join(',')}
      `);
    }

    return NextResponse.json({ success: true, notificationCount: notifications.length });
  } catch (error) {
    console.error("Error checking saved searches:", error);
    return NextResponse.json({ error: "Failed to check saved searches" }, { status: 500 });
  }
}