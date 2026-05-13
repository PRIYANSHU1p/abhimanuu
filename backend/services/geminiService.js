const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

/**
 * Generates civic intelligence using Gemini AI with a Groq fallback.
 */
const generateCivicIntelligence = async (text, imageBase64 = null, languageHint = 'English') => {
    const fallbackResponse = {
        category: "General Inquiry",
        priority: "Medium",
        department: "Municipal Corporation",
        assignedDepartment: "Municipal Corporation",
        estimatedResolution: "3-5 working days",
        estimatedResolutionTime: "3-5 working days",
        aiSummary: "AI analysis unavailable. Routed to general desk.",
        summary: "AI analysis unavailable. Routed to general desk.",
        aiRemarks: "We have received your request and will manually verify the details.",
        safetyPrecautions: "Please stay cautious until our team inspects the site.",
        detectedLanguage: languageHint || "English",
        visualCategory: "None",
        visualRiskLevel: "Low",
        detectedObjects: [],
        imageSummary: "No visual analysis performed.",
        imageConfidence: 0
    };

    const prompt = `
        You are a professional Civic Intelligence Agent for CitizenConnect.
        Analyze the following civic grievance report and provide a detailed, intelligent response in JSON format.
        
        USER INPUT: "${text || "No text description provided."}"
        
        ### LANGUAGE HANDLING RULES (STRICT ENFORCEMENT):
        1. DETECT the user's primary language directly from the complaint text (Hindi, Hinglish, English, Tamil, Telugu, Bengali).
        2. ALL fields below MUST be in the DETECTED LANGUAGE.
        3. If mixed-language text is detected, use the dominant language naturally.

        ### RESPONSE FIELDS (JSON ONLY):
        - "category": Detected civic category (e.g., Road Infrastructure, Waste Management).
        - "priority": ONE OF: "Low", "Medium", "High", "Critical".
        - "department": Relevant government department name in the detected language.
        - "estimatedResolution": A realistic timeframe (e.g., "3-5 कार्य दिवस").
        - "aiSummary": A detailed 2–4 sentence intelligent summary explaining the issue and impact.
        - "aiRemarks": Professional government-style remarks mentioning verification and action.
        - "safetyPrecautions": Practical public safety advice.
        - "imageSummary": Detailed visual summary of hazards and impact.
        - "visualCategory": Technical category of what is seen.
        - "visualRiskLevel": Low/Medium/High/Critical.
        - "detectedObjects": Array of identified objects.
        - "imageConfidence": Float (0.0 to 1.0).
        - "detectedLanguage": The name of the detected language.

        ### QUALITY RULES:
        - Maintain valid JSON format only. No preamble.
    `;

    // Strategy 1: Google Gemini (Primary)
    try {
        console.log("🛠️ [AI SERVICE] Attempting Gemini Analysis...");
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            const genAI = new GoogleGenerativeAI(apiKey);
            const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro"];
            
            for (const modelName of modelsToTry) {
                try {
                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    
                    const parts = [{ text: prompt }];
                    if (imageBase64) {
                        parts.push({
                            inlineData: {
                                data: imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64,
                                mimeType: "image/jpeg"
                            }
                        });
                    }

                    const result = await model.generateContent(parts);
                    const responseText = result.response.text();
                    if (responseText) {
                        console.log(`✅ [AI SERVICE] Gemini (${modelName}) Success!`);
                        return parseAIResponse(responseText, fallbackResponse);
                    }
                } catch (err) {
                    console.warn(`⚠️ [AI SERVICE] Gemini ${modelName} failed:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error("❌ [AI SERVICE] Gemini global failure:", err.message);
    }

    // Strategy 2: Groq Fallback (Secondary)
    try {
        console.log("🛠️ [AI SERVICE] Gemini failed. Falling back to Groq (Llama 3.1)...");
        const groqKey = process.env.GROQ_API_KEY;
        if (groqKey) {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.1-70b-versatile",
                messages: [
                    { role: "system", content: "You are a civic intelligence agent. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseText = response.data.choices[0].message.content;
            if (responseText) {
                console.log("✅ [AI SERVICE] Groq Fallback Success!");
                return parseAIResponse(responseText, fallbackResponse);
            }
        } else {
            console.error("❌ [AI SERVICE] Groq Key missing in .env");
        }
    } catch (err) {
        console.error("❌ [AI SERVICE] Groq Fallback failed:", err.message);
    }

    return fallbackResponse;
};

/**
 * Robust JSON parser for AI responses
 */
const parseAIResponse = (responseText, fallback) => {
    try {
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```(?:json)?\s+/, "").replace(/\s+```$/, "");
        }
        const jsonStart = cleanJson.indexOf('{');
        const jsonEnd = cleanJson.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
        }
        
        const parsed = JSON.parse(cleanJson);
        const final = { ...fallback, ...parsed };
        
        // Ensure consistency
        final.assignedDepartment = final.assignedDepartment || final.department || fallback.department;
        final.estimatedResolutionTime = final.estimatedResolutionTime || final.estimatedResolution || fallback.estimatedResolution;
        final.summary = final.summary || final.aiSummary || fallback.summary;
        final.officialRemarks = final.officialRemarks || final.aiRemarks || fallback.aiRemarks;
        
        return final;
    } catch (e) {
        console.error("❌ [AI SERVICE] Parse error:", e.message);
        return fallback;
    }
};

module.exports = {
    generateCivicIntelligence
};




