const { AzureOpenAI } = require("openai");
const dotenv = require("dotenv");
const { zodResponseFormat } = require("openai/helpers/zod");
const { z } = require("zod");

dotenv.config();

class AIAgent {
    constructor() {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT || "https://junera-ai-services.openai.azure.com/";
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const apiVersion = "2024-08-01-preview";
        const deployment = process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o";

        this.client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });
    }

    async analyzeJobFit(jobPosting) {
        const JobFitAnalysis = z.object({
            worthy_apply: z.boolean().describe("Whether the user should apply to this job"),
            explanation: z.string().describe("A detailed explanation of why the user should or should not apply")
        }).describe("Job fit analysis result");

        const systemMessage = {
            role: "system",
            content: `You are a realistic and honest career advisor who prioritizes accurate job fit analysis.
            You must be strict about experience requirements and never overstate qualifications.
            
            Key rules:
            - Entry level roles (0-2 years) match with interns/juniors
            - Mid level roles (3-5 years) require proven work experience
            - Senior roles (5+ years) require extensive experience
            - Management roles require prior management experience
            - Technical roles require specific technical skill matches
            - Don't assume skills that aren't explicitly mentioned
            - Be direct about missing requirements
            
            Format your response as a JSON object with:
            - worthy_apply: boolean indicating if they should apply
            - explanation: detailed explanation of why they should or shouldn't apply
            
            Keep responses direct and honest, around 300 characters.`
        };

        const userMessage = {
            role: "user",
            content: `Analyze this job fit based on requirements:
Title: ${jobPosting.title}
Company: ${jobPosting.company}
Experience Level: ${jobPosting.experiencelevel}
Location: ${jobPosting.location}
Description: ${jobPosting.description}

Remember to be realistic about experience requirements and strict about required skills.`
        };

        const result = await this.client.chat.completions.create({
            messages: [systemMessage, userMessage],
            max_tokens: 400,
            temperature: 0.3,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true,
            response_format: zodResponseFormat(JobFitAnalysis, "JobFitAnalysis"),
        });

        // Return the ReadableStream for streaming responses
        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
    }

    async getJobFit(userProfile, jobPosting) {

        const JobFitAnalysis = z.object({
            matchScore: z.enum(["High", "Medium", "Low"]),
            message: z.string().describe("Personalized feedback and next steps"),
        }).describe("Job fit analysis result");

        const systemMessage = {
            role: "system",
            content: `You are a supportive and insightful career advisor who provides personalized feedback.
            Analyze the match between the person and job posting, speaking directly to them.
            
            Consider their full background:
            1. Work experience and its relevance
            2. Education and how it aligns
            3. Skills from all sources (work, projects, certifications)
            4. Side projects and personal achievements
            5. Location fit and flexibility
            
            Format your response as a JSON object with 'matchScore' (High, Medium, or Low) and 'message' (personal, actionable feedback).
            Keep response concise, under 300 characters.
            `,
        };

        const userMessage = {
            role: "user",
            content: `Analyze job fit for:
            
Complete User Profile:
${JSON.stringify({
    workHistory: userProfile.experience,
    education: userProfile.education,
    projects: userProfile.projects,
    certifications: userProfile.certifications,
    awards: userProfile.awards,
    preferences: userProfile.user
}, null, 2)}

Job Details:
${JSON.stringify(jobPosting, null, 2)}

Provide personal, actionable feedback that helps them understand their fit and next steps.`
        };

        try {
            const response = await this.client.chat.completions.create({
                messages: [systemMessage, userMessage],
                max_tokens: 300,
                temperature: 0.3,
                top_p: 0.95,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: false,
                response_format: zodResponseFormat(JobFitAnalysis, "JobFitAnalysis"),
            });

            if (response.choices && response.choices[0]) {
                return response.choices[0].message.content;
            }
            
            throw new Error('No valid response content found');
        } catch (error) {
            console.error('Error in getJobFit:', error);
            throw error;
        }
    }

    async summarizeJobPosting(jobPosting) {
        const systemMessage = {
            role: "system",
            content: `
        You are a helpful agent that works for ${jobPosting.company} to provide
        a short sentence about who the ideal candidate for this job is based on the requirements listed.
        You should prioritize requirements that a person can know if they have instantly. 
        EXAMPLE RESPONSE: 'We are seeking a ${jobPosting.title} with 4 years of experience in rust, 2 years in python, and a great attitude.'
      
        Here is the full content of the job posting:
        ${JSON.stringify(jobPosting)}
      `
        };

        const userMessage = {
            role: "user",
            content: `Please provide a brief summary of the job posting titled "${jobPosting.title}" at ${jobPosting.company}.`
        };

        const result = await this.client.chat.completions.create({
            messages: [systemMessage, userMessage],
            max_tokens: 200,
            temperature: 0.2,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true
        });

        // Return the ReadableStream for streaming responses
        return new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });
    }
}

module.exports = new AIAgent();