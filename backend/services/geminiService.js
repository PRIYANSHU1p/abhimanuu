const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates civic intelligence using Gemini AI.
 * Analyzes text and images to categorize and route complaints.
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

    try {
        console.log("🛠️ [GEMINI SERVICE] Starting Multimodal AI Analysis...");
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("❌ [GEMINI SERVICE] CRITICAL: GEMINI_API_KEY is not defined in .env!");
            return fallbackResponse;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Models verified to exist in this environment
        const modelsToTry = [
            "gemini-flash-latest",
            "gemini-2.0-flash",
            "gemini-2.5-flash"
        ];
        
        let apiResponse = null;
        let lastError = null;

        const prompt = `
            You are a professional Civic Intelligence Agent for CitizenConnect.
            Analyze the following civic grievance report and provide a detailed, intelligent response in JSON format.
            
            USER INPUT: "${text || "No text description provided."}"
            
            ### LANGUAGE HANDLING RULES (STRICT ENFORCEMENT):
            1. DETECT the user's primary language directly from the complaint text (Hindi, Hinglish, English, Tamil, Telugu, or Bengali).
            2. NEVER default to English unless the original complaint is written in English.
            3. If the complaint is in Hindi -> ALL responses must be in Hindi (Devanagari script).
            4. If the complaint is in Hinglish -> ALL responses must be in Hinglish (Latin script).
            5. If the complaint is in Tamil -> ALL responses must be in Tamil.
            6. If the complaint is in Telugu -> ALL responses must be in Telugu.
            7. If the complaint is in Bengali -> ALL responses must be in Bengali.
            8. Preserve the native writing script of the user. Do NOT unnecessarily translate into English.
            9. If mixed-language text is detected, use the dominant language naturally.
            10. ALL fields below MUST be in the DETECTED LANGUAGE.

            ### RESPONSE FIELDS (JSON ONLY):
            - "category": Detected civic category (e.g., Road Infrastructure, Waste Management).
            - "priority": ONE OF: "Low", "Medium", "High", "Critical".
            - "department": The most relevant government department name in the detected language.
            - "estimatedResolution": A realistic timeframe (e.g., "3-5 कार्य दिवस" or "3-5 working days").
            - "aiSummary": A detailed 2–4 sentence intelligent summary in the detected language explaining the issue, public impact, urgency, possible consequences if ignored, and risk to citizens/infrastructure.
            - "aiRemarks": Professional government-style remarks in the detected language mentioning verification status, expected government action, inspection process, and escalation rules.
            - "safetyPrecautions": Practical, realistic public safety advice in the detected language (e.g., "Avoid the affected area", "Use alternate routes").
            - "imageSummary": A concise but detailed visual summary in the detected language of detected objects, visible hazards, public safety concerns, and traffic impact.
            - "visualCategory": Technical category of what is seen in the image.
            - "visualRiskLevel": Risk level based on visual evidence (Low/Medium/High/Critical).
            - "detectedObjects": Array of identified objects in the image.
            - "imageConfidence": Float (0.0 to 1.0).
            - "detectedLanguage": The name of the detected language (English, Hindi, Hinglish, Tamil, Telugu, Bengali).

            ### MULTIMODAL INSTRUCTION:
            If an image is provided, perform deep visual reasoning. Cross-reference the image with the text description. If the image confirms the severity (e.g., a massive sinkhole), set priority to "Critical". If the image is unrelated, rely on the text but mention the discrepancy in imageSummary.

            ### QUALITY RULES:
            - Maintain valid JSON format only.
            - Do NOT add any preamble or markdown outside the JSON block.
            - Ensure all text fields are high-quality, professional, and helpful.
        `;

        for (const modelName of modelsToTry) {
            try {
                console.log(`📡 [GEMINI SERVICE] Requesting model: ${modelName}`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                });
                
                const parts = [{ text: prompt }];
                if (imageBase64) {
                    const cleanBase64 = imageBase64.includes('base64,') 
                        ? imageBase64.split('base64,')[1] 
                        : imageBase64;
                    parts.push({
                        inlineData: {
                            data: cleanBase64,
                            mimeType: "image/jpeg"
                        }
                    });
                }

                const result = await model.generateContent(parts);
                apiResponse = result.response.text();
                
                if (apiResponse) {
                    console.log(`✅ [GEMINI SERVICE] Success with model: ${modelName}`);
                    // Debug log for raw response
                    console.log("📝 [GEMINI SERVICE] Raw AI Response:", apiResponse);
                    break;
                }
            } catch (err) {
                console.warn(`⚠️ [GEMINI SERVICE] Failure with ${modelName}:`, err.message);
                lastError = err;
            }
        }

        if (!apiResponse) {
            console.error("❌ [GEMINI SERVICE] All models failed.");
            return fallbackResponse;
        }

        try {
            // Robust cleaning for JSON - handles markdown blocks and extra text
            let cleanJson = apiResponse.trim();
            
            // Remove markdown code block wrappers if present
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.replace(/^```(?:json)?\s+/, "").replace(/\s+```$/, "");
            }

            // Find the actual JSON object bounds
            const jsonStart = cleanJson.indexOf('{');
            const jsonEnd = cleanJson.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error("No valid JSON object found in response");
            }
            
            cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);
            
            let parsedResult;
            try {
                // Try direct parsing first
                parsedResult = JSON.parse(cleanJson);
            } catch (firstError) {
                console.warn("⚠️ [GEMINI SERVICE] Direct JSON parse failed, attempting sanitization...", firstError.message);
                
                // Handle common encoding/newline issues
                // Preserve valid whitespace (\n, \r, \t) but escape other control characters
                const sanitizedJson = cleanJson
                    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, (c) => {
                        return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
                    });

                parsedResult = JSON.parse(sanitizedJson);
            }
            
            const finalResult = {
                ...fallbackResponse,
                ...parsedResult
            };

            // Ensure aliases and consistency for all mandatory fields
            finalResult.assignedDepartment = finalResult.assignedDepartment || finalResult.department || fallbackResponse.department;
            finalResult.estimatedResolutionTime = finalResult.estimatedResolutionTime || finalResult.estimatedResolution || fallbackResponse.estimatedResolution;
            finalResult.summary = finalResult.summary || finalResult.aiSummary || fallbackResponse.summary;
            finalResult.officialRemarks = finalResult.officialRemarks || finalResult.aiRemarks || fallbackResponse.aiRemarks;
            
            const validPriorities = ["Low", "Medium", "High", "Critical"];
            if (!validPriorities.includes(finalResult.priority)) {
                finalResult.priority = "Medium";
            }

            return finalResult;
        } catch (parseError) {
            console.error("❌ [GEMINI SERVICE] Final JSON Parse Error:", parseError.message);
            console.log("📝 [GEMINI SERVICE] Problematic JSON string:", apiResponse);
            return fallbackResponse;
        }

    } catch (globalError) {
        console.error("❌ [GEMINI SERVICE] Global failure:", globalError.message);
        return fallbackResponse;
    }
};

module.exports = {
    generateCivicIntelligence
};







