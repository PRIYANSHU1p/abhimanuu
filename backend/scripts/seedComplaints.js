require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
}

const complaints = [
    {
        title: "Large Pothole near Central Market",
        description: "A huge pothole has formed in the middle of the road, causing traffic jams and potential accidents.",
        address: "Block B, Lajpat Nagar II, New Delhi",
        category: "Road Infrastructure",
        department: "Public Works Department",
        priority: "High",
        status: "In Progress",
        location: { lat: 28.5677, lng: 77.2433 },
        aiSummary: "Hazardous road condition detected. High risk of vehicle damage.",
        aiRemarks: "Priority dispatched for asphalt filling."
    },
    {
        title: "Water Leakage from Main Pipe",
        description: "Fresh water is wasting away from a broken pipe since morning. The street is flooded.",
        address: "Sector 12, RK Puram, New Delhi",
        category: "Water Supply",
        department: "Delhi Jal Board",
        priority: "Critical",
        status: "Submitted",
        location: { lat: 28.5614, lng: 77.1705 },
        aiSummary: "Major pipeline burst. Significant water wastage and localized flooding.",
        aiRemarks: "Technical team scheduled for immediate inspection."
    },
    {
        title: "Street Light Failure",
        description: "Entire row of street lights is not working for three days. Dangerous for pedestrians at night.",
        address: "Main Road, Greater Kailash I, New Delhi",
        category: "Electricity",
        department: "BSES Yamuna",
        priority: "Medium",
        status: "Under Review",
        location: { lat: 28.5521, lng: 77.2355 },
        aiSummary: "Public safety risk due to insufficient lighting.",
        aiRemarks: "Electronic fault suspected in transformer unit."
    },
    {
        title: "Injured Stray Dog",
        description: "A stray dog has an injured leg near the metro station and needs urgent rescue.",
        address: "Hauz Khas Metro Station, New Delhi",
        category: "Animal Welfare",
        department: "Animal Rescue Dept",
        priority: "Urgent",
        status: "In Progress",
        location: { lat: 28.5430, lng: 77.2065 },
        aiSummary: "Animal in distress. Injury requires immediate veterinary attention.",
        aiRemarks: "Rescue ambulance dispatched."
    },
    {
        title: "Garbage Pileup in Public Park",
        description: "Municipal waste has not been collected for over a week. Foul smell is spreading.",
        address: "Deer Park, Safdarjung Enclave, New Delhi",
        category: "Waste Management",
        department: "MCD",
        priority: "Low",
        status: "Resolved",
        location: { lat: 28.5570, lng: 77.1950 },
        aiSummary: "Sanitation issue. Overflowing garbage bin in public recreational area.",
        aiRemarks: "Cleanup completed on 13th May."
    },
    {
        title: "Unauthorized Construction",
        description: "A commercial building is being built without permission on residential land.",
        address: "DLF Phase III, Gurugram",
        category: "Urban Planning",
        department: "Town & Country Planning",
        priority: "Medium",
        status: "Under Review",
        location: { lat: 28.4900, lng: 77.0900 },
        aiSummary: "Legal compliance issue. Violation of zoning regulations.",
        aiRemarks: "Verification of permits initiated."
    },
    {
        title: "Broken Drainage Cover",
        description: "The manhole cover is missing. Very dangerous for children.",
        address: "M-Block Market, GK-II, New Delhi",
        category: "Sanitation",
        department: "Delhi Jal Board",
        priority: "Critical",
        status: "In Progress",
        location: { lat: 28.5320, lng: 77.2480 },
        aiSummary: "Hazardous opening on pedestrian path. High fall risk.",
        aiRemarks: "Temporary barrier installed. Replacement arriving today."
    },
    {
        title: "Abandoned Vehicle on Highway",
        description: "A burnt car is blocking one lane of the highway for 2 days.",
        address: "NH-48, Near Aerocity, New Delhi",
        category: "Traffic Management",
        department: "Delhi Traffic Police",
        priority: "High",
        status: "Submitted",
        location: { lat: 28.5480, lng: 77.1200 },
        aiSummary: "Obstruction to traffic flow on high-speed corridor.",
        aiRemarks: "Towing service coordinated for night shift."
    },
    {
        title: "Illegal Encroachment on Footpath",
        description: "Street vendors have blocked the entire footpath, forcing people to walk on the main road.",
        address: "Chandni Chowk Main Road, Delhi",
        category: "Traffic Management",
        department: "MCD",
        priority: "Medium",
        status: "Under Review",
        location: { lat: 28.6505, lng: 77.2303 },
        aiSummary: "Pedestrian access blocked. Increased accident risk for walkers.",
        aiRemarks: "Enforcement drive planned for weekend."
    },
    {
        title: "Fallen Tree after Storm",
        description: "A massive neem tree has fallen across the internal colony road.",
        address: "Gulmohar Park, New Delhi",
        category: "Horticulture",
        department: "Forest Department",
        priority: "Medium",
        status: "Resolved",
        location: { lat: 28.5540, lng: 77.2130 },
        aiSummary: "Bio-hazard obstruction. Secondary damage to power lines avoided.",
        aiRemarks: "Tree cleared and wood transported to depot."
    },
    {
        title: "Low Water Pressure",
        description: "We are getting very little water in the taps for the last 4 days.",
        address: "Janakpuri Block C, New Delhi",
        category: "Water Supply",
        department: "Delhi Jal Board",
        priority: "Normal",
        status: "Under Review",
        location: { lat: 28.6100, lng: 77.0800 },
        aiSummary: "Utility service degradation reported by multiple households.",
        aiRemarks: "Pump station inspection scheduled."
    },
    {
        title: "Stray Cow in High Traffic Area",
        description: "A cow is standing in the middle of a very busy intersection causing chaos.",
        address: "Connaught Place, New Delhi",
        category: "Animal Welfare",
        department: "Animal Husbandry Unit",
        priority: "High",
        status: "In Progress",
        location: { lat: 28.6304, lng: 77.2177 },
        aiSummary: "Live animal hazard. Risk of multi-vehicle pileup.",
        aiRemarks: "Cattle catching squad on route."
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing complaints to avoid clutter (Optional, but good for "Live" demo)
        await Complaint.deleteMany({});
        console.log("🧹 Cleared existing complaints.");

        await Complaint.insertMany(complaints);
        console.log(`🚀 Successfully seeded ${complaints.length} complaints!`);

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Seeding Error:", error);
    }
};

seedDB();
