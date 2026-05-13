const express = require('express');
const router = express.Router();
const { scrapeSchemes } = require('../services/schemeService');

// @desc    Get real-time government schemes via scraping
// @route   GET /api/schemes
// @access  Public
router.get('/', async (req, res) => {
    try {
        const schemes = await scrapeSchemes();
        res.json({
            success: true,
            count: schemes.length,
            data: schemes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schemes',
            error: error.message
        });
    }
});

module.exports = router;
