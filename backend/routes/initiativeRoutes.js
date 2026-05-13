const express = require('express');
const router = express.Router();
const { getInitiatives, createInitiative, joinInitiative } = require('../controllers/initiativeController');

router.get('/', getInitiatives);
router.post('/', createInitiative);
router.patch('/:id/join', joinInitiative);

module.exports = router;
