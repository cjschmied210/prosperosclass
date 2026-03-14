
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateContentWithRetry(modelName: string, prompt: any, maxRetries = 3) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error: any) {
            console.error(`Attempt ${i + 1} failed:`, error.message);

            // If it's the last attempt, throw the error
            if (i === maxRetries - 1) throw error;

            // If it's a 503 or 429, wait and retry
            if (error.message.includes('503') || error.message.includes('429')) {
                const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential backoff + jitter
                console.log(`Waiting ${waitTime.toFixed(0)}ms before retry...`);
                await sleep(waitTime);
            } else {
                // If it's another error (like 400 or 401), waiting won't help, so throw immediately
                throw error;
            }
        }
    }
}
