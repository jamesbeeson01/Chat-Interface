const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 3000;
const { saveMessage, getSessionMessages } = require('./database');

// Load environment variables
require('dotenv').config();

// api key
// const API_KEY = "AIzaSyBcCaUUXj4s6YYrRcXC7AGOrRbKNDrN7iQ"
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set');
    process.exit(1);
}

const model_type = "gemini-2.0-flash-exp"

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Gemini API setup
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: API_KEY});

// Get chat response
app.post('/chat/prompt', async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        const currentSessionId = sessionId || uuidv4();
        console.log('Session ID:', currentSessionId);
        console.log('Received prompt:', prompt);
        
        // Get session messages and save new user message
        const messages = await getSessionMessages(currentSessionId);
        const userMessageId = uuidv4();
        await saveMessage({
            id: userMessageId,
            content: prompt,
            type: 'user',
            sessionId: currentSessionId,
            model: model_type,
            templateName: 'Basic',
            parentMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
            input: null
        });

        // Format messages for Gemini
        const formattedMessages = [...messages, { type: 'user', content: prompt }].map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const input = {
            model: model_type,
            contents: formattedMessages
        }
          
        // Generate response
        const result = await ai.models.generateContent(input);
        const text = await result.text;
        
        // Save AI response
        await saveMessage({
            id: uuidv4(),
            content: text,
            type: 'ai',
            sessionId: currentSessionId,
            model: model_type,
            templateName: 'Basic',
            parentMessageId: userMessageId,
            input: JSON.stringify(input)
        });
        
        res.json({ 
            response: text,
            sessionId: currentSessionId
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get conversation history
app.get('/chat/history/:sessionId', async (req, res) => {
    try {
        const messages = await getSessionMessages(req.params.sessionId);
        res.json(messages);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle message clicks
app.post('/message/click', async (req, res) => {
    const { type, sessionId, content } = req.body;
    
    try {
        // Query the database to get the message ID
        const db = require('./database').db;
        db.get(
            'SELECT id FROM messages WHERE sessionId = ? AND type = ? AND content = ?',
            [sessionId, type, content],
            (err, row) => {
                if (err) {
                    console.error('Error finding message:', err);
                } else if (row) {
                    console.log(`Clicked message ID: ${row.id}`);
                }
            }
        );
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling message click:', error);
        res.sendStatus(500);
    }
});

// Get message details
app.get('/message/:messageId', async (req, res) => {
    try {
        const db = require('./database').db;
        db.get(
            'SELECT * FROM messages WHERE id = ?',
            [req.params.messageId],
            (err, row) => {
                if (err) {
                    console.error('Error finding message:', err);
                    res.status(500).json({ error: 'Internal server error' });
                } else if (row) {
                    // If input exists, parse it from JSON
                    if (row.input) {
                        try {
                            row.input = JSON.parse(row.input);
                        } catch (e) {
                            console.error('Error parsing input:', e);
                        }
                    }
                    res.json(row);
                } else {
                    res.status(404).json({ error: 'Message not found' });
                }
            }
        );
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
