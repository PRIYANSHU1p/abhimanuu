const express = require('express');
const { signup, login, getMe, forgotPassword, resetPassword, updateDetails, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.get('/signup', (req, res) => res.status(405).json({ status: 'error', message: 'Please use POST method to sign up.' }));
router.post('/login', login);
router.get('/login', (req, res) => res.status(405).json({ status: 'error', message: 'Please use POST method to login.' }));
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
