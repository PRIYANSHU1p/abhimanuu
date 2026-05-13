const Complaint = require('../models/Complaint');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Vercel only allows writing to /tmp
        const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
        const dir = isVercel ? '/tmp' : 'uploads/complaints';
        
        if (!isVercel && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
        }
    }
}).array('images', 5);

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Public
const getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Public
const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { classifyComplaint } = require('../utils/classifier');
const { generateCivicIntelligence } = require('../services/geminiService');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Public
const createComplaint = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log("❌ [BACKEND DEBUG] Upload Error:", err.message);
            return res.status(400).json({ message: err.message });
        }

        try {
            const { title, description, address, language, category } = req.body;
            const files = req.files || [];
            
            console.log(`📩 [BACKEND DEBUG] Received new complaint: "${title}"`);
            console.log(`📸 [BACKEND DEBUG] Physical files received: ${files.length}`);
            console.log(`🌐 [BACKEND DEBUG] Language hint: ${language || 'not provided'}`);
            
            const imagePaths = files.map(file => `/uploads/complaints/${file.filename}`);
            
            // Refined text analysis: Avoid sending just whitespace to Gemini
            const textToAnalyze = `${title || ''} ${description || ''}`.trim();
            
            console.log(`📩 [BACKEND DEBUG] Analyzing Complaint: "${textToAnalyze || "IMAGE-ONLY"}"`);
            console.log(`📸 [BACKEND DEBUG] Total Images: ${files.length}`);
            
            // 1. Prepare image for Gemini Vision (Temporary Base64)
            let imageBase64ForAI = null;
            if (files.length > 0) {
                try {
                    const firstFile = files[0];
                    console.log(`📸 [BACKEND DEBUG] Processing image for AI: ${firstFile.filename} (${firstFile.mimetype})`);
                    const buffer = fs.readFileSync(firstFile.path);
                    imageBase64ForAI = `data:${firstFile.mimetype};base64,${buffer.toString('base64')}`;
                    console.log("✅ [BACKEND DEBUG] Image converted to base64 for Gemini request.");
                } catch (readErr) {
                    console.error("⚠️ [BACKEND DEBUG] Failed to read file for AI analysis:", readErr.message);
                }
            } else {
                console.log("ℹ️ [BACKEND DEBUG] No image attached. Proceeding with text-only analysis.");
            }

            // 2. AI Intelligence Engine
            console.log("🛠️ [BACKEND DEBUG] Triggering Multimodal Gemini Engine...");
            let aiRoutingResult = await generateCivicIntelligence(textToAnalyze, imageBase64ForAI, language);
            let aiSource = 'gemini';

            // 3. Fallback to Local Classifier if Gemini fails
            if (!aiRoutingResult) {
                console.log("⚠️ [BACKEND DEBUG] Gemini failed. Falling back to local classifier...");
                aiRoutingResult = classifyComplaint(textToAnalyze);
                aiSource = 'fallback-classifier';
            }
            
            // 4. Normalize Category for Animal Welfare
            let finalCategory = category || aiRoutingResult?.category || 'General Inquiry';
            const animalKeywords = ['animal', 'pashu', 'rescue', 'injured', 'veterinary', 'dog', 'cat', 'cow', 'cattle', 'kalyan'];
            const isAnimalRelated = animalKeywords.some(kw => 
                finalCategory.toLowerCase().includes(kw) || 
                (aiRoutingResult?.aiSummary || '').toLowerCase().includes(kw) ||
                (aiRoutingResult?.department || '').toLowerCase().includes(kw)
            );

            if (isAnimalRelated) {
                finalCategory = "Animal Welfare";
            }

            let location = null;
            if (req.body.location) {
                try {
                    location = JSON.parse(req.body.location);
                } catch (e) {
                    console.error("Error parsing location:", e);
                }
            }
            
            const newComplaint = new Complaint({
                title,
                description,
                address,
                images: imagePaths, 
                category: finalCategory,
                department: aiRoutingResult?.department || 'Municipal Corporation',
                priority: aiRoutingResult?.priority || 'Medium',
                estimatedResolution: aiRoutingResult?.estimatedResolution || '3-5 working days',
                aiSource,
                aiSummary: aiRoutingResult?.aiSummary || '',
                aiRemarks: aiRoutingResult?.aiRemarks || '',
                detectedLanguage: aiRoutingResult?.detectedLanguage || 'English',
                visualCategory: aiRoutingResult?.visualCategory || '',
                visualRiskLevel: aiRoutingResult?.visualRiskLevel || '',
                detectedObjects: aiRoutingResult?.detectedObjects || [],
                imageSummary: aiRoutingResult?.imageSummary || '',
                imageConfidence: aiRoutingResult?.imageConfidence || 0,
                safetyPrecautions: aiRoutingResult?.safetyPrecautions || '',
                location: location
            });

            const savedComplaint = await newComplaint.save();
            console.log("✅ [BACKEND DEBUG] MongoDB document saved successfully.");
            res.status(201).json(savedComplaint);
        } catch (error) {
            console.log("❌ [BACKEND DEBUG] Error creating complaint:", error.message);
            res.status(500).json({ message: error.message });
        }
    });
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Public
const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        // Validation: Must allow ONLY these statuses
        const ALLOWED_STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({ 
                message: 'Invalid status update', 
                allowedStatuses: ALLOWED_STATUSES 
            });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        
        res.status(200).json(complaint);
    } catch (error) {
        // Distinguish between invalid ObjectId cast vs generic db failure
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Complaint not found (Invalid ID)' });
        }
        res.status(500).json({ message: 'Database failure while updating status', error: error.message });
    }
};

module.exports = {
    getComplaints,
    getComplaintById,
    createComplaint,
    updateComplaintStatus
};
