import { getConnection } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        const userId = decoded.id;

        const pool = await getConnection();

        // Combined query using CTEs
        const result = await pool.request()
            .input("userId", userId)
            .query(`
                WITH UserInfo AS (
                    SELECT 
                        firstname, lastname, desired_job_title, employment_type,
                        jobPreferredSalary, jobPreferredIndustry, desired_location,
                        jobPreferredSkills, willing_to_relocate, certifications,
                        preferred_industries, preferred_companies, professionalSummary,
                        soft_skills, technical_skills, other_skills, zipcode
                    FROM users 
                    WHERE id = @userId
                ),
                Education AS (
                    SELECT 
                        id, institutionName, degree, fieldOfStudy, startDate,
                        endDate, isCurrent, grade, activities, description
                    FROM education_experiences
                    WHERE userId = @userId
                ),
                WorkExperience AS (
                    SELECT 
                        id, title, companyName, employmentType, location,
                        startDate, endDate, description, tags, isCurrent
                    FROM job_experiences 
                    WHERE userId = @userId
                )
                SELECT 
                    (SELECT * FROM UserInfo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) as userData,
                    (SELECT * FROM Education ORDER BY endDate DESC FOR JSON PATH) as educationData,
                    (SELECT * FROM WorkExperience ORDER BY endDate DESC FOR JSON PATH) as experienceData
            `);

        // Parse JSON strings from the result
        const userData = JSON.parse(result.recordset[0].userData || '{}');
        const educationData = JSON.parse(result.recordset[0].educationData || '[]');
        const experienceData = JSON.parse(result.recordset[0].experienceData || '[]');

        const profile = {
            user: userData,
            education: educationData,
            experience: experienceData
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

        const updates = await req.json();

        // Handle numeric fields
        const desired_salary_min = updates.desired_salary_min === '' ? null : Number(updates.desired_salary_min);
        
        // Convert date string to SQL date format or null
        const availability_date = updates.availability_date ? new Date(updates?.availability_date)?.toISOString() : null;

        const pool = await getConnection();
        await pool.request()
            .input("userId", userId)
            .input("firstname", updates.firstname)
            .input("lastname", updates.lastname)
            .input("desired_job_title", updates.desired_job_title)
            .input("professionalSummary", updates.professionalSummary)
            .input("employment_type", updates.employment_type)
            .input("desired_location", updates.desired_location)
            .input("willing_to_relocate", updates.willing_to_relocate)
            .input("desired_salary_min", desired_salary_min)
            .input("availability_date", availability_date)
            .input("skills", updates.skills)
            .input("languages", updates.languages)
            .input("certifications", updates.certifications)
            .input("preferred_industries", updates.preferred_industries)
            .input("phone_number", updates.phone_number)
            .input("soft_skills", updates.soft_skills)
            .input("technical_skills", updates.technical_skills)
            .input("other_skills", updates.other_skills)
            .input("twitter", updates.twitter)
            .input("github_url", updates.github_url)
            .input("leetcode_url", updates.leetcode_url)
            .input("linkedin_url", updates.linkedin_url)
            .input("link", updates.link)
            .input("link2", updates.link2)
            .query(`
                UPDATE users
                SET 
                    firstname = @firstname,
                    lastname = @lastname,
                    desired_job_title = @desired_job_title,
                    professionalSummary = @professionalSummary,
                    employment_type = @employment_type,
                    desired_location = @desired_location,
                    willing_to_relocate = @willing_to_relocate,
                    desired_salary_min = @desired_salary_min,
                    availability_date = @availability_date,
                    skills = @skills,
                    languages = @languages,
                    certifications = @certifications,
                    preferred_industries = @preferred_industries,
                    phone_number = @phone_number,
                    soft_skills = @soft_skills,
                    technical_skills = @technical_skills,
                    other_skills = @other_skills,
                    twitter = @twitter,
                    github_url = @github_url,
                    leetcode_url = @leetcode_url,
                    linkedin_url = @linkedin_url,
                    link = @link,
                    link2 = @link2
                WHERE id = @userId
            `);

        return NextResponse.json({ message: "Profile updated successfully." });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ error: "Error updating profile data" }, { status: 500 });
    }
}