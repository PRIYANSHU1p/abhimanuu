const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  purpose: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String, required: true },
  category: { type: String, default: 'General' },
  type: { type: String, default: 'National' },
  isVerified: { type: Boolean, default: true },
  status: { type: String, default: 'Active' },
  taxExempt: { type: String, default: 'Section 80G' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', DonationSchema);
