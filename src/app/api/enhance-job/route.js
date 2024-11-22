import { getConnection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { jobId, currentData } = await req.json();

  try {
    // First, backup the original description
    const pool = await getConnection();
    await pool.request()
      .input('id', jobId)
      .input('raw_description_no_format', currentData.description)
      .query(`
        UPDATE jobPostings 
        SET raw_description_no_format = @raw_description_no_format
        WHERE id = @id
      `);

    const jobSchema = {
      type: "json_schema",
      json_schema: {
        name: "job_enhancement",
        schema: {
          type: "object",
          properties: {
            salary_range_str: { type: "string" },
            experienceLevel: { type: "string" },
            description: { type: "string" },
            location: { type: "string" },
            benefits: { type: "string" },
            PreferredQualifications: { type: "string" },
            MinimumQualifications: { type: "string" },
            Responsibilities: { type: "string" },
            Requirements: { type: "string" },
            NiceToHave: { type: "string" },
            Schedule: { type: "string" },
            H1BVisaSponsorship: { type: "boolean" },
            IsRemote: { type: "boolean" },
            EqualOpportunityEmployerInfo: { type: "string" },
            Relocation: { type: "boolean" },
            employmentType: { type: "string" },
            accepted_college_majors: { type: "string" },
            skills_string: { type: "string" }
          },
          required: [
            "salary_range_str", "experienceLevel", "location", "benefits",
            "PreferredQualifications", "MinimumQualifications", "Responsibilities",
            "description",
            "Requirements", "NiceToHave", "Schedule",
            "H1BVisaSponsorship", "IsRemote", "EqualOpportunityEmployerInfo",
            "Relocation", "employmentType", "accepted_college_majors", "skills_string"
          ]
        }
      }
    };

    const messages = [
      {
        role: "system",
        content: `You are a helpful AI that enhances job postings by filling in missing information based on the existing job description. 
Follow these strict requirements:
- All fields must be returned as strings, not arrays
- All fields should have meaningful content, avoid "Not specified" or empty strings
- salary_range_str: Provide a realistic range like "$80,000 - $120,000 per year"
- description: Provide a brief summary of the job role and what they want from a candidate
- experienceLevel: Use standard levels (Internship, Entry, Mid, Senior, Lead, etc.)
- location: Specify city and state/country, e.g. "San Francisco, CA"
- benefits: List all benefits in a comma-separated string
- PreferredQualifications: Comprehensive list in a single string
- MinimumQualifications: Essential requirements in a single string
- Responsibilities: Key duties in a comma-separated string
- Requirements: Core requirements in a comma-separated string
- NiceToHave: Additional desired skills in a comma-separated string
- Schedule: Specify work schedule pattern (e.g. "Monday to Friday, 9 AM - 5 PM")
- H1BVisaSponsorship: Must be "True", "False"
- IsRemote: Must be "True", "False"
- EqualOpportunityEmployerInfo: Standard EEO statement
- Relocation: Must be "True", "False"
- employmentType: Use standard types (Full-time, Part-time, Contract, etc.)
- accepted_college_majors: Relevant majors in comma-separated string
- skills_string: All required skills in comma-separated string (max 100 characters, so keep it concise)

Respond only with JSON format data.`
      },
      {
        role: "user",
        content: `Based on this job posting, generate complete information following the system requirements:
Job Title: ${currentData.title}
Current Description: ${currentData.description}

Important: Ensure all fields are populated with realistic, relevant information based on the job context. If information isn't explicitly stated, infer it from similar roles in the industry.`
      }
    ];

    const completion = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        messages,
        response_format: jobSchema,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false
      })
    });

    const enhancedData = await completion.json();
    const aiResponse = JSON.parse(enhancedData.choices[0].message.content);
    console.log('AI Response:', aiResponse);  
    
    // Function to safely stringify complex objects/arrays
    const safeStringify = (value) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value || "Not specified";
    };

    // Process the data with safe stringification
    const processedData = {
      salary_range_str: aiResponse.salary_range_str || "Not specified",
      experienceLevel: aiResponse.experienceLevel || "Not specified",
      location: safeStringify(aiResponse.location),
      benefits: safeStringify(aiResponse.benefits),
      description: safeStringify(aiResponse.description),
      PreferredQualifications: safeStringify(aiResponse.PreferredQualifications),
      MinimumQualifications: safeStringify(aiResponse.MinimumQualifications),
      Responsibilities: safeStringify(aiResponse.Responsibilities),
      Requirements: safeStringify(aiResponse.Requirements),
      NiceToHave: safeStringify(aiResponse.NiceToHave),
      Schedule: safeStringify(aiResponse.Schedule),
      H1BVisaSponsorship: aiResponse.H1BVisaSponsorship || false,
      IsRemote: aiResponse.IsRemote || false,
      EqualOpportunityEmployerInfo: aiResponse.EqualOpportunityEmployerInfo || "Not specified",
      Relocation: aiResponse.Relocation || false,
      employmentType: aiResponse.employmentType || "Not specified",
      accepted_college_majors: safeStringify(aiResponse.accepted_college_majors),
      skills_string: aiResponse.skills_string || "Not specified"
    };

    // Update the database with enhanced data
    // Backup the original description before any processing
await pool.request()
.input('id', jobId)
.input('raw_description_no_format', currentData.description)
.query(`
  UPDATE jobPostings 
  SET raw_description_no_format = @raw_description_no_format
  WHERE id = @id
`);

// Proceed with the enhancement process
await pool.request()
.input('id', jobId)
.input('salary_range_str', processedData.salary_range_str)
.input('experienceLevel', processedData.experienceLevel)
.input('description', processedData.description)
.input('location', processedData.location)
.input('benefits', processedData.benefits)
.input('PreferredQualifications', processedData.PreferredQualifications)
.input('MinimumQualifications', processedData.MinimumQualifications)
.input('Responsibilities', processedData.Responsibilities)
.input('Requirements', processedData.Requirements)
.input('NiceToHave', processedData.NiceToHave)
.input('Schedule', processedData.Schedule)
.input('H1BVisaSponsorship', processedData.H1BVisaSponsorship)
.input('IsRemote', processedData.IsRemote)
.input('EqualOpportunityEmployerInfo', processedData.EqualOpportunityEmployerInfo)
.input('Relocation', processedData.Relocation)
.input('employmentType', processedData.employmentType)
.input('accepted_college_majors', processedData.accepted_college_majors)
.input('skills_string', processedData.skills_string)
.query(`
  UPDATE jobPostings 
  SET 
    salary_range_str = @salary_range_str,
    experienceLevel = @experienceLevel,
    location = @location,
    description = @description,
    benefits = @benefits,
    PreferredQualifications = @PreferredQualifications,
    MinimumQualifications = @MinimumQualifications,
    Responsibilities = @Responsibilities,
    Requirements = @Requirements,
    NiceToHave = @NiceToHave,
    Schedule = @Schedule,
    H1BVisaSponsorship = @H1BVisaSponsorship,
    IsRemote = @IsRemote,
    EqualOpportunityEmployerInfo = @EqualOpportunityEmployerInfo,
    Relocation = @Relocation,
    employmentType = @employmentType,
    accepted_college_majors = @accepted_college_majors,
    skills_string = @skills_string,
    isProcessed = 1
  WHERE id = @id
`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enhancing job:', error);
    return NextResponse.json({ error: 'Failed to enhance job posting' }, { status: 500 });
  }
}