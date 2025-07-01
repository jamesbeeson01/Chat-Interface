// Gemini API setup
import { GoogleGenAI, Type } from '@google/genai';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY});



// @history: an array of conversation history
function director(history) {
    return new Promise(async (resolve, reject) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: history,
            config: {
                responseMimeType: "text/x.enum",
                responseSchema: {
                    type: Type.STRING,
                    enum: ["Acquisition"]
                }
            }
        });
    });
}

module.exports = {
    director
}