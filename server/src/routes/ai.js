const express = require('express');
const router = express.Router();

router.post('/chat', async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
    }

    try {
        const { message, activeFileContext, history } = req.body;
        if (typeof message !== 'string' || !message.trim() || message.length > 16000 || (history !== undefined && (!Array.isArray(history) || history.length > 30 || history.some(m=>!m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 16000))) || (activeFileContext && (typeof activeFileContext.path !== 'string' || typeof activeFileContext.content !== 'string' || activeFileContext.content.length > 100000))) return res.status(400).json({error:'Invalid or oversized AI input'});

        let systemInstruction = "You are an expert AI programming assistant built directly into a Cloud IDE.\n" +
            "You help the user understand code, write new code, and debug errors.\n" +
            "Always provide clear, concise, and accurate answers. Format code blocks using markdown.";

        if (activeFileContext) {
            systemInstruction += `\n\nContext: The user currently has the following file open in their editor:\n` +
                `File Path: ${activeFileContext.path}\n` +
                `\`\`\`\n${activeFileContext.content}\n\`\`\``;
        }

        // Convert frontend history format to Gemini format
        const contents = [];
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            }
        }

        // Add the current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: {'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({contents,systemInstruction:{parts:[{text:systemInstruction}]},generationConfig:{temperature:0.7,maxOutputTokens:4096}})
        });
        if (!response.ok) throw new Error('Provider rejected request');
        const data=await response.json();
        const reply=data.candidates?.[0]?.content?.parts?.map(part=>part.text || '').join('');
        if (!reply) return res.status(502).json({error:'The AI provider did not return a response'});
        res.json({ reply });

    } catch (error) {
        console.error(JSON.stringify({event:'ai_failure',requestId:req.id}));
        res.status(502).json({ error: 'Failed to generate response from Gemini API.' });
    }
});

module.exports = router;
