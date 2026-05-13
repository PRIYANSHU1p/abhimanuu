const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    type: {
        type: String,
        default: 'General'
    },
    category: {
        type: String,
        default: 'General Inquiry'
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    location: {
        lat: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 }
    },
    department: {
        type: String,
        default: 'Municipality General Desk'
    },
    priority: {
        type: String,
        enum: ['Low', 'Normal', 'Medium', 'High', 'Urgent', 'Danger', 'Important', 'Critical'],
        default: 'Medium'
    },
    estimatedResolution: {
        type: String,
        default: '3 - 5 Working Days'
    },
    status: {
        type: String,
        enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved'],
        default: 'Submitted'
    },
    images: {
        type: [String],
        default: []
    },
    aiSummary: {
        type: String,
        default: ''
    },
    aiRemarks: {
        type: String,
        default: ''
    },
    aiSource: {
        type: String,
        enum: ['gemini', 'fallback-classifier'],
        default: 'fallback-classifier'
    },
    visualCategory: {
        type: String,
        default: ''
    },
    visualRiskLevel: {
        type: String,
        default: ''
    },
    detectedObjects: {
        type: [String],
        default: []
    },
    imageSummary: {
        type: String,
        default: ''
    },
    imageConfidence: {
        type: Number,
        default: 0
    },
    detectedLanguage: {
        type: String,
        default: ''
    },
    safetyPrecautions: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
