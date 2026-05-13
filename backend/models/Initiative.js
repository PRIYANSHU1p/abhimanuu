const mongoose = require('mongoose');

const initiativeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Cleanliness', 'Greenery', 'Education', 'Social Welfare', 'Safety', 'Infrastructure'],
        default: 'Social Welfare'
    },
    location: {
        lat: Number,
        lng: Number,
        address: String
    },
    organizer: {
        type: String,
        default: 'CitizenConnect Community'
    },
    status: {
        type: String,
        enum: ['Proposed', 'Active', 'Completed'],
        default: 'Proposed'
    },
    volunteersRequired: {
        type: Number,
        default: 0
    },
    volunteersJoined: {
        type: Number,
        default: 0
    },
    images: [String],
    startDate: Date,
    endDate: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Initiative', initiativeSchema);
