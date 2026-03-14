const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access API key from environment
const apiKey = process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy model just to get the client
        // Actually, listing models might not be directly exposed in the high-level SDK easily without a specific method.
        // Let's use the REST API via fetch to be sure.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("Error fetching models:", data.error);
        } else {
            console.log("Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (${m.displayName})`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
