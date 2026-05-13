const express = require('express');
const router = express.Router();
const { getComplaints, getComplaintById, createComplaint, updateComplaintStatus } = require('../controllers/complaintController');

router.route('/')
    .get(getComplaints)
    .post(createComplaint);

router.route('/:id')
    .get(getComplaintById);

router.route('/:id/status')
    .patch(updateComplaintStatus);

module.exports = router;
