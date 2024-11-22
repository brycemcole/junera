import { getConnection } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const pool = await getConnection();

        // Fetch education experience
        const educationResult = await pool.request()
            .input("userId", userId)
            .query(`
                SELECT 
                    id,
                    institutionName,
                    degree,
                    fieldOfStudy,
                    startDate,
                    endDate,
                    isCurrent,
                    grade,
                    activities,
                    description
                FROM education_experiences
                WHERE userId = @userId
                ORDER BY endDate DESC
            `);

        // Fetch work experience
        const workResult = await pool.request()
            .input("userId", userId)
            .query(`
                SELECT 
                    id,
                    title,
                    companyName,
                    employmentType,
                    location,
                    startDate,
                    endDate,
                    description,
                    tags,
                    isCurrent
                FROM job_experiences 
                WHERE userId = @userId
                ORDER BY endDate DESC
            `);

        // Fetch user's basic info
        const userResult = await pool.request()
            .input("userId", userId)
            .query(`
                SELECT 
                    firstname,
                    lastname,
                    desired_job_title,
                    employment_type,
                    jobPreferredSalary,
                    jobPreferredIndustry,
                    desired_location,
                    jobPreferredSkills,
                    willing_to_relocate,
                    certifications,
                    preferred_industries,
                    preferred_companies,
                    professionalSummary,
                    soft_skills,
                    technical_skills,
                    other_skills,
                    zipcode
                FROM users 
                WHERE id = @userId
            `);

        const profile = {
            user: userResult.recordset[0],
            education: educationResult.recordset,
            experience: workResult.recordset
        };

        return NextResponse.json(profile);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Error fetching profile data" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const { firstname, lastname, desired_job_title, professionalSummary } = await req.json();

        const pool = await getConnection();
        await pool.request()
            .input("userId", userId)
            .input("firstname", firstname)
            .input("lastname", lastname)
            .input("desired_job_title", desired_job_title)
            .input("professionalSummary", professionalSummary)
            .query(`
                UPDATE users
                SET 
                    firstname = @firstname,
                    lastname = @lastname,
                    desired_job_title = @desired_job_title,
                    professionalSummary = @professionalSummary
                WHERE id = @userId
            `);

        return NextResponse.json({ message: "Profile updated successfully." });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Error updating profile data" }, { status: 500 });
    }
}