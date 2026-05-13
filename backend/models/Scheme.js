const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  link: { type: String, required: true },
  registrationLink: { type: String },
  category: { type: String, required: true },
  ministry: { type: String },
  type: { type: String, enum: ['Central', 'State'], default: 'Central' },
  benefits: { type: String },
  eligibility: { type: String },
  howToApply: { type: String },
  source: { type: String, default: 'Official' },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', SchemeSchema);
