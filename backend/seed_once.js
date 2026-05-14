const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

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

const Scheme = mongoose.model('Scheme', SchemeSchema);

const VERIFIED_SCHEMES = [
  // ===== CENTRAL SCHEMES =====
  {
    title: "PM-Kisan Samman Nidhi",
    link: "https://pmkisan.gov.in/",
    registrationLink: "https://pmkisan.gov.in/RegistrationForm.aspx",
    description: "Financial benefit of ₹6000/year in three equal installments directly to farmer bank accounts, supporting small and marginal farmers across India.",
    category: "Agriculture",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    type: "Central",
    benefits: "₹6000 per year in 3 installments of ₹2000 each directly to bank account.",
    eligibility: "All landholding farmer families with cultivable land.",
    howToApply: "Register at pmkisan.gov.in or visit nearest CSC (Common Service Centre).",
    isVerified: true, source: "Official"
  },
  {
    title: "Ayushman Bharat (PM-JAY)",
    link: "https://pmjay.gov.in/",
    registrationLink: "https://setu.pmjay.gov.in/setu/",
    description: "World's largest health insurance scheme providing ₹5 lakh health cover per family per year for secondary and tertiary hospitalization to 12 crore+ poor families.",
    category: "Health",
    ministry: "Ministry of Health and Family Welfare",
    type: "Central",
    benefits: "₹5 Lakh health insurance per family per year. Covers 1500+ medical procedures.",
    eligibility: "Families identified in SECC 2011 data; low income households.",
    howToApply: "Visit empaneled hospital or check eligibility at pmjay.gov.in.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Ujjwala Yojana 2.0",
    link: "https://www.pmuy.gov.in/",
    registrationLink: "https://www.pmuy.gov.in/ujjwala2.html",
    description: "Free LPG connections to BPL women to protect health and eliminate indoor air pollution from wood/chulha burning in rural households.",
    category: "Welfare",
    ministry: "Ministry of Petroleum and Natural Gas",
    type: "Central",
    benefits: "Free LPG connection + first refill + hotplate for BPL women.",
    eligibility: "Women from BPL families, 18+ years, no existing LPG connection.",
    howToApply: "Apply at nearest LPG distributor (HP Gas, Bharat Gas, Indane) or pmuy.gov.in.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Awas Yojana - Urban",
    link: "https://pmaymis.nic.in/",
    registrationLink: "https://pmaymis.nic.in/",
    description: "Housing for All scheme providing financial assistance to EWS/LIG/MIG categories to build, enhance or buy their own homes in urban areas by 2024.",
    category: "Housing",
    ministry: "Ministry of Housing and Urban Affairs",
    type: "Central",
    benefits: "Subsidy of ₹1.5 lakh to ₹2.67 lakh on home loans depending on income category.",
    eligibility: "EWS (income < ₹3L), LIG (income ₹3L-6L), MIG-I (₹6L-12L), MIG-II (₹12L-18L).",
    howToApply: "Apply through bank/HFC or CSC. Check eligibility at pmaymis.nic.in.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Awas Yojana - Gramin",
    link: "https://rhreporting.nic.in/",
    registrationLink: "https://rhreporting.nic.in/",
    description: "Aims to provide pucca houses with basic amenities to all homeless and those living in kutcha/dilapidated houses in rural areas by 2024.",
    category: "Housing",
    ministry: "Ministry of Rural Development",
    type: "Central",
    benefits: "₹1.2 lakh (plains) / ₹1.3 lakh (hilly/NE) financial assistance for house construction.",
    eligibility: "Houseless and kutcha house dwellers in rural areas identified via SECC.",
    howToApply: "Register through Gram Panchayat or block development office.",
    isVerified: true, source: "Official"
  },
  {
    title: "PM SVANidhi - Street Vendor Loan",
    link: "https://pmsvanidhi.mohua.gov.in/",
    registrationLink: "https://pmsvanidhi.mohua.gov.in/",
    description: "Micro-credit scheme for street vendors to resume livelihoods affected by COVID-19, enabling them to avail affordable working capital loans.",
    category: "Employment",
    ministry: "Ministry of Housing and Urban Affairs",
    type: "Central",
    benefits: "Loans: ₹10,000 → ₹20,000 → ₹50,000 on timely repayment. 7% interest subsidy.",
    eligibility: "Urban street vendors (rehri/patri) with vending certificate or LoR from ULB.",
    howToApply: "Apply at pmsvanidhi.mohua.gov.in or visit nearby bank/MFI.",
    isVerified: true, source: "Official"
  },
  {
    title: "Sukanya Samriddhi Yojana",
    link: "https://www.indiapost.gov.in/Financial/pages/content/ssy.aspx",
    registrationLink: "https://www.indiapost.gov.in/Financial/pages/content/ssy.aspx",
    description: "Small deposit savings scheme for girl child under 'Beti Bachao Beti Padhao' campaign offering one of the highest interest rates for long-term savings.",
    category: "Social",
    ministry: "Ministry of Finance",
    type: "Central",
    benefits: "8.2% interest rate (tax-free). Matures on girl's 21st birthday. Tax deduction under 80C.",
    eligibility: "Girl child below 10 years. Max 2 accounts per family (one per girl).",
    howToApply: "Open account at Post Office or authorized bank branches.",
    isVerified: true, source: "Official"
  },
  {
    title: "Atal Pension Yojana",
    link: "https://npscra.nsdl.co.in/scheme-details.php",
    registrationLink: "https://npscra.nsdl.co.in/",
    description: "Pension scheme for workers in unorganized sector guaranteeing monthly pension of ₹1000-5000 after age 60, encouraging retirement savings.",
    category: "Social",
    ministry: "Ministry of Finance / PFRDA",
    type: "Central",
    benefits: "Guaranteed pension ₹1000-₹5000/month after age 60. Government co-contributes 50%.",
    eligibility: "Indian citizens aged 18-40 years with savings bank account.",
    howToApply: "Apply through any bank or post office. Fill APY form with bank account details.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Mudra Yojana",
    link: "https://www.mudra.org.in/",
    registrationLink: "https://www.mudra.org.in/",
    description: "Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises for income-generating activities without any collateral.",
    category: "Employment",
    ministry: "Ministry of Finance",
    type: "Central",
    benefits: "Shishu: up to ₹50K | Kishore: ₹50K-5L | Tarun: ₹5L-10L. No collateral required.",
    eligibility: "Small business owners, traders, artisans, shopkeepers, micro manufacturers.",
    howToApply: "Apply at any bank, MFI or NBFC. No application fee. Online at mudra.org.in.",
    isVerified: true, source: "Official"
  },
  {
    title: "National Social Assistance Programme (NSAP)",
    link: "https://nsap.nic.in/",
    registrationLink: "https://nsap.nic.in/",
    description: "Social protection to BPL households in old age, death of breadwinner, and maternity through multiple pension and assistance sub-schemes.",
    category: "Social",
    ministry: "Ministry of Rural Development",
    type: "Central",
    benefits: "Old age pension ₹200-500/month | Widow pension ₹300/month | Disability pension ₹300/month.",
    eligibility: "BPL elderly (60+), widows, disabled persons; those without regular income.",
    howToApply: "Apply through Gram Panchayat or Block Development Office. No application fee.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
    link: "https://jansuraksha.gov.in/Files/PMJJBY/English/FAQs.pdf",
    registrationLink: "https://jansuraksha.gov.in/",
    description: "Life insurance scheme providing ₹2 lakh life cover at just ₹436/year premium — one of the most affordable life insurance options in India.",
    category: "Social",
    ministry: "Ministry of Finance",
    type: "Central",
    benefits: "₹2 Lakh life insurance at only ₹436/year premium. Auto-renewed annually.",
    eligibility: "Bank account holders aged 18-50 years with Aadhaar-linked account.",
    howToApply: "Enroll through your bank. Premium auto-debited from bank account every May.",
    isVerified: true, source: "Official"
  },
  {
    title: "Pradhan Mantri Suraksha Bima Yojana",
    link: "https://jansuraksha.gov.in/",
    registrationLink: "https://jansuraksha.gov.in/",
    description: "Accidental death and disability insurance scheme at minimal premium of ₹20/year providing ₹2 lakh coverage to bank account holders.",
    category: "Social",
    ministry: "Ministry of Finance",
    type: "Central",
    benefits: "₹2 Lakh accidental death/disability cover at just ₹20/year. Partial disability: ₹1 Lakh.",
    eligibility: "Bank account holders aged 18-70 years.",
    howToApply: "Enroll at your bank. Premium auto-deducted annually from account.",
    isVerified: true, source: "Official"
  },
  {
    title: "Digital India Land Records Modernisation",
    link: "https://dilrmp.gov.in/",
    registrationLink: "https://dilrmp.gov.in/",
    description: "Modernizing land records to provide transparent, comprehensive digitized land management system to prevent fraudulent land transactions.",
    category: "Infrastructure",
    ministry: "Ministry of Rural Development",
    type: "Central",
    benefits: "Online land records access, mutation, and RoR (Record of Rights). Reduces corruption.",
    eligibility: "All land owners and citizens needing land record services.",
    howToApply: "Access state-specific land portals (e.g., Bhulekh, Bhunaksha) online.",
    isVerified: true, source: "Official"
  },
  {
    title: "Jal Jeevan Mission",
    link: "https://jaljeevanmission.gov.in/",
    registrationLink: "https://jaljeevanmission.gov.in/",
    description: "Har Ghar Jal initiative to provide safe and adequate drinking water through tap connections to all rural households by 2024.",
    category: "Infrastructure",
    ministry: "Ministry of Jal Shakti",
    type: "Central",
    benefits: "Functional household tap connection (FHTC) providing 55 litre/person/day potable water.",
    eligibility: "All rural households without tap water connection.",
    howToApply: "Contact local Gram Panchayat / Jal Shakti Vibhag or visit jaljeevanmission.gov.in.",
    isVerified: true, source: "Official"
  },

  // ===== STATE SCHEMES =====
  {
    title: "Delhi Mukhyamantri Mahila Samman Yojana",
    link: "https://edistrict.delhigovt.nic.in/",
    registrationLink: "https://edistrict.delhigovt.nic.in/",
    description: "Monthly financial assistance of ₹1000 to women aged 18+ in Delhi. Part of AAP government's commitment to women's economic empowerment.",
    category: "Social",
    ministry: "Delhi Government - Women & Child Development",
    type: "State",
    benefits: "₹1000/month direct bank transfer to eligible women in Delhi.",
    eligibility: "Women aged 18+, permanent Delhi resident, not a govt employee or taxpayer.",
    howToApply: "Apply at nearest Mahila Samman camps or Delhi e-district portal.",
    isVerified: true, source: "State Official"
  },
  {
    title: "Haryana Chirag Yojana",
    link: "https://schooleducationharyana.gov.in/",
    registrationLink: "https://schooleducationharyana.gov.in/",
    description: "Provides free education to children from low-income families (annual income ≤1.8 lakh) in private schools under RTE Act provisions.",
    category: "Education",
    ministry: "Haryana School Education Department",
    type: "State",
    benefits: "Free admission to private schools for Class 2-12 students from economically weak sections.",
    eligibility: "Children of families with annual income ≤ ₹1.8 lakh in Haryana.",
    howToApply: "Apply through school or haryana.gov.in during admission season.",
    isVerified: true, source: "State Official"
  },
  {
    title: "Maharashtra Mahatma Jyotirao Phule Jan Arogya Yojana",
    link: "https://www.jeevandayee.gov.in/",
    registrationLink: "https://www.jeevandayee.gov.in/",
    description: "Maharashtra government's flagship health scheme providing cashless medical treatment up to ₹5 lakh for 34+ critical diseases at empaneled hospitals.",
    category: "Health",
    ministry: "Maharashtra Health Department",
    type: "State",
    benefits: "Cashless treatment up to ₹5 lakh for 34 critical diseases including cancer, kidney failure.",
    eligibility: "BPL/EWS families of Maharashtra with Yellow/Orange/Antyodaya ration cards.",
    howToApply: "Visit any empaneled hospital with ration card and Aadhaar.",
    isVerified: true, source: "State Official"
  },
  {
    title: "UP Kisan Karj Rahat Yojana",
    link: "https://upkisankarjrahat.upagriculture.com/",
    registrationLink: "https://upkisankarjrahat.upagriculture.com/",
    description: "Uttar Pradesh government's agricultural loan waiver scheme for small and marginal farmers to relieve them of debt burden up to ₹1 lakh.",
    category: "Agriculture",
    ministry: "Uttar Pradesh Agriculture Department",
    type: "State",
    benefits: "Loan waiver up to ₹1 lakh for small and marginal farmers in UP.",
    eligibility: "Small & marginal farmers of UP with agricultural loan from cooperative banks.",
    howToApply: "Register at upkisankarjrahat.upagriculture.com or visit nearest bank.",
    isVerified: true, source: "State Official"
  },
  {
    title: "Rajasthan Indira Gandhi Free Smartphone Yojana",
    link: "https://igsy.rajasthan.gov.in/",
    registrationLink: "https://igsy.rajasthan.gov.in/",
    description: "Rajasthan government provides free smartphones with 3-year free data to women heads of families to bridge the digital gender divide.",
    category: "Education",
    ministry: "Rajasthan Department of Information Technology",
    type: "State",
    benefits: "Free smartphone + SIM + 3 years internet data for women household heads.",
    eligibility: "Women heads of families on NFSA list (Chiranjeevi / NREGA beneficiaries).",
    howToApply: "Visit nearest camp organized by district administration with Aadhaar and Jan Aadhaar card.",
    isVerified: true, source: "State Official"
  },
  {
    title: "Tamil Nadu Kalaignar Magalir Urimai Thogai",
    link: "https://www.tn.gov.in/",
    registrationLink: "https://www.tn.gov.in/",
    description: "Monthly financial assistance of ₹1000 to women family heads in Tamil Nadu under the DMK government's flagship women empowerment initiative.",
    category: "Social",
    ministry: "Tamil Nadu Social Welfare Department",
    type: "State",
    benefits: "₹1000/month per woman family head directly to bank account.",
    eligibility: "Women as family heads in Tamil Nadu with ration card.",
    howToApply: "Register at nearest Anganwadi / Social Welfare office or tn.gov.in portal.",
    isVerified: true, source: "State Official"
  },
  {
    title: "Punjab Ghar Ghar Rozgar & Karobar Mission",
    link: "https://www.pgrkam.com/",
    registrationLink: "https://www.pgrkam.com/",
    description: "Punjab government's employment generation platform connecting job seekers with employers and providing skill development, apprenticeships, and self-employment support.",
    category: "Employment",
    ministry: "Punjab Employment Generation Department",
    type: "State",
    benefits: "Free job placement, skill training, apprenticeship, and business guidance.",
    eligibility: "Punjab residents aged 18-35 seeking employment or self-employment.",
    howToApply: "Register at pgrkam.com or visit district employment bureau.",
    isVerified: true, source: "State Official"
  }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!');

        console.log('Clearing old schemes...');
        await Scheme.deleteMany({});

        console.log('Inserting fresh schemes...');
        await Scheme.insertMany(VERIFIED_SCHEMES);

        console.log(`Successfully seeded ${VERIFIED_SCHEMES.length} schemes!`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
