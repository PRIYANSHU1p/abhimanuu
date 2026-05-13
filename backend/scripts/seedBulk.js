require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

const MONGO_URI = process.env.MONGO_URI;

const categories = [
    { name: "Road Infrastructure", dept: "Public Works Department", images: ["1584839066657-3932012c7542", "1596464716127-f2a829d4df30", "1515162816999-a0c47dc132f7"] },
    { name: "Water Supply", dept: "Delhi Jal Board", images: ["1541123437800-1bb1317badc2", "1519692933481-216240d3d440", "1581092160204-d2e7ff4e1cd3"] },
    { name: "Electricity", dept: "BSES Yamuna", images: ["1473341304170-971dccb5ac1e", "1620336655022-da643533842c", "1544724569-5f546fd6f2b5"] },
    { name: "Waste Management", dept: "MCD", images: ["1532996122724-e3c354a0b15b", "1605600659908-0ef71941865c", "1567027757540-36270b28e67a"] },
    { name: "Animal Welfare", dept: "Animal Rescue Dept", images: ["1548199973-03cce0bbc87b", "1551717743-49959800b1f6", "1543852786-1cf6624b9987"] },
    { name: "Public Safety", dept: "Police Dept", images: ["1517486808443-48a3fb33132f", "1485739139909-d74242d7fe9d", "1513297856429-10511b19736a"] },
    { name: "Horticulture", dept: "Forest Department", images: ["1501333190706-446912360dc0", "1513836279014-a89f7a76ae86", "1466692479461-d13eb7397a0a"] },
    { name: "Traffic Management", dept: "Traffic Police", images: ["1449824913935-59a9fe3920ee", "1506751354179-013929486345", "1519003309472-7c32d33e597e"] }
];

const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

const getRandomInRange = (min, max) => Math.random() * (max - min) + min;

const generateComplaints = (count) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        const categoryObj = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const imageId = categoryObj.images[Math.floor(Math.random() * categoryObj.images.length)];
        
        // Delhi NCR Bounding Box
        const lat = getRandomInRange(28.40, 28.80);
        const lng = getRandomInRange(77.00, 77.40);

        data.push({
            title: `${categoryObj.name} issue at Sector ${Math.floor(Math.random() * 100)}`,
            description: `Auto-generated report for ${categoryObj.name.toLowerCase()}. Citizen reported persistent issues that require immediate intervention by the ${categoryObj.dept}. Local residents are facing significant challenges due to this situation.`,
            address: `House No ${Math.floor(Math.random() * 500)}, Sector ${Math.floor(Math.random() * 100)}, New Delhi - 110001`,
            category: categoryObj.name,
            department: categoryObj.dept,
            priority: priority,
            status: status,
            location: { lat, lng },
            images: [`https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=800&q=80`],
            aiSummary: `Comprehensive AI analysis of ${categoryObj.name}. Visual confirmation matches the reported urgency. System recommends immediate dispatch of ${categoryObj.dept} technical team.`,
            aiRemarks: `Automated routing successful. Tracking ID: CC-${Math.floor(Math.random() * 1000000)}. Priority set to ${priority} based on density and safety impact.`,
            aiSource: 'gemini',
            visualCategory: categoryObj.name,
            visualRiskLevel: priority,
            imageConfidence: 0.92,
            safetyPrecautions: "Please maintain distance from the affected area. Avoid using this route during peak hours if possible."
        });
    }
    return data;
};

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        await Complaint.deleteMany({});
        console.log("🧹 Cleared existing complaints.");

        const count = 180;
        const complaints = generateComplaints(count);
        
        await Complaint.insertMany(complaints);
        console.log(`🚀 Successfully seeded ${complaints.length} high-fidelity items!`);

        mongoose.connection.close();
        console.log("🔌 Connection closed.");
    } catch (error) {
        console.error("❌ Seeding Error:", error);
    }
};

seedDB();
