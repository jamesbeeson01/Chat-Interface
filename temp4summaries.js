// Load environment variables first
require('dotenv').config();

// Gemini API setup
const { GoogleGenAI } = require('@google/genai');

// Initialize the AI client
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const util = require('util');

// Create/connect to SQLite database
const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the chat database.');
});

// Promisify db methods for async/await usage
db.all = util.promisify(db.all);
db.run = util.promisify(db.run);

async function summarizeAndUpdate() {
    try {
        // Select rows that haven't been summarized yet
        const rows = await db.all("SELECT cleanText FROM textbook WHERE cleanText IS NOT NULL AND summary IS NULL LIMIT 15");

        if (rows.length === 0) {
            console.log("No new text to summarize.");
            return;
        }

        console.log(`Found ${rows.length} entries to summarize.`);

        const prompt = "Provide a brief summary packed with key words to reference following text:";

        for (const row of rows) {
            const cleanText = row.cleanText;

            try {
                const response = await ai.models.generateContent({model: "gemini-2.0-flash", contents: prompt + "\n\n" + cleanText});
                const summary = response.text;
                // console.log(summary);

                db.run(
                    "UPDATE textbook SET summary = ? WHERE cleanText = ?",
                    [summary, cleanText]
                );
                console.log("Successfully summarized and updated one entry.");

            } catch (genError) {
                console.error('Error generating summary or updating database for one entry:', genError);
            }
        }
    } catch (err) {
        console.error('Database query error:', err);
    } finally {
        db.close((err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log('Closed the database connection.');
        });
    }
}

// Run the main function
summarizeAndUpdate();
