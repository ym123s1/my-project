import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { text, systemInstructions } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY; 
    
    if (!API_KEY) {
        return res.status(500).json({ error: 'API key is missing' });
    }

    const filePath = path.join(process.cwd(), 'api', 'knowledge.txt');
    let extraKnowledge = "";

    try {
        extraKnowledge = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error("No extra knowledge file found");
    }

    const finalInstructions = systemInstructions + "\nמידע נוסף:\n" + extraKnowledge;
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "system_instruction": { "parts": { "text": finalInstructions } },
                "contents": [{ "parts": [{ "text": text }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ error: 'Invalid response from Gemini' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
