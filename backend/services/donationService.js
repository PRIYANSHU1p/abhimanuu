const Donation = require('../models/Donation');

const VERIFIED_DONATIONS = [
  {
    name: "PM CARES Fund",
    purpose: "National Relief",
    description: "A dedicated national fund with the primary objective of dealing with any kind of emergency or distress situation like the COVID-19 pandemic.",
    link: "https://www.pmcares.gov.in/",
    category: "National",
    isVerified: true
  },
  {
    name: "National Relief Fund",
    purpose: "Disaster Relief",
    description: "Prime Minister's National Relief Fund (PMNRF) provides immediate relief to families of those killed in natural calamities like floods, cyclones, and earthquakes.",
    link: "https://pmnrf.gov.in/",
    category: "National",
    isVerified: true
  },
  {
    name: "Animal Welfare Board",
    purpose: "Animal Welfare",
    description: "A statutory advisory body on Animal Welfare Laws and promotes animal welfare in the country.",
    link: "https://www.awbi.gov.in/",
    category: "Social",
    isVerified: true
  }
];

/**
 * Synchronizes and fetches donation organizations from the Database.
 */
exports.getDonations = async () => {
    try {
        console.log('🌐 [DB-SYNC] Fetching donations from Database...');
        
        // 1. Ensure verified donations exist in DB
        for (const d of VERIFIED_DONATIONS) {
            await Donation.findOneAndUpdate(
                { name: d.name },
                { ...d, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        // 2. Fetch all from DB
        return await Donation.find().sort({ isVerified: -1, name: 1 });
    } catch (error) {
        console.error('❌ [DB-SYNC] Donation fetch failed:', error.message);
        try {
            return await Donation.find();
        } catch (e) {
            return VERIFIED_DONATIONS;
        }
    }
};
