const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const SchemeSchema = new mongoose.Schema({
    title: String,
    type: String
});

const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);

async function check() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        const counts = await Scheme.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
        console.log('COUNTS:', JSON.stringify(counts));
        
        const states = await Scheme.find({ type: 'State' }).limit(5);
        console.log('STATE_SAMPLES:', JSON.stringify(states));
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('ERROR:', err);
    }
}

check();
