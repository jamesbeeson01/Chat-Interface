const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite').open;
const path = require('path');

// Create/connect to SQLite database
const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Session table
    db.run(`
        CREATE TABLE IF NOT EXISTS session (
            sessionId TEXT PRIMARY KEY,
            sessionLength INTEGER
        )
    `);
    // Messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            content TEXT,
            type TEXT CHECK(type IN ('user', 'ai')),
            timestamp INTEGER,
            sessionId TEXT,
            model TEXT,
            templateName TEXT,
            parentMessageId TEXT,
            input TEXT,
            FOREIGN KEY (parentMessageId) REFERENCES messages(id),
            FOREIGN KEY (templateName) REFERENCES template(name),
            FOREIGN KEY (sessionId) REFERENCES session(sessionId)
        )
    `);
    // Templates table
    db.run(`
        CREATE TABLE IF NOT EXISTS template (
            name TEXT PRIMARY KEY,
            basePrompt TEXT
        )
    `);

    // Insert default template
    db.run(`
        INSERT OR IGNORE INTO template (name, basePrompt)
        VALUES ('Basic', NULL)
    `);
});

// Helper functions for database operations
function saveMessage(message) {
    return new Promise((resolve, reject) => {
        const { id, content, type, sessionId, model, templateName, parentMessageId, input } = message;
        const timestamp = Date.now();
        
        db.run(
            `INSERT INTO messages (id, content, type, timestamp, sessionId, model, templateName, parentMessageId, input)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, content, type, timestamp, sessionId, model, templateName, parentMessageId, input],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function getSessionMessages(sessionId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM messages WHERE sessionId = ? ORDER BY timestamp ASC',
            [sessionId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

function getNumPrompts(sessionId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT COUNT(*) AS count FROM messages WHERE sessionId = ? AND type = ?',
            [sessionId, 'user'],
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.count : 0);
            }
        );
    });
}

function saveSession(sessionId) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT OR IGNORE INTO session (sessionId, sessionLength) VALUES (?, 0)`,
            [sessionId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function updateSessionLength(sessionId, sessionLength) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE session SET sessionLength = ? WHERE sessionId = ?`,
            [sessionLength, sessionId],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

function getSessionLength(sessionId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT sessionLength FROM session WHERE sessionId = ?',
            [sessionId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.sessionLength : null);
            }
        );
    });
}

module.exports = {
    saveMessage,
    getSessionMessages,
    getNumPrompts,
    saveSession,
    updateSessionLength,
    getSessionLength,
    db
};
