// Load environment variables first
require('dotenv').config();

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 3000;
const { saveMessage, getSessionMessages, getNumPrompts, saveSession, updateSessionLength, getSessionLength, countAIQuestionMarks, lastTreatment, getTreatment, getTemplate } = require('./database');
const { control, treatment } = require('./bots');

const model_type = "gemini-2.5-flash";
var template = "Basic";

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Get chat response
app.post('/chat/prompt', async (req, res) => {
    try {
        const { prompt, sessionId } = req.body;
        
        // Ensure we have a session ID
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        // Get the treatment group for this specific session
        const sessionTreatment = await getTreatment(sessionId);
        const templateName = (sessionTreatment === 1) ? 'Treatment' : 'Control';
        console.log('Session ID:', sessionId);
        console.log('Session Treatment:', sessionTreatment);
        console.log('Template Name:', templateName);
        console.log('Received prompt:', prompt);
        
        // Get session messages and save new user message
        const messages = await getSessionMessages(sessionId);
        const userMessageId = uuidv4();
        await saveMessage({
            id: userMessageId,
            content: prompt,
            type: 'user',
            sessionId: sessionId,
            model: model_type,
            templateName: templateName,
            parentMessageId: messages.length > 0 ? messages[messages.length - 1].id : null,
            input: null
        });

        // Format messages for Gemini
        const formattedMessages = [...messages, { type: 'user', content: prompt }].map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        let text = ''
        let input = {
            model: model_type,
            contents: formattedMessages
        }
          
        // Generate response
        //const result = await generateContent(input);
        if (templateName === 'Control') {
            const result = await control(formattedMessages, model_type);
            text = result.text;
        } else if (templateName === 'Treatment') {
            const result = await treatment(formattedMessages, 'Chapter 11', model_type);
            text = result.text;
            input = {
                model: model_type,
                contents: result.contents
            }
        } else {
            text = 'Whoops! There was a "Control/Treatment" error. Please reach out to jamesbeeson01@gmail.com';
        }
        
        // Save AI response
        await saveMessage({
            id: uuidv4(),
            content: text,
            type: 'ai',
            sessionId: sessionId,
            model: model_type,
            templateName: templateName,
            parentMessageId: userMessageId,
            input: JSON.stringify(input)
        });
        
        res.json({ 
            response: text,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Initialize a new session
app.post('/session/init', async (req, res) => {
    try {
        let { userSection, existingSessionId } = req.body;
        const sessionId = uuidv4();
        
        // Determine treatment based on previous sessions with the same userSection
        let treatmentGroup = 1; // Default to 1 if no previous session or if previous treatment was 0
        
        if (existingSessionId) {
            // Get the existing session's treatment (week 12)
            const existingTreatment = await getTreatment(existingSessionId);
            treatmentGroup = (existingTreatment === 1) ? 0 : 1;
        }
        if (userSection) {
            const lastTreat = await lastTreatment(userSection);
            // Use strict equality and handle null case
            treatmentGroup = (lastTreat === 1) ? 0 : 1;
        }
        
        // Store the new session in the database
        await saveSession(sessionId, userSection, treatmentGroup);

        const templateName = (treatmentGroup === 1) ? 'Treatment' : 'Control';
        
        // Get template content from database
        const templateContent = await getTemplate(templateName);

        await saveMessage({
            id: uuidv4(),
            content: templateContent,
            type: 'ai',
            sessionId: sessionId,
            model: null,
            templateName: templateName,
            parentMessageId: null,
            input: null
        });
        
        console.log('Initialized new session:', sessionId);
        
        res.json({ 
            sessionId: sessionId,
            success: true
        });
    } catch (error) {
        console.error('Error initializing session:', error);
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

app.get('/chat/history/nprompts/:sessionId', async (req, res) => {
    try {
        const nprompts = await getNumPrompts(req.params.sessionId);
        res.json({ nprompts });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update model template
app.post('/chat/update-template', async (req, res) => {
    const { template } = req.body;
    console.log(template);
    res.status(200).json({ success: true }); // Send a response to the client
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
                    res.sendStatus(500);
                } else if (row) {
                    console.log(`Clicked message ID: ${row.id}`);
                    res.redirect(`/message.html?message=${row.id}`);
                } else {
                    res.sendStatus(404);
                }
            }
        );
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

// Get session length (in minutes)
app.get('/session/length/:sessionId', async (req, res) => {
    try {
        const sessionLength = await getSessionLength(req.params.sessionId);
        res.json({ sessionLength });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update session length (in minutes)
app.put('/session/length/:sessionId', async (req, res) => {
    try {
        const { sessionLength } = req.body;
        await updateSessionLength(req.params.sessionId, sessionLength);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get number of question marks in 'ai' messages for a session
app.get('/session/questions/:sessionId', async (req, res) => {
    try {
        const count = await countAIQuestionMarks(req.params.sessionId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
