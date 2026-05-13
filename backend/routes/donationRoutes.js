const express = require('express');
const router = express.Router();
const { getDonations } = require('../services/donationService');

// @route   GET /api/donations
// @desc    Get verified donation opportunities
router.get('/', async (req, res) => {
    try {
        const donations = await getDonations();
        res.json({
            success: true,
            count: donations.length,
            data: donations,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch verified donations',
            error: error.message
        });
    }
});

module.exports = router;
