import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { studentName, dateRange, incidents, behaviors, customNotes, focusedBehaviorId } = await request.json();

        if (!studentName) {
            return NextResponse.json(
                { error: 'Student name is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GOOGLE_API_KEY is not configured' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        let specificFocusInstruction = "";
        if (focusedBehaviorId && behaviors[focusedBehaviorId]) {
            const behaviorName = behaviors[focusedBehaviorId];
            specificFocusInstruction = `IMPORTANT: The teacher has specifically requested that this email focus primarily on the behavior "${behaviorName}". While you can mention other trends briefly, the main topic should be "${behaviorName}" and the data related to it.`;
        }

        const prompt = `
        You are an expert educational assistant helping a teacher write a progress report email to a parent.
        
        Student: ${studentName}
        Date Range: ${dateRange}
        
        Data Summary:
        ${JSON.stringify(incidents, null, 2)}
        
        Available Behaviors Map (ID to Label):
        ${JSON.stringify(behaviors, null, 2)}

        Teacher's Custom Notes/Context:
        "${customNotes || 'None provided.'}"

        ${specificFocusInstruction}

        Task:
        Write a professional, empathetic, and data-informed email to the student's parents.
        
        Guidelines:
        1. Subject Line: Create a clear subject line.
        2. Tone: Professional, supportive, and objective.
        3. Structure:
           - Friendly opening.
           - Summary of the data (mention specific trends, positive or negative). Use the behavior labels, not IDs.
           - Incorporate the teacher's custom notes if provided.
           - specific actionable next steps or invitation for discussion.
           - Professional closing.
        4. Do NOT use placeholders like "[Parent Name]" - use generic greetings like "Dear Family" or "Dear Parents/Guardians" unless you can infer it (which you can't here).
        5. Format the output as a plain text email body that is ready to copy and paste.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        return NextResponse.json({ report: textResponse });

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        const errorMessage = error.message || 'Internal server error';
        return NextResponse.json(
            { error: `AI Error: ${errorMessage}` },
            { status: 500 }
        );
    }
}
