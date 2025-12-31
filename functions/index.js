const functions = require("firebase-functions");
const { GoogleGenAI } = require("@google/genai");
const cors = require('cors')({ origin: true });

// Access the API key from Firebase environment variables
// Set this using: firebase functions:config:set gemini.key="YOUR_API_KEY"
const API_KEY = functions.config().gemini ? functions.config().gemini.key : process.env.GEMINI_API_KEY;

exports.generateContent = functions.https.onCall(async (data, context) => {
    // 1. Check authentication (Optional but recommended)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { modelName, prompt, parts, config } = data;

    if (!API_KEY) {
        throw new functions.https.HttpsError('failed-precondition', 'API Key not configured.');
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-flash' });

    try {
        let result;
        if (parts) {
            // Multi-part content (images + text)
            result = await model.generateContent({
                contents: { role: 'user', parts: parts },
                ...config
            });
        } else {
            // Simple text prompt
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        return {
            text: response.text(),
            candidates: response.candidates
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
