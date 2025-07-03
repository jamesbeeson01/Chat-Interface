// Gemini API setup
const { GoogleGenAI } = require('@google/genai');
const { getTemplate } = require('./database');

// Initialize the AI client
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const errorResponse = 'I apologize, but I encountered an error in my attempt to respond. Please try again or contact jamesbeeson01@gmail.com saying you received a "bot.js" error.';

/**
 * Determines which phase of learning the conversation is in
 * @param {Array} history - An array of conversation history
 * @returns {Promise<string>} - Returns one of "Acquisition", "Fluency", "Generalization"
 */
async function director(contents) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: contents,
            config: {
                responseMimeType: "text/x.enum",
                responseSchema: {
                    type: "STRING",
                    enum: ["Acquisition", "Fluency", "Generalization/Abstraction"]
                }
            }
        });
        resolve(response.text);
    } catch (error) {
        reject(error);
    }
}

/**
 * Generates content based on the model, chapter, and conversation context
 * @param {string} model - The model name to use
 * @param {string} chapter - The chapter template to use
 * @param {Array} contents - The conversation history
 * @returns {Promise<object>} - Returns the generated content
 */
async function control(contents, model = 'gemini-2.0-flash') {
    try {
        
        // Generate content
        const result = await ai.models.generateContent({
            model: model,
            contents
        });

        // Get the text from the response property
        const text = result.text;

        // Send a valid string, using a placeholder if somehow we got here with an invalid response
        return { text };

    } catch (error) {
        console.error('Error in control function:', error);
        // Return a user-friendly error message instead of rejecting
        return { text: errorResponse };
    }
}

async function fluency(contents) {

}

async function ponder(contents) {

}

async function treatment(contents, chapter = 'Chapter 11', model = 'gemini-2.0-flash') {
    try {
        // Get the template for the chapter
        let chapterText = '';
        if (chapter) {
            chapterText = await getTemplate(chapter);
        }

        const config = {
            responseMimeType: 'text/plain',
            systemInstruction: [
                {
                    text: chapterText
                }
            ]
        }
        
        // Generate content
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.0-flash',
            config,
            contents
        });

        // Get the text from the response property
        const text = result.text;

        // Send a valid string, using a placeholder if somehow we got here with an invalid response
        return { text };

    } catch (error) {
        console.error('Error in control function:', error);
        // Return a user-friendly error message instead of rejecting
        return { text: errorResponse };
    }
}

module.exports = {
    control,
    treatment, 
    director,
    fluency,
    ponder
}