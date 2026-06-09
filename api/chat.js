const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, systemInstructions } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'API key is missing in Vercel' });
    }

    const filePath = path.join(process.cwd(), 'api', 'knowledge.txt');
    let extraKnowledge = "";

    try {
        extraKnowledge = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("No extra knowledge file found");
    }

    // היתוך של כל המידע לבלוק טקסט אחד אגרסיבי וברור
    const combinedText = `הנחיות מערכת למענה:\n${systemInstructions}\n\nמידע עובדתי להסתמך עליו בלבד:\n${extraKnowledge}\n\nהודעת המשתמש הנוכחית שעליך לענות עליה:\n${text}`;

    // מעבר למודל האוניברסלי
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY.trim();

    // מבנה נתונים פשוט ורזה שאי אפשר לדחות
    const payload = {
        "contents": [
            { "role": "user", "parts": [{ "text": combinedText }] }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("=== ERROR FROM GOOGLE ===", JSON.stringify(data, null, 2));
            return res.status(500).json({ error: 'Google rejected the request' });
        }

        if (data.candidates && data.candidates.length > 0) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: 'Invalid response from Gemini' });
        }
    } catch (error) {
        console.error("=== SERVER CRASH ===", error);
        res.status(500).json({ error: 'Server error' });
    }
}
