import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
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

        const prompt = `
        Analyze the following IEP (Individualized Education Program) or student support text. 
        Extract specific, observable, and actionable behaviors that a teacher should track.
        
        Return ONLY a JSON object with this exact structure, no markdown formatting:
        {
            "positive": ["behavior 1", "behavior 2", ...],
            "negative": ["behavior 1", "behavior 2", ...]
        }

        Limit to the top 3-5 most important behaviors for each category.
        Keep descriptions concise (under 10 words).

        Text to analyze:
        "${text}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanedText);
            return NextResponse.json(data);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', textResponse);
            return NextResponse.json(
                { error: 'Failed to parse AI response' },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('IEP Analysis Error:', error);
        const errorMessage = error.message || 'Internal server error';
        return NextResponse.json(
            { error: `AI Error: ${errorMessage}` },
            { status: 500 }
        );
    }
}
