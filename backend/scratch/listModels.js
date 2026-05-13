const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const listModels = async () => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        // The SDK might not have listModels on the genAI object directly in some versions
        // but we can try to find where it is or use a raw fetch.
        console.log("Listing models for key:", apiKey.substring(0, 4) + "...");
        
        // In newer SDKs, listModels is not directly exposed on genAI.
        // We might need to use the REST API directly to check.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
};

listModels();
