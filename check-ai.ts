
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;

console.log('Testing Gemini Access...');
console.log('API Key exists:', !!apiKey);

if (!apiKey) {
    console.error('ERROR: Missing GEMINI_API_KEY');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    try {
        console.log('Getting model gemini-1.5-flash...');
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        console.log('Generating content...');
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();

        console.log('Success! Response:', text);
    } catch (err: any) {
        console.error('Gemini Error:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
        }
    }
}

test();
