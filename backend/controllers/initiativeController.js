const Initiative = require('../models/Initiative');

// @desc    Get all initiatives
// @route   GET /api/initiatives
// @access  Public
const getInitiatives = async (req, res) => {
    try {
        const initiatives = await Initiative.find().sort({ createdAt: -1 });
        res.status(200).json(initiatives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create an initiative
// @route   POST /api/initiatives
// @access  Public
const createInitiative = async (req, res) => {
    try {
        const newInitiative = new Initiative(req.body);
        const saved = await newInitiative.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Join an initiative
// @route   PATCH /api/initiatives/:id/join
// @access  Public
const joinInitiative = async (req, res) => {
    try {
        const initiative = await Initiative.findById(req.params.id);
        if (!initiative) return res.status(404).json({ message: 'Initiative not found' });
        
        initiative.volunteersJoined += 1;
        await initiative.save();
        res.status(200).json(initiative);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInitiatives,
    createInitiative,
    joinInitiative
};
