const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const complaintRoutes = require('./routes/complaintRoutes');
const authRoutes = require('./routes/authRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const donationRoutes = require('./routes/donationRoutes');
const initiativeRoutes = require('./routes/initiativeRoutes');


// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads/complaints');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/initiatives', initiativeRoutes);


// Seed Initiatives Route
app.get('/api/seed-initiatives', async (req, res) => {
    try {
        const Initiative = require('./models/Initiative');
        const count = await Initiative.countDocuments();
        if (count > 0) return res.send('Initiatives already seeded');

        const samples = [
            {
                title: "Sector 15 Cleanliness Drive",
                description: "Join us for a weekend drive to clean up the local parks and residential areas. Gloves and bags will be provided.",
                category: "Cleanliness",
                volunteersRequired: 50,
                volunteersJoined: 12,
                images: ["https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2670&auto=format&fit=crop"],
                location: { lat: 28.4595, lng: 77.0266 }
            },
            {
                title: "Community Tree Plantation",
                description: "Let's make our city greener! We are planting 500 saplings across the north zone. Bring your own shovel!",
                category: "Greenery",
                volunteersRequired: 100,
                volunteersJoined: 45,
                images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2626&auto=format&fit=crop"],
                location: { lat: 28.6139, lng: 77.2090 }
            },
            {
                title: "Safety Awareness Workshop",
                description: "A workshop on emergency response and basic first aid for school children and parents.",
                category: "Safety",
                volunteersRequired: 20,
                volunteersJoined: 8,
                images: ["https://images.unsplash.com/photo-1582213726868-39c9efeb2475?q=80&w=2670&auto=format&fit=crop"],
                location: { lat: 28.5355, lng: 77.3910 }
            }
        ];

        await Initiative.insertMany(samples);
        res.status(201).json({ message: 'Initiatives seeded successfully', data: samples });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Test Route
app.get('/', (req, res) => {
    res.send('CitizenConnect Backend Running');
});

// Debug Route for Gemini
app.get('/api/debug-gemini', async (req, res) => {
    const { generateCivicIntelligence } = require('./services/geminiService');
    const testComplaint = "road pe bahut bada gadda hai aur baarish ka pani bhara hua hai";
    console.log(`[DEBUG ENDPOINT] Testing Multimodal Gemini with: "${testComplaint}"`);
    
    try {
        const result = await generateCivicIntelligence(testComplaint);
        if (result) {
            res.json({
                success: true,
                message: "Gemini Multimodal API Successfully Connected and Parsed",
                testInput: testComplaint,
                detectedLanguage: result.detectedLanguage,
                parsedResult: result
            });
        } else {
            res.json({
                success: false,
                message: "Gemini API Failed or Returned Null",
                testInput: testComplaint,
                parsedResult: null
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in Debug Endpoint",
            error: error.message
        });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Export for Vercel
module.exports = app;

// Start Server (only if not imported)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}
