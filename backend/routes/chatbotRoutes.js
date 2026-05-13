const express = require('express');
const router = express.Router();
const { ragChatbot } = require('../services/ragChatbotService');

/**
 * POST /api/chatbot/message
 * Body: { message: string, history: [{role, content}] }
 * Returns: { answer, sources, isRelevant, suggestedActions }
 */
router.post('/message', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message is required' 
            });
        }
        
        if (message.length > 500) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message too long. Max 500 characters.' 
            });
        }
        
        console.log(`💬 [CHATBOT API] Received: "${message.substring(0, 80)}..."`);
        
        const result = await ragChatbot(message.trim(), history);
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ [CHATBOT API] Error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Chatbot service error. Please try again.',
            answer: 'Sorry, mujhe abhi kuch problem aa rahi hai. Thodi der baad try karein. / Sorry, experiencing an issue. Please try again shortly.'
        });
    }
});

module.exports = router;
