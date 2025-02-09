import { query } from "@/lib/pgdb";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET;

const getClientIp = (headersList) => {
  // Try different headers that might contain the client IP
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  return "0.0.0.0"; // fallback IP if none found
};

export async function POST(req, { params }) {
  const { id } = params;
  const headersList = headers();
  const ip = getClientIp(headersList);
  
  // Check rate limit for non-authenticated users
  let user = null;
  const authHeader = headersList.get("authorization");
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      user = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }

  if (!user) {
    try {
      const hasRemaining = await checkRateLimit("report", ip);
      if (!hasRemaining) {
        return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Continue without rate limiting if it fails
    }
  }

  try {
    const { reportType, comments } = await req.json();

    // Validate input
    if (!reportType) {
      return Response.json({ error: "Report type is required" }, { status: 400 });
    }

    if (reportType === "other" && !comments?.trim()) {
      return Response.json({ error: "Comments are required for 'other' report type" }, { status: 400 });
    }

    // Insert report
    const result = await query(
      `INSERT INTO job_reports (job_id, user_id, report_type, comments, ip_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [id, user?.id || null, reportType, comments, ip]
    );

    return Response.json({ success: true, reportId: result.rows[0].id }, { status: 200 });

  } catch (error) {
    console.error("Error creating report:", error);
    return Response.json({ error: "Failed to create report" }, { status: 500 });
  }
}