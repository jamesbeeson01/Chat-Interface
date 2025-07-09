require('dotenv').config();

// Gemini API setup
const { GoogleGenAI, Type } = require('@google/genai');
const { getTemplate, getTitles, getText } = require('./database');

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
async function router(contents) {
    try {
        // const response = await ai.models.generateContent({
        //     model: 'gemini-2.0-flash',
        //     contents: contents,
        //     config: {
        //         responseMimeType: "text/x.enum",
        //         responseSchema: {
        //             type: "STRING",
        //             enum: ["Acquisition", "Fluency", "Generalization/Abstraction"]
        //         }
        //     }
        // });
        // const { additionalText, additionalTitles } = textGetter(contents);
        // contents.push({ role: 'user', parts: [{ text: }]})

        return response.text;
    } catch (error) {
        console.error(error);
        return { text: errorResponse };
    }
}

/**
 * Generates content based on the model, chapter, and conversation context
 * @param {string} model - The model name to use
 * @param {string} chapter - The chapter template to use
 * @param {Array} contents - The conversation history
 * @returns {Promise<object>} - Returns the generated content
 */
async function control(contents, model = 'gemini-2.5-flash') {
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

async function treatment(contents, chapter = 'Chapter 11', model = 'gemini-2.5-flash') {
    try {
        // Get the template for the chapter
        // let chapterText = '';
        // if (chapter) {
        //     chapterText = await getTemplate(chapter);
        // }

        try {
            const { textbookPrompt } = await textGetter(contents);

            const { learningStageText } = await learningStage(contents);

            // if (textbookPrompt) {
            //     contents = [
            //         ...contents.slice(0, -1), 
            //         {
            //             role: 'model',
            //             parts: [{ text: textbookPrompt }]
            //         },
            //         contents[contents.length - 1]
            //     ];
            // }

            // if (learningStageText) {
            //     contents = [
            //         ...contents.slice(0, -1), 
            //         {
            //             role: 'model',
            //             parts: [{ text: learningStageText }]
            //         },
            //         contents[contents.length - 1]
            //     ];
            // }

            if (textbookPrompt) {
                contents.push({
                    role: 'model',
                    parts: [{ text: textbookPrompt }]
                })
            };

            if (learningStageText) {
                contents.push({
                    role: 'model',
                    parts: [{ text: learningStageText }]
                })
            };
        }
        catch (err) { 
            console.log(err); 
        }

        const config = {
            systemInstruction: [{
                text: 'You are a helpful tutor. Tend to respond in short conversational ways and allow the user to share what they know to clarify their understanding and help them learn more effectively. Be slow to just give information and suggest they check their notes or the textbook or share what they DO know about the subject.'
            }]
        };
        
        // Generate content
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            config,
            contents
        });

        // Get the text from the response property
        const text = result.text;

        // Send a valid string, using a placeholder if somehow we got here with an invalid response
        return { text, contents };

    } catch (error) {
        console.error('Error in control function:', error);
        // Return a user-friendly error message instead of rejecting
        return { text: errorResponse };
    }
}


var usedTitles = []

async function textGetter(contents) {
    try {
        const titlesData = await getTitles();
        let titles = titlesData.map(row => row.title);

        // Filter out the titles that have already been used
        if (usedTitles && Array.isArray(usedTitles)) {
            titles = titles.filter(title => !usedTitles.includes(title));
        }

        // Make sure we still have titles available
        if (titles.length === 0) {
            console.warn('No unused titles available');
            // Fallback to using all titles if none are left
            titles = titlesData.map(row => row.title);
        }

        console.log('Available titles:', titles.length);

        const summaries = titlesData
            .filter(obj => titles.includes(obj.title))
            .map(row => `'${row.title}': ${row.summary}`)
            .join('\n');

        const getTextFunctionDeclaration = {
            name: 'getText',
            description: `Adds additional information from the course textbook to ground the model and have more relevant information for the user.`,
            parameters: {
                type: Type.OBJECT,
                properties: {
                    titles: {
                        type: Type.ARRAY,
                        description: "An array of 1 to 4 relevant topic titles from the available options. Only suggest topics if they seem genuinely helpful. Usually sections within a chapter are helpful as well as the chapter section itself.",
                        items: {
                            type: Type.STRING,
                            enum: titles,
                            description: summaries
                        }
                    }
                },
                required: ['titles']
            }
        };

        // Generation config with function declaration
        const config = {
            tools: [{
                functionDeclarations: [getTextFunctionDeclaration]
            }]
        };

        const textbookContents = [...contents, {
            role: 'user', 
            parts: [{ text: 'Add in some textbook content that would be helpful to this coversation.' }]
        }];

        console.log('Calling Gemini with function declaration...');
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite-preview-06-17",
            contents,
            config
        });

        console.log('Gemini response received');
        
        // Check if result has function calls
        if (result && result.functionCalls && result.functionCalls.length > 0) {
            console.log('Function calls found:', result.functionCalls.length);

            const call = result.functionCalls[0];
            const titles = call.args.titles;

            const textData = await getText(titles);
            const addTextbook = textData.map(row => row.cleanText).join('\n\n')
            const textbookPrompt = 'I may use some of the following text to inform or quote in my following responses as it benefits you.\n\n' + addTextbook;

            //usedTitles = [...usedTitles, ...titles];

            
            return { 
                titles,
                textbookPrompt,
                hasFunction: true 
            };
        } else {
            console.log('No function calls in response, checking alternative properties...');
            //console.log('Result keys:', Object.keys(result));
            return { hasFunction: false }
        }

    } catch (error) {
        console.error('Error in textGetter function:', error);
        return { 
            error: error.message,
            functionCalls: [],
            hasFunction: false
        };
    }
}

async function learningStage(contents) {
    try {

        contents = [contents[contents.length - 4], {
            role: 'user',
            parts: [{ text: `You are a helpful assessor of the user, informing yourself in your next response. Using the instructional hierarchy, what learning stage am I currently in with this content and how confident are you? Do not respond to my previous prompt, simply give a brief assessment of my learning stage and suggest to yourself how it would be helpful to respond to best support the student. An example response may be: 'I am 60% confident you are in the acquisition learning stage. I may modeling the skill for the user, then asking them to demonstrate it.'
                             Here are some link that may help to reference:
                             https://www.tieonline.com/article/3090/working-smarter-the-instructional-hierarchy#:~:text=The%20IH%20contains%20four%20stages,progressing%20to%20the%20next%20stage.
                             https://www.interventioncentral.org/sites/default/files/pdfs/pdfs_blog/instruction_instructional_hierarchy.pdf` }]
        }];

        const tools = [
            { urlContext: {} },
        ];

        const config = {
            thinkingConfig: {
                thinkingBudget: -1,
            },
            tools,
        };

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            config,
            contents
        });

        return { learningStageText: result.text + " . I will not comment on or mention this knowledge in my next response, but I will use it to inform how I respond." }
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = {
    control,
    treatment, 
    router,
    textGetter
}