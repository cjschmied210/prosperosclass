import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
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

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString('base64');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
        Analyze this image of a class roster. 
        Extract all student names found in the list.
        Return ONLY a valid JSON array of objects, where each object has "firstName" and "lastName" properties.
        Example: [{"firstName": "John", "lastName": "Doe"}, {"firstName": "Jane", "lastName": "Smith"}]
        Ignore any headers, footers, dates, or other text that is not a student name.
        If a name is "Last, First" format, parse it correctly.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up the response to ensure it's valid JSON
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const students = JSON.parse(jsonString);
            return NextResponse.json({ students });
        } catch (e) {
            console.error('Failed to parse AI response:', text);
            return NextResponse.json(
                { error: 'Failed to parse student names from the image.' },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Error processing roster:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
