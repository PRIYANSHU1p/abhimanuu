/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Info, 
  LogIn, 
  UserPlus, 
  LayoutDashboard, 
  HeartHandshake, 
  BookOpenText, 
  HandCoins, 
  MessageSquare,
  Bell,
  Search,
  Upload,
  MapPin,
  ChevronRight,
  ChevronDown,
  Send,
  X,
  Menu,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Activity,
  Cpu,
  Building2,
  PhoneCall,
  ShieldAlert,
  BarChart3,
  Award,
  Users,
  PawPrint,
  Ambulance,
  Bone,
  Shield,
  Check,
  AlertTriangle,
  Sparkles,
  Bot,
  ExternalLink,
  Sun,
  Moon,
  Eye,
  ShieldCheck,
  Navigation,
  Crosshair,
  Download,
  Key,
  MessageCircle,
  Filter,
  Inbox,
  Zap
} from 'lucide-react';
import { CivicGallery } from './components/CivicGallery';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { 
  Routes, 
  Route, 
  useNavigate, 
  useLocation, 
  Navigate 
} from 'react-router-dom';
import { requestForToken, onMessageListener, messaging } from './firebase';
import { onMessage } from 'firebase/messaging';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-center transition-colors duration-300">
          <div className="max-w-md w-full space-y-6">
            <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="text-red-500" size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Something went wrong</h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                The application encountered a runtime error. This might be due to a malformed API response or a rendering issue.
              </p>
            </div>
            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
              <p className="text-[10px] font-mono text-red-400 break-all">{this.state.error?.message || "Unknown error"}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fix for Leaflet default icon issue in Vite
// We use dynamic paths that are more reliable in Vite/React environments
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


// --- Types ---
type View = 
  | 'loading' 
  | 'landing' 
  | 'login' 
  | 'signup' 
  | 'dashboard' 
  | 'profile'
  | 'animal-welfare' 
  | 'social-help' 
  | 'government-schemes' 
  | 'government-donations' 
  | 'notifications'
  | 'settings'
  | 'help-support'
  | 'my-complaints'
  | 'complaint-details'
  | 'monitoring'
  | 'forgot-password'
  | 'reset-password'
  | 'about'
  | 'initiatives';

interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

interface TimelineStep {
  label: string;
  status: 'completed' | 'active' | 'pending';
  description: string;
  date: string;
  time: string;
}

interface Complaint {
  id: string;
  subject: string;
  description: string;
  image?: string;
  pincode: string;
  address: string;
  category: string;
  priority: string;
  department: string;
  estimatedTime: string;
  submittedAt: string;
  status: string;
  timeline?: TimelineStep[]; // Optional - always computed dynamically from status at render time
  aiData?: {
    animal: string;
    injury: string;
    urgency: string;
    ngo: string;
    eta: string;
  };
  aiSummary?: string;
  aiRemarks?: string;
  visualCategory?: string;
  visualRiskLevel?: string;
  detectedObjects?: string[];
  imageSummary?: string;
  imageConfidence?: number;
  detectedLanguage?: string;
  safetyPrecautions?: string;
  location?: { lat: number; lng: number };
  imageFile?: File;
}

interface User {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: string;
  location?: { lat: number, lng: number };
}

interface Scheme {
  id?: string | number;
  type?: string;
  title: string;
  description: string;
  category: string;
  link: string;
  registrationLink?: string;
  ministry?: string;
  source?: string;
  benefits?: string;
  eligibility?: string;
  howToApply?: string;
}

interface Donation {
  id: string;
  name: string;
  purpose: string;
  description: string;
  link: string;
  type: string;
  category: string;
  isVerified: boolean;
  status?: string;
}

interface Initiative {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number; address: string };
  volunteersRequired: number;
  volunteersJoined: number;
  images: string[];
  status: string;
  groupLink?: string;
}

// --- Mock Data ---
const SCHEMES = [
  {
    id: 1,
    title: "PM-Kisan Samman Nidhi",
    type: "Central",
    link: "https://pmkisan.gov.in/",
    registrationLink: "https://pmkisan.gov.in/RegistrationForm.aspx",
    description: "Financial benefit of Rs. 6000 per year is transferred in three equal installments of Rs. 2000 every four months to the bank accounts of the farmers.",
    category: "Agriculture",
    benefits: "Direct income support to farmers.",
    eligibility: "Small and marginal farmers.",
    howToApply: "Register on the official portal or through CSC.",
    startDate: "Dec 2018"
  },
  {
    id: 2,
    title: "Ayushman Bharat",
    type: "Central",
    link: "https://pmjay.gov.in/",
    registrationLink: "https://setu.pmjay.gov.in/setu/",
    description: "National Health Protection Scheme, which will cover over 10 crore poor and vulnerable families providing coverage upto 5 lakh rupees per family per year.",
    category: "Health",
    benefits: "Cashless healthcare for hospitalization.",
    eligibility: "Identified social-economic caste census families.",
    howToApply: "Visit empaneled hospitals or verify via website.",
    startDate: "Sept 2018"
  },
  {
    id: 3,
    title: "PM SVANidhi",
    type: "Central",
    link: "https://pmsvanidhi.mohua.gov.in/",
    registrationLink: "https://pmsvanidhi.mohua.gov.in/Home/ApplyLoan",
    description: "A special micro-credit facility for street vendors to provide affordable loans for their businesses.",
    category: "Economic",
    benefits: "Working capital loan up to ₹10,000.",
    eligibility: "Street vendors operating in urban areas.",
    howToApply: "Apply online or via mobile app.",
    startDate: "June 2020"
  },
  {
    id: 4,
    title: "Startup India",
    type: "Central",
    link: "https://www.startupindia.gov.in/",
    registrationLink: "https://www.startupindia.gov.in/content/sih/en/registration.html",
    description: "A flagship initiative of the Government of India, intended to build a strong eco-system for nurturing innovation and Startups.",
    category: "Business",
    benefits: "Tax exemptions, funding support, and simplified compliance.",
    eligibility: "Startups registered in India.",
    howToApply: "Register on the Startup India portal.",
    startDate: "Jan 2016"
  },
  {
    id: 5,
    title: "Sukanya Samriddhi Yojana",
    type: "Central",
    link: "https://www.indiapost.gov.in/Financial/pages/content/ssy.aspx",
    registrationLink: "https://www.indiapost.gov.in/Financial/pages/content/ssy.aspx",
    description: "A small deposit scheme for the girl child launched as a part of the 'Beti Bachao Beti Padhao' campaign.",
    category: "Social",
    benefits: "High interest rate and tax benefits.",
    eligibility: "Parents of girl child below 10 years.",
    howToApply: "Open account at any post office or authorized bank.",
    startDate: "Jan 2015"
  },
  {
    id: 6,
    title: "Atal Pension Yojana",
    type: "Central",
    link: "https://npscra.nsdl.co.in/scheme-details.php",
    registrationLink: "https://enps.nsdl.com/eNPS/APYSubRegistration.html",
    description: "A pension scheme for citizens of India focused on the unorganized sector workers.",
    category: "Social Security",
    benefits: "Fixed monthly pension ranging from ₹1000 to ₹5000.",
    eligibility: "All citizens aged between 18 and 40 years.",
    howToApply: "Apply via any bank or online through eNPS.",
    startDate: "May 2015"
  },
  {
    id: 7,
    title: "Delhi Mukhyamantri Mahila Samman Yojana",
    type: "State",
    link: "https://edistrict.delhigovt.nic.in/",
    registrationLink: "https://edistrict.delhigovt.nic.in/",
    description: "Monthly financial assistance of ₹1000 to women aged 18+ in Delhi for economic empowerment.",
    category: "Social",
    benefits: "₹1000 per month direct bank transfer.",
    eligibility: "Women aged 18+, Delhi resident, non-taxpayer.",
    howToApply: "Apply via Delhi e-district portal or nearby camps.",
    startDate: "Mar 2024"
  },
  {
    id: 8,
    title: "Maharashtra Mahatma Jyotirao Phule Jan Arogya Yojana",
    type: "State",
    link: "https://www.jeevandayee.gov.in/",
    registrationLink: "https://www.jeevandayee.gov.in/",
    description: "Cashless medical treatment for 34 critical diseases up to ₹5 lakh for BPL/EWS families.",
    category: "Health",
    benefits: "Cashless treatment up to ₹5 Lakh.",
    eligibility: "Ration card holders in Maharashtra.",
    howToApply: "Visit any empaneled hospital with Aadhaar.",
    startDate: "July 2012"
  }
];

const DONATIONS = [
  {
    id: 1,
    name: "PM CARES Fund",
    purpose: "National Relief",
    description: "A dedicated national fund with the primary objective of dealing with any kind of emergency or distress situation like the COVID-19 pandemic.",
    link: "https://www.pmcares.gov.in/",
    category: "National",
    isVerified: true
  },
  {
    id: 2,
    name: "National Relief Fund",
    purpose: "Disaster Relief",
    description: "Prime Minister's National Relief Fund (PMNRF) provides immediate relief to families of those killed in natural calamities like floods, cyclones, and earthquakes.",
    link: "https://pmnrf.gov.in/",
    category: "National",
    isVerified: true
  },
  {
    id: 3,
    name: "Animal Welfare Board",
    purpose: "Animal Welfare",
    description: "A statutory advisory body on Animal Welfare Laws and promotes animal welfare in the country.",
    link: "https://www.awbi.gov.in/",
    category: "Social",
    isVerified: true
  }
];

// --- Translations ---
const TRANSLATIONS = {
  en: {
    home: "Home",
    about: "About",
    login: "Login",
    signup: "Sign Up",
    logout: "Logout",
    profile: "Profile",
    dashboard: "Main Dashboard",
    animal: "Animal Welfare",
    social: "Social Help",
    schemes: "Govt Schemes",
    donations: "Donations",
    initiatives: "Initiatives",
    hero_tag: "Empowering Citizens, Fixing Cities",
    hero_title: "Voice Your Concerns, See the Change.",
    hero_desc: "Connect directly with local authorities. Report issues, track progress, and stay informed about government schemes.",
    get_started: "Get Started for Free",
    describe_problem: "Describe your problem",
    select_priority: "Select Priority Level",
    submit: "Submit Grievance",
    ai_analyzing: "AI is recognizing your Problem...",
    routing_result: "AI Routing Result",
    active_tracking: "Active Tracking",
    language: "Language",
    theme: "Theme",
    welcome: "Welcome Back",
    join_us: "Join CitizenConnect",
    credentials_prompt: "Enter your credentials to access your dashboard",
    community_prompt: "Start making a difference in your community today",
    full_name: "Full Name",
    email_addr: "Email Address",
    password: "Password",
    login_btn: "Login to Account",
    signup_btn: "Create Admin Account",
    no_account: "Don't have an account? Sign up",
    has_account: "Already have an account? Login",
    about_title: "About CitizenConnect",
    about_desc: "CitizenConnect was born at the intersection of civic passion and modern technology. We believe every citizen deserves a direct, transparent, and efficient way to interact with their local government.",
    our_mission: "Our Mission",
    mission_desc: "To bridge the communication gap between municipal authorities and the people they serve.",
    our_vision: "Our Vision",
    vision_desc: "A world where civic issues are resolved as quickly as a software bug.",
    animal_title: "Animal Rescue & Welfare",
    upload_animal_photo: "Upload Photo of Animal",
    describe_animal: "Describe the animal's condition or the problem...",
    submit_rescue: "Submit Rescue Request",
    social_title: "Social Assistance Portal",
    social_desc: "Report social issues like homelessness, domestic concerns, or community disputes for discrete official intervention.",
    urgent_social: "Urgent Social Help",
    urgent_social_desc: "Direct hotline intervention for immediate social crisis.",
    report_crisis: "Report Crisis",
    community_support: "Community Support",
    community_support_desc: "Request resources for community-led social programs.",
    submit_request: "Submit Request",
    schemes_title: "Government Schemes",
    filter_all: "All",
    filter_central: "Central",
    filter_state: "State",
    donations_title: "Government Verified Donations",
    donations_desc: "Support audited and verified organizations working for the betterment of our community. Your contributions are tax-exempt under Section 80G.",
    view_org: "View Organization",
    register_now: "Register Now",
    about_scheme: "About the Scheme",
    key_benefits: "Key Benefits",
    eligibility: "Eligibility",
    how_to_apply: "How to Apply",
    no_grievance: "No Active Grievance",
    submit_to_track: "Submit a problem to see real-time tracking from government departments.",
    pincode: "Pincode",
    photos: "Photos",
    location: "Location",
    loc_detected: "Location Detected",
    loc_detecting: "Detecting...",
    photo_added: "Photo Added",
    phone_number: "Phone Number",
    address_label: "Residential Address",
    upload_avatar: "Upload Avatar",
    forgot_password: "Forgot Password?",
    send_reset_link: "Send Reset Link",
    back_to_login: "Back to Login",
    reset_success: "Reset link sent to your email! (Check console for token in dev)",
    reset_password_title: "Reset Password",
    new_password: "New Password",
    update_password: "Update Password",
    password_updated: "Password updated successfully!"
  },
  hi: {
    home: "होम",
    about: "हमारे बारे में",
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "लॉगआउट",
    profile: "प्रोफ़ाइल",
    dashboard: "डैशबोर्ड",
    animal: "पशु कल्याण",
    social: "सामाजिक सहायता",
    schemes: "सरकारी योजनाएं",
    donations: "दान",
    initiatives: "सामुदायिक पहल",
    hero_tag: "नागरिकों को सशक्त बनाना, शहरों को सुधारना",
    hero_title: "अपनी चिंता व्यक्त करें, बदलाव देखें।",
    hero_desc: "स्थानीय अधिकारियों से सीधे जुड़ें। मुद्दों की रिपोर्ट करें, प्रगति को ट्रैक करें और सरकारी योजनाओं के बारे में सूचित रहें।",
    get_started: "मुफ्त में शुरू करें",
    describe_problem: "अपनी समस्या का वर्णन करें",
    select_priority: "प्राथमिकता स्तर चुनें",
    submit: "शिकायत दर्ज करें",
    ai_analyzing: "AI आपकी समस्या पहचान रहा है...",
    routing_result: "AI रूटिंग परिणाम",
    active_tracking: "सक्रिय ट्रैकिंग",
    language: "भाषा",
    theme: "थीम",
    welcome: "स्वागत है",
    join_us: "सिटिजनकनेक्ट से जुड़ें",
    credentials_prompt: "अपने डैशबोर्ड तक पहुँचने के लिए अपनी क्रेडेंशियल दर्ज करें",
    community_prompt: "आज ही अपने समुदाय में बदलाव लाना शुरू करें",
    full_name: "पूरा नाम",
    email_addr: "ईमेल पता",
    password: "पासवर्ड",
    login_btn: "खाते में लॉगिन करें",
    signup_btn: "व्यवस्थापक खाता बनाएं",
    no_account: "खाता नहीं है? साइन अप करें",
    has_account: "पहले से ही खाता है? लॉगिन करें",
    about_title: "सिटिजनकनेक्ट के बारे में",
    about_desc: "सिटिजनकनेक्ट का जन्म नागरिक जुनून और आधुनिक तकनीक के संगम पर हुआ था। हमारा मानना है कि प्रत्येक नागरिक अपने स्थानीय सरकार के साथ बातचीत करने का एक सीधा, पारदर्शी और कुशल तरीका हकदार है।",
    our_mission: "हमारा मिशन",
    mission_desc: "नगरपालिका अधिकारियों और उन लोगों के बीच संचार की खाई को पाटना जिनकी वे सेवा करते हैं।",
    our_vision: "हमारा विजन",
    vision_desc: "एक ऐसी दुनिया जहां नागरिक मुद्दों को सॉफ्टवेयर बग की तरह जल्दी हल किया जाता है।",
    animal_title: "पशु बचाव और कल्याण",
    upload_animal_photo: "पशु की फोटो अपलोड करें",
    describe_animal: "पशु की स्थिति या समस्या का वर्णन करें...",
    submit_rescue: "बचाव अनुरोध सबमिट करें",
    social_title: "सामाजिक सहायता पोर्टल",
    social_desc: "विवेकपूर्ण आधिकारिक हस्तक्षेप के लिए बेघर होने, घरेलू चिंताओं या सामुदायिक विवादों जैसे सामाजिक मुद्दों की रिपोर्ट करें।",
    urgent_social: "तत्काल सामाजिक सहायता",
    urgent_social_desc: "तत्काल सामाजिक संकट के लिए सीधी हॉटलाइन हस्तक्षेप।",
    report_crisis: "संकट की रिपोर्ट करें",
    community_support: "सामुदायिक सहायता",
    community_support_desc: "सामुदायिक नेतृत्व वाले सामाजिक कार्यक्रमों के लिए संसाधनों का अनुरोध करें।",
    submit_request: "अनुरोध सबमिट करें",
    schemes_title: "सरकारी योजनाएं",
    filter_all: "सभी",
    filter_central: "केंद्रीय",
    filter_state: "राज्य",
    donations_title: "सरकारी सत्यापित दान",
    donations_desc: "हमारे समुदाय की बेहतरी के लिए काम करने वाले ऑडिटेड और सत्यापित संगठनों का समर्थन करें। आपका योगदान धारा 80G के तहत कर-मुक्त है।",
    view_org: "संगठन देखें",
    register_now: "अभी पंजीकरण करें",
    about_scheme: "योजना के बारे में",
    key_benefits: "प्रमुख लाभ",
    eligibility: "पात्रता",
    how_to_apply: "आवेदन कैसे करें",
    no_grievance: "कोई सक्रिय शिकायत नहीं",
    submit_to_track: "सरकारी विभागों से रीयल-टाइम ट्रैकिंग देखने के लिए समस्या सबमिट करें।",
    pincode: "पिनकोड",
    photos: "फोटो",
    location: "स्थान",
    loc_detected: "स्थान मिल गया",
    loc_detecting: "खोज रहा है...",
    photo_added: "फोटो जोड़ी गई",
    phone_number: "फ़ोन नंबर",
    address_label: "आवासीय पता",
    upload_avatar: "प्रोफ़ाइल फोटो अपलोड करें",
    forgot_password: "पासवर्ड भूल गए?",
    send_reset_link: "रीसेट लिंक भेजें",
    back_to_login: "लॉगिन पर वापस जाएं",
    reset_success: "रीसेट लिंक आपके ईमेल पर भेज दिया गया है! (देव में टोकन के लिए कंसोल देखें)",
    reset_password_title: "पासवर्ड रीसेट करें",
    new_password: "नया पासवर्ड",
    update_password: "पासवर्ड अपडेट करें",
    password_updated: "पासवर्ड सफलतापूर्वक अपडेट किया गया!"
  }
};

type Language = 'en' | 'hi';
type Theme = 'light' | 'dark';

// --- Map Components ---
const MapRecenter = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(pos);
  }, [pos, map]);
  return null;
};

const LiveMap = ({ complaints, language, theme, center = [28.6139, 77.2090] }: { complaints: Complaint[], language: Language, theme: Theme, center?: [number, number] }) => {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Resolved'>('All');
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  
  const filteredComplaints = complaints.filter(c => {
    if (filter === 'All') return true;
    if (filter === 'Resolved') return c.status === 'Resolved';
    return c.status !== 'Resolved';
  });

  const activeCount = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="glass-card rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl relative h-[450px] group transition-colors duration-300">
      {/* Status Filter Overlay */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="bg-white/90 dark:bg-[#060B16]/90 backdrop-blur-md border border-gray-100 dark:border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Live Operations</span>
        </div>
        
        <div className="flex bg-white/90 dark:bg-[#060B16]/90 backdrop-blur-md p-1 rounded-xl border border-gray-100 dark:border-white/10 shadow-lg">
          {(['All', 'Active', 'Resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                filter === f 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Pulse Overlay */}
      <div className="absolute top-6 right-6 z-[1000] hidden sm:flex gap-2">
        <div className="bg-white/90 dark:bg-[#060B16]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 shadow-lg flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Active:</span>
          <span className="text-xs font-black text-blue-500">{activeCount}</span>
        </div>
        <div className="bg-white/90 dark:bg-[#060B16]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-gray-100 dark:border-white/10 shadow-lg flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Fixed:</span>
          <span className="text-xs font-black text-emerald-500">{resolvedCount}</span>
        </div>
      </div>

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] hidden md:block">
        <div className="bg-white/90 dark:bg-[#060B16]/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl space-y-2">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Issue Status Guide</p>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 uppercase">Submitted</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 uppercase">In Progress</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 uppercase">Fixed</span>
          </div>
        </div>
      </div>

      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={theme === 'dark' 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <MapRecenter pos={center} />
        {filteredComplaints.map((c, i) => {
          if (!c.location) return null;
          
          const status = c.status || 'Submitted';
          const color = status === 'Resolved' ? '#10b981' : (status === 'Submitted' ? '#f59e0b' : '#3b82f6');
          
          const icon = L.divIcon({
            className: 'pulsing-marker-wrapper',
            html: `<div class="marker-pulse" style="background-color: ${color}; box-shadow: 0 0 15px ${color}80"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          return (
            <Marker 
              key={i} 
              position={[c.location.lat, c.location.lng]}
              icon={icon}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{backgroundColor: color}} />
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-tighter">{c.department}</h4>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white mb-2 leading-tight">{c.subject || c.category}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
                    <span className="text-[9px] font-black uppercase text-gray-400">{c.status}</span>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.pincode}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

const LocationPicker = ({ position, setPosition, setAddress, theme }: { position: [number, number], setPosition: (p: [number, number]) => void, setAddress: (a: string) => void, theme: Theme }) => {
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) setAddress(data.display_name);
          })
          .catch(console.error);
      },
    });
    return null;
  };

  const MapRecenter = ({ pos }: { pos: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(pos, 15);
    }, [pos]);
    return null;
  };

  return (
    <div className="h-80 w-full rounded-[2rem] overflow-hidden border border-gray-100 dark:border-white/10 relative shadow-2xl mt-4 group transition-colors duration-300">
      <MapContainer center={position} zoom={15} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer url={theme === 'dark' 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
        />
        <Marker position={position} />
        <MapEvents />
        <MapRecenter pos={position} />
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/80 dark:bg-[#060B16]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-100 dark:border-white/10 text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {document.documentElement.lang === 'hi' ? 'स्थान चुनने के लिए टैप करें' : 'Touch to set position'}
        </div>
      </div>
    </div>
  );
};

// --- Components ---
const PublicNavbar = ({ 
  currentView, 
  setView, 
  user, 
  onLogout, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  onMenuToggle 
}: { 
  currentView: View, 
  setView: (v: View) => void, 
  user: User | null, 
  onLogout: () => void,
  language: Language,
  setLanguage: (l: Language) => void,
  theme: Theme,
  setTheme: (t: Theme) => void,
  onMenuToggle: () => void
}) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('landing')}>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <LayoutDashboard size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary">CitizenConnect</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setView('landing')} 
            className={`text-sm font-bold transition-all hover:text-primary ${currentView === 'landing' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {t('home')}
          </button>
          <button 
            onClick={() => setView('initiatives')} 
            className={`text-sm font-bold transition-all hover:text-primary ${currentView === 'initiatives' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {t('initiatives')}
          </button>
          <button 
            onClick={() => setView('about')} 
            className={`text-sm font-bold transition-all hover:text-primary ${currentView === 'about' ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {t('about')}
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 mr-2 border-r border-gray-100 dark:border-white/10 pr-2 sm:pr-4">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
              className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-500 dark:text-gray-400"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-bold text-gray-500 dark:text-gray-400 outline-none cursor-pointer hover:text-primary transition-colors py-2"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900 dark:text-white leading-none">{user.name}</span>
                <button onClick={onLogout} className="text-[10px] font-bold text-red-500 hover:underline mt-1">{t('logout')}</button>
              </div>
              <div 
                onClick={() => setView('profile')}
                className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer hover:bg-primary hover:text-white transition-all shadow-inner"
              >
                <User size={18} className="transition-colors" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setView('login')} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors px-2">{t('login')}</button>
              <button 
                onClick={() => setView('signup')} 
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-primary/20 active:scale-95"
              >
                {t('signup')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const DashboardNavbar = ({ 
  currentView, 
  setView, 
  user, 
  onLogout,
  language,
  setLanguage,
  theme,
  setTheme,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  handleGlobalSearch
}: { 
  currentView: View, 
  setView: (v: View) => void, 
  user: User | null, 
  onLogout: () => void,
  language: Language,
  setLanguage: (l: Language) => void,
  theme: Theme,
  setTheme: (t: Theme) => void,
  onMenuToggle: () => void,
  searchQuery?: string,
  onSearchChange?: (q: string) => void,
  handleGlobalSearch: (q: string) => void
}) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  const isHomeActive = currentView === 'dashboard';
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-gray-900 dark:text-white transition-colors duration-300">
      <div className="mx-auto flex h-20 max-w-full items-center justify-between px-4 sm:px-6 gap-2 sm:gap-6">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
        >
          <Menu size={24} />
        </button>

        {/* Logo Section */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setView('dashboard')}>
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
            <LayoutDashboard size={22} />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">CitizenConnect</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">Smart City. Better Tomorrow.</span>
          </div>
        </div>

        {/* Menu & Navigation Links - Hidden on mobile, shown on lg */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('dashboard')} 
              className={`relative py-1 text-sm font-bold transition-all ${isHomeActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {t('home')}
              {isHomeActive && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setView('about')} 
              className={`relative py-1 text-sm font-bold transition-all ${currentView === 'about' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {t('about')}
              {currentView === 'about' && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setView('initiatives')} 
              className={`relative py-1 text-sm font-bold transition-all ${currentView === 'initiatives' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {t('initiatives')}
              {currentView === 'initiatives' && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar - Center - Responsive width */}
        <div className="flex-1 max-w-2xl px-2 hidden sm:block">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery) handleGlobalSearch(searchQuery);
            }}
            className="relative group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search services, schemes, departments or search location..."
              className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/5 rounded-xl py-2.5 pl-12 pr-12 text-sm text-gray-900 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Right Section: Notifications, Theme & Profile */}
        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-500 dark:text-gray-400"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => setView('notifications')}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
          >
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">3</span>
          </button>

          {user && (
            <div className="relative flex items-center gap-2 sm:gap-4 pl-4 border-l border-gray-100 dark:border-white/10 h-10">
              <div 
                className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-xl cursor-pointer hover:border-primary transition-all" 
                onClick={() => setView('profile')}
              >
                <img 
                  src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop"} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.name}</span>
                <span className="text-[11px] text-gray-500 font-medium capitalize">{user.role || 'Citizen'}</span>
              </div>
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <ChevronDown size={18} className={`text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 shadow-2xl p-4 z-50 overflow-hidden"
                    >
                      <div className="flex items-center gap-4 p-2 mb-4 border-b border-gray-100 dark:border-white/5 pb-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden border border-primary/20">
                          <img src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop"} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <button onClick={() => { setView('profile'); setShowProfileDropdown(false); }} className="w-full flex items-center gap-3 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white rounded-lg transition-colors">
                          <User size={16} /> My Profile
                        </button>
                        <button onClick={() => { setView('settings'); setShowProfileDropdown(false); }} className="w-full flex items-center gap-3 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white rounded-lg transition-colors">
                          <Settings size={16} /> Settings
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-white/5 my-2" />
                        <button onClick={() => { onLogout(); setShowProfileDropdown(false); }} className="w-full flex items-center gap-3 p-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Language Toggle */}
          <div className="flex items-center gap-4 border-l border-gray-100 dark:border-white/10 pl-4">
             <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-gray-500 dark:text-gray-400 outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
              </select>
          </div>
        </div>
      </div>
    </nav>
  );
};

const SidebarContent = ({ currentView, setView, language }: { currentView: View, setView: (v: View) => void, language: Language }) => {
  const items = [
    { id: 'dashboard', label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Home },
    { id: 'monitoring', label: language === 'hi' ? 'लाइव मॉनिटरिंग' : 'Live Monitoring', icon: Activity },
    { id: 'initiatives', label: language === 'hi' ? 'सामुदायिक पहल' : 'Community Initiatives', icon: Sparkles },
    { id: 'my-complaints', label: language === 'hi' ? 'मेरी शिकायतें' : 'My Complaints', icon: FileText },
    { id: 'animal-welfare', label: language === 'hi' ? 'पशु कल्याण' : 'Animal Welfare', icon: PawPrint },
    { id: 'social-help', label: language === 'hi' ? 'सामाजिक सहायता' : 'Social Help', icon: HeartHandshake },
    { id: 'government-schemes', label: language === 'hi' ? 'सरकारी योजनाएं' : 'Government Schemes', icon: BookOpenText },
    { id: 'government-donations', label: language === 'hi' ? 'सरकारी दान' : 'Government Donations', icon: Heart },
    { id: 'notifications', label: language === 'hi' ? 'सूचनाएं' : 'Notifications', icon: Bell, badge: 3 },
    { id: 'profile', label: language === 'hi' ? 'प्रोफ़ाइल' : 'Profile', icon: UserPlus },
    { id: 'settings', label: language === 'hi' ? 'सेटिंग्स' : 'Settings', icon: Settings },
    { id: 'help-support', label: language === 'hi' ? 'सहायता और समर्थन' : 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1 h-full">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        const isAWTab = item.id === 'animal-welfare';
        const isSHTab = item.id === 'social-help';
        
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all group ${
              isActive 
                ? (isAWTab ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                   isSHTab ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20' :
                   'bg-primary text-white shadow-lg shadow-primary/20') 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white'
            }`}
          >
            <Icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary dark:group-hover:text-white'}`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'}`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const Sidebar = ({ setView, currentView, onLogout, language }: { setView: (v: View) => void, currentView: View, onLogout: () => void, language: Language }) => {
  const isAnimalWelfare = currentView === 'animal-welfare';
  const isSocialHelp = currentView === 'social-help';
  
  const getSidebarBg = () => {
    if (isAnimalWelfare) return 'bg-emerald-50/50 dark:bg-slate-950/50 border-emerald-500/10 dark:border-glow-green/10';
    if (isSocialHelp) return 'bg-pink-50/50 dark:bg-slate-950/50 border-pink-500/10';
    return 'bg-gray-50/50 dark:bg-slate-900/50 border-gray-100 dark:border-white/5';
  };

  return (
    <div className={`hidden w-72 border-r md:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-hidden transition-all duration-500 backdrop-blur-xl ${getSidebarBg()}`}>
      <div className="flex flex-col h-full p-4">
        <div className="flex-1 overflow-hidden">
          <SidebarContent currentView={currentView} setView={setView} language={language} />
        </div>
        
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-white/5 space-y-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut size={18} />
            <span>{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
          </button>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentView}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className={`relative group overflow-hidden rounded-2xl h-32 w-full border shadow-2xl transition-all duration-300 ${
                isAnimalWelfare ? 'border-emerald-500/30 hover:border-emerald-500/50' : 
                isSocialHelp ? 'border-pink-500/30 hover:border-pink-500/50' : 
                'border-gray-200 dark:border-white/10 hover:border-primary/30'
              }`}
            >
              <img 
                src={
                  isAnimalWelfare ? "/image/image5.jpeg" : 
                  isSocialHelp ? "social_help_banner_bg_1778251459405.png" : 
                  "/image/image.png"
                } 
                alt="Sidebar Banner" 
                className="absolute inset-0 w-full h-full object-cover block transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3 space-y-1">
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${
                  isAnimalWelfare ? 'text-emerald-400' : 
                  isSocialHelp ? 'text-pink-400' : 
                  'text-primary-foreground'
                }`}>
                  {isAnimalWelfare ? 'Every Life Matters' : isSocialHelp ? 'Compassion connects us.' : 'City Connect Hub'}
                </p>
                <p className="text-[10px] font-bold text-white leading-tight">
                  {isAnimalWelfare ? 'Together we build a safer world.' : 
                   isSocialHelp ? 'Together, we can build a caring society.' : 
                   'Empowering citizens, one report at a time.'}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const LandingPage = ({ setView, language }: { setView: (v: View) => void, language: Language }) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-primary mb-6 border border-blue-100 dark:border-blue-800">
                <span className="mr-2 flex h-2 w-2 items-center justify-center rounded-full bg-primary" />
                {t('hero_tag')}
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-7xl leading-[1.1]">
                {language === 'hi' ? (
                   <>अपनी <span className="text-primary italic">चिंता</span> व्यक्त करें, <br /><span className="text-accent underline decoration-4 underline-offset-4">बदलाव</span> देखें।</>
                ) : (
                   <>Voice Your <span className="text-primary italic">Concerns</span>, <br />See the <span className="text-accent underline decoration-4 underline-offset-4">Change</span>.</>
                )}
              </h1>
              <p className="mt-6 max-w-lg text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('hero_desc')}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <button onClick={() => setView('signup')} className="rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:bg-blue-700 hover:-translate-y-1">
                  {t('get_started')}
                </button>
                <div className="flex items-center gap-2 px-6 py-4 text-base font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition-colors">
                  {language === 'hi' ? 'देखें कि यह कैसे काम करता है' : 'See How it Works'} <ChevronRight size={20} />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-3xl bg-slate-100 dark:bg-slate-900 shadow-2xl overflow-hidden border-8 border-white dark:border-slate-800 p-4">
                 <div className="h-full w-full bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center flex-col gap-4 text-slate-400 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1524813636737-cb556334ecbc?q=80&w=2670&auto=format&fit=crop" 
                      alt="Demo Placeholder"
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                    <div className="relative z-10 h-16 w-16 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-110 border dark:border-slate-700">
                       <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-[12px] border-l-primary" />
                    </div>
                    <span className="relative z-10 text-white font-bold text-shadow">{language === 'hi' ? 'प्लेटफ़ॉर्म डेमो वीडियो' : 'Platform Demo Video'}</span>
                 </div>
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-gray-100 dark:border-slate-800 max-w-xs">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'hi' ? 'वास्तविक समय आँकड़े' : 'Real-time Stats'}</span>
                 </div>
                 <p className="text-2xl font-bold text-gray-900 dark:text-white">12,482+</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'hi' ? 'इस महीने 50 शहरों में 12,482+ शिकायतों का समाधान हुआ।' : '12,482+ grievances resolved this month across 50 cities.'}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="bg-gray-50 dark:bg-slate-900/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center italic text-gray-400 text-sm mb-12">
          {language === 'hi' ? '"स्थानीय शासन के लिए सबसे सहज उपकरण।" — टेक सिटी जर्नल' : '"The most intuitive tool for local governance." — Tech City Journal'}
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { 
               title: language === 'hi' ? 'AI वर्गीकरण' : 'AI classification', 
               desc: language === 'hi' ? 'तुरंत आपकी समस्या श्रेणी और प्राथमिकता की पहचान करता है।' : 'Instantly identifies your problem category and priority.', 
               icon: AlertCircle 
             },
             { 
               title: language === 'hi' ? 'निर्बाध ट्रैकिंग' : 'Seamless Tracking', 
               desc: language === 'hi' ? 'अपनी शिकायत को सरकारी विभागों के माध्यम से बढ़ते हुए देखें।' : 'Watch your complaint move through government departments.', 
               icon: Clock 
             },
             { 
               title: language === 'hi' ? 'एकीकृत पहुंच' : 'Unified Access', 
               desc: language === 'hi' ? 'पशु देखभाल, सामाजिक सहायता और सब्सिडी के लिए एक खाता।' : 'One account for animal care, social help, and subsidies.', 
               icon: CheckCircle2 
             }
           ].map((feature, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary mb-6">
                   <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};

const AuthPage = ({ type, setView, onLogin, language }: { type: 'login' | 'signup', setView: (v: View) => void, onLogin: (u: User) => void, language: Language }) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = type === 'login' 
        ? { email, password } 
        : { name, email, password, phone, address };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server returned an invalid response. Please check if the backend is running.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Store token
      localStorage.setItem('citizenconnect_token', data.token);
      
      onLogin({ 
        name: data.user.name, 
        email: data.user.email,
        phone: data.user.phone || phone,
        address: data.user.address || address,
        role: data.user.role
      } as User);
      
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 bg-gray-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-2xl border border-gray-100 dark:border-slate-800 my-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {type === 'login' ? t('welcome') : t('join_us')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {type === 'login' 
              ? t('credentials_prompt') 
              : t('community_prompt')}
          </p>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold"
            >
              {error}
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'signup' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('full_name')}</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{t('phone_number')}</label>
                <input 
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">{t('address_label')}</label>
                <textarea 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white resize-none h-20" 
                />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('email_addr')}</label>
            <input 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email" 
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('password')}</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              type === 'login' ? t('login_btn') : t('signup_btn')
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          {type === 'login' && (
            <button 
              onClick={() => setView('forgot-password')}
              className="text-xs font-bold text-primary hover:underline"
            >
              {t('forgot_password')}
            </button>
          )}
          <button 
            onClick={() => setView(type === 'login' ? 'signup' : 'login')}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
          >
            {type === 'login' ? t('no_account') : t('has_account')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ForgotPasswordPage = ({ setView, language }: { setView: (v: View) => void, language: Language }) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage(t('reset_success'));
      // In a real app, the user would click a link. For this test, we allow them to go to reset page manually.
      setTimeout(() => setView('reset-password'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 bg-gray-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-2xl border border-gray-100 dark:border-slate-800 my-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('forgot_password')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'अपना ईमेल दर्ज करें और हम आपको एक लिंक भेजेंगे' : 'Enter your email and we will send you a reset link'}
          </p>
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-bold">
              {message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('email_addr')}</label>
            <input 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email" 
              placeholder="name@example.com"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('send_reset_link')
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setView('login')}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
          >
            {t('back_to_login')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ResetPasswordPage = ({ setView, language }: { setView: (v: View) => void, language: Language }) => {
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/resetpassword/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage(t('password_updated'));
      setTimeout(() => setView('login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 bg-gray-50 dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-2xl border border-gray-100 dark:border-slate-800 my-10"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('reset_password_title')}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'टोकन और अपना नया पासवर्ड दर्ज करें' : 'Enter the token and your new password'}
          </p>
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-xs font-bold">
              {message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Reset Token</label>
            <input 
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from console/email"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('new_password')}</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-3 text-sm transition-all focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 outline-none dark:text-white" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('update_password')
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setView('login')}
            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
          >
            {t('back_to_login')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Map Components are now at the top for better accessibility


// --- Premium Dashboard Components ---
const AIRecognitionCard = ({ result }: { result: any }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[1.5rem] p-5 text-dash-text border border-dash-border mb-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-glow-green/10 flex items-center justify-center text-glow-green glow-icon-green">
          <Cpu size={18} />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest">AI Recognition Result</h3>
      </div>
      
      <div className="space-y-3">
        {[
          { label: 'Category', value: result.category, color: 'text-glow-green', icon: LayoutDashboard },
          { label: 'Priority', value: result.priority, color: 'text-glow-red', icon: AlertCircle },
          { label: 'Assigned Department', value: result.department, color: 'text-glow-purple', icon: Building2 },
          { label: 'Estimated Resolution Time', value: result.estimatedTime || '3 - 5 Working Days', color: 'text-glow-blue', icon: Clock },
        ].map((row, i) => (
          <div key={i}>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2.5 text-dash-secondary">
                <row.icon size={14} />
                <span className="text-[10px] font-semibold">{row.label}</span>
              </div>
              <span className={`text-[10px] font-bold ${row.color}`}>{row.value}</span>
            </div>
            {i < 3 && <div className="h-[1px] w-full bg-white/5" />}
          </div>
        ))}
      </div>
      
      {(result.aiSummary || result.aiRemarks) && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
          {result.aiSummary && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-dash-secondary mb-1">AI Summary</h4>
              <p className="text-xs text-gray-300 leading-relaxed italic border-l-2 border-primary pl-2">{result.aiSummary}</p>
            </div>
          )}
          {result.aiRemarks && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-dash-secondary mb-1">Official Remarks</h4>
              <p className="text-xs text-glow-blue leading-relaxed font-medium bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">{result.aiRemarks}</p>
            </div>
          )}
          {result.safetyPrecautions && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Safety Precautions</h4>
              </div>
              <p className="text-xs text-orange-200/90 leading-relaxed font-medium italic">
                {result.safetyPrecautions}
              </p>
            </div>
          )}
        </div>
      )}

      {result.imageSummary && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-glow-blue/10 flex items-center justify-center text-glow-blue">
              <Eye size={12} />
            </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-glow-blue">Image AI Analysis</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[8px] font-black uppercase text-gray-500 block mb-1">Detected Issue</span>
              <span className="text-[10px] font-bold text-white">{result.visualCategory || 'Generic Civic Issue'}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[8px] font-black uppercase text-gray-500 block mb-1">Risk Level</span>
              <span className={`text-[10px] font-bold ${result.visualRiskLevel === 'Critical' ? 'text-glow-red' : result.visualRiskLevel === 'High' ? 'text-orange-400' : 'text-glow-green'}`}>
                {result.visualRiskLevel || 'Normal'}
              </span>
            </div>
          </div>

          <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
            <p className="text-[10px] text-gray-300 leading-relaxed leading-relaxed italic">
              <span className="text-glow-blue font-bold not-italic mr-1">Visual Summary:</span>
              {result.imageSummary}
            </p>
          </div>

          {result.detectedObjects && result.detectedObjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.detectedObjects.map((obj: string, i: number) => (
                <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-[8px] font-bold text-gray-400 border border-white/5">
                  #{obj}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const TrackComplaintCard = ({ result, onViewDetails }: { result: any, onViewDetails: (id: string) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-[1.5rem] p-5 text-dash-text border border-dash-border"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-glow-purple/10 flex items-center justify-center text-glow-purple glow-icon-purple">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest leading-none mb-1">Track Your Complaint</h3>
            <p className="text-[9px] text-dash-secondary font-medium uppercase tracking-tight">ID: <span className="text-glow-blue font-bold">{result.id || result.ticketId}</span></p>
          </div>
        </div>
      </div>
      
      <div className="relative pl-8 space-y-6">
        <div className="absolute left-[15px] top-[10px] bottom-4 w-[2px] bg-slate-800 rounded-full" />
        <div className="absolute left-[15px] top-[10px] h-[50%] w-[2px] bg-gradient-to-b from-glow-green via-glow-blue to-glow-purple rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
        
        {generateTimeline(result.status || 'Submitted', result.submittedAt || result.createdAt || '').map((step: any, i: number) => (
          <div key={i} className="relative">
            <div className={`absolute -left-[24px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
              step.status === 'completed' ? 'bg-glow-green border-glow-green shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
              step.status === 'active' ? 'bg-dash-bg border-glow-blue shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-dash-bg border-slate-700'
            }`}>
              {step.status === 'completed' && <CheckCircle2 size={10} className="text-[#060B16]" />}
              {step.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-glow-blue animate-pulse" />}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h4 className={`text-[11px] font-bold leading-none mb-1 ${step.status === 'pending' ? 'text-dash-secondary' : 'text-dash-text'}`}>{step.label}</h4>
                <p className="text-[9px] text-dash-secondary leading-relaxed font-medium line-clamp-2">{step.description}</p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-[9px] font-bold text-dash-text">{step.date}</p>
                <p className="text-[8px] text-dash-secondary font-medium">{step.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => onViewDetails(result.id || result.ticketId)}
        className="w-full mt-6 py-2.5 bg-white/5 border border-dash-border rounded-xl text-[10px] font-bold text-dash-text hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
      >
        <FileText size={12} className="text-glow-blue" />
        View Full Details
      </button>
    </motion.div>
  );
};


// --- Quick Actions & Analytics Components ---

const EmergencyModal = ({ isOpen, onClose, language }: { isOpen: boolean, onClose: () => void, language: Language }) => {
  if (!isOpen) return null;
  const contacts = [
    { name: 'Police', number: '100', icon: ShieldAlert, color: 'text-red-500' },
    { name: 'Ambulance', number: '102', icon: Activity, color: 'text-green-500' },
    { name: 'Fire Department', number: '101', icon: BarChart3, color: 'text-orange-500' },
    { name: 'Women Helpline', number: '1091', icon: Heart, color: 'text-pink-500' },
    { name: 'Animal Rescue', number: '1800-XXX-XXXX', icon: PawPrint, color: 'text-blue-500' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-[2.5rem] w-full max-w-md p-8 border border-white/10"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold dark:text-white">Emergency Contacts</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${c.color}`}>
                  <c.icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-dash-secondary uppercase tracking-widest">{c.name}</p>
                  <p className="text-lg font-bold dark:text-white">{c.number}</p>
                </div>
              </div>
              <button className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform">
                <PhoneCall size={18} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const OFFICE_LOCATIONS = [
  { id: 1, name: 'Central Municipal HQ', type: 'Government', pos: [28.6139, 77.2090] as [number, number], addr: 'Civic Centre, Minto Road', status: 'Open', color: '#3b82f6' },
  { id: 2, name: 'City Police Commissionerate', type: 'Security', pos: [28.6270, 77.2150] as [number, number], addr: 'Jai Singh Road, Connaught Place', status: 'Open', color: '#ef4444' },
  { id: 3, name: 'Hope Animal Rescue & Shelter', type: 'Animal Welfare', pos: [28.5900, 77.2200] as [number, number], addr: 'Nizamuddin West, Delhi', status: 'Open', color: '#10b981' },
  { id: 4, name: 'Samarpan Social Help Center', type: 'Social Support', pos: [28.6350, 77.1800] as [number, number], addr: 'Karol Bagh, New Delhi', status: 'Open', color: '#ec4899' },
  { id: 5, name: 'Public Health & Sanitation Dept', type: 'Health', pos: [28.6100, 77.2400] as [number, number], addr: 'Pragati Maidan, New Delhi', status: 'Closing Soon', color: '#f59e0b' },
];

const NearbyOfficesModal = ({ isOpen, onClose, language }: { isOpen: boolean, onClose: () => void, language: Language }) => {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [sortedOffices, setSortedOffices] = useState(OFFICE_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen && !userPos) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          updateReferenceLocation(uPos);
        },
        (err) => console.warn("Location access denied", err),
        { enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  const updateReferenceLocation = (pos: [number, number]) => {
    setUserPos(pos);
    const withDist = OFFICE_LOCATIONS.map(o => ({
      ...o,
      distance: calculateDistance(pos, o.pos)
    })).sort((a, b) => a.distance - b.distance);
    setSortedOffices(withDist as any);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const newPos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        updateReferenceLocation(newPos);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  function calculateDistance(p1: [number, number], p2: [number, number]) {
    const R = 6371;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const MapController = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, 14, { duration: 2 });
    }, [center, map]);
    return null;
  };

  const customIcon = (color: string) => L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>`,
    className: 'custom-marker-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const userIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute h-6 w-6 bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="h-3 w-3 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>
           </div>`,
    className: 'user-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-[2.5rem] w-full max-w-2xl p-8 border border-white/10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold dark:text-white">Nearby Department Offices</h2>
            <p className="text-xs text-dash-secondary mt-1">
              {userPos ? 'Found location. Highlighting nearest centers.' : 'Locating you to find nearest service hubs...'}
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-64 group">
            <input 
              type="text" 
              placeholder="Search area..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-10 text-xs focus:border-primary/50 transition-all outline-none"
            />
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-primary animate-pulse' : 'text-gray-400 group-hover:text-white'}`} />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </form>
          
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"><X size={20} /></button>
        </div>
        
        <div className="h-64 rounded-2xl mb-8 relative overflow-hidden border border-gray-100 dark:border-white/5 z-0">
          <MapContainer center={userPos || [28.6139, 77.2090]} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={document.documentElement.classList.contains('dark')
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
            />
            <MapController center={userPos || (sortedOffices.length > 0 ? sortedOffices[0].pos : [28.6139, 77.2090])} />
            
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  <span className="text-[10px] font-bold text-blue-600">You are here</span>
                </Tooltip>
              </Marker>
            )}

            {sortedOffices.map((office) => (
              <Marker 
                key={office.id} 
                position={office.pos} 
                icon={customIcon(office.color)}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={1} permanent={false}>
                   <div className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold border border-white/10">
                     {office.name}
                   </div>
                </Tooltip>
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{office.type}</p>
                    <p className="text-xs font-bold mb-1">{office.name}</p>
                    <p className="text-[9px] text-gray-500">{office.addr}</p>
                    {(office as any).distance && (
                      <p className="text-[10px] font-bold text-glow-blue mt-2 italic">
                        {(office as any).distance.toFixed(1)} km from you
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {sortedOffices.map((o: any) => (
            <div key={o.id} className={`p-4 bg-white/5 rounded-2xl border transition-all group flex items-center justify-between ${
              o.id === sortedOffices[0].id && userPos ? 'border-primary/40 bg-primary/5' : 'border-white/5'
            }`}>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold dark:text-white group-hover:text-primary transition-colors">{o.name}</h4>
                    {o.id === sortedOffices[0].id && userPos && (
                      <span className="px-2 py-0.5 bg-primary text-white text-[8px] font-black rounded-full uppercase">Nearest</span>
                    )}
                  </div>
                  <p className="text-[10px] text-dash-secondary mt-1">{o.addr}</p>
                </div>
              </div>
              <div className="text-right">
                {o.distance && (
                  <p className="text-[11px] font-black text-primary mb-1">{o.distance.toFixed(1)} km</p>
                )}
                <p className={`text-[9px] font-bold uppercase tracking-widest ${o.status === 'Open' ? 'text-glow-green' : 'text-glow-red'}`}>{o.status}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const QuickActions = ({ language, setView, onEmergencyOpen, onOfficesOpen }: { language: Language, setView: (v: View) => void, onEmergencyOpen: () => void, onOfficesOpen: () => void }) => {
  const actions = [
    { label: 'Report an Issue', icon: Upload, color: 'text-glow-green', bg: 'bg-glow-green/10', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Track Complaint', icon: FileText, color: 'text-glow-blue', bg: 'bg-glow-blue/10', onClick: () => setView('my-complaints') },
    { label: 'Nearby Offices', icon: MapPin, color: 'text-glow-purple', bg: 'bg-glow-purple/10', onClick: onOfficesOpen },
    { label: 'Emergency Help', icon: PhoneCall, color: 'text-glow-red', bg: 'bg-glow-red/10', onClick: onEmergencyOpen },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {actions.map((a, i) => (
        <motion.button
          key={i}
          whileHover={{ y: -5, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={a.onClick}
          className="glass-card rounded-3xl p-5 flex flex-col items-center justify-center text-center gap-3 border border-dash-border hover:border-white/20 transition-all group"
        >
          <div className={`h-12 w-12 rounded-2xl ${a.bg} flex items-center justify-center ${a.color} transition-transform group-hover:rotate-12`}>
            <a.icon size={24} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-dash-text">{a.label}</span>
        </motion.button>
      ))}
    </div>
  );
};


const LiveCivicMonitoringPage = ({ complaints, language, theme, setView, globalPosition, isSearchingLocation }: { 
  complaints: Complaint[], 
  language: Language, 
  theme: Theme, 
  setView: (v: View) => void,
  globalPosition: [number, number],
  isSearchingLocation: boolean
}) => {
    const activeComplaints = complaints.filter(c => c.status !== 'Resolved');
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');
    
    const deptStats = complaints.reduce((acc: any, c) => {
        acc[c.department] = (acc[c.department] || 0) + 1;
        return acc;
    }, {});

    const departments = Object.entries(deptStats).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
    const maxDeptCount = Math.max(...Object.values(deptStats) as number[], 1);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with live pulse */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Live Operation Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        {language === 'hi' ? 'लाइव नागरिक हब' : 'Live Civic Monitor'}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                        Real-time visualization of city infrastructure and social grievances.
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <div className="glass-card px-6 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                        <p className="text-2xl font-black text-blue-600">{activeComplaints.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active</p>
                    </div>
                    <div className="glass-card px-6 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                        <p className="text-2xl font-black text-emerald-500">{resolvedComplaints.length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resolved</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Full Width Map Container */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="h-[600px] rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl relative group">
                        <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center -z-10">
                            <Activity className="text-white/10" size={80} />
                        </div>
                        <div className="relative group h-full">
                          {isSearchingLocation && (
                            <div className="absolute inset-0 z-[2000] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">Searching...</span>
                              </div>
                            </div>
                          )}
                          <LiveMap complaints={complaints} language={language} theme={theme} center={globalPosition} />
                        </div>
                        
                        {/* Map Overlay Stats */}
                        <div className="absolute bottom-8 left-8 right-8 z-[1000] hidden md:flex gap-4">
                            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20 shadow-2xl flex-1 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgent Attention</p>
                                    <p className="text-sm font-bold dark:text-white truncate">Critical power outage reported in Sector 12</p>
                                </div>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20 shadow-2xl flex-1 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <Sparkles size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Success</p>
                                    <p className="text-sm font-bold dark:text-white truncate">Road repair completed at MG Road Junction</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Performance Bar Chart (Custom) */}
                    <div className="glass-card rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-lg font-bold dark:text-white">Departmental Load</h3>
                                <p className="text-[11px] font-medium text-slate-500">Distribution of complaints across city departments.</p>
                            </div>
                            <BarChart3 className="text-blue-500/30" size={32} />
                        </div>
                        
                        <div className="space-y-8">
                            {departments.length > 0 ? departments.map(([name, count]: any, idx) => (
                                <div key={name} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black dark:text-white uppercase tracking-wider">{name}</span>
                                        <span className="text-xs font-black text-blue-500">{count} Cases</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / maxDeptCount) * 100}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                        />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-10 text-center text-slate-500 italic text-sm">No data available to visualize.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Live Pulse Feed */}
                    <div className="glass-card rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col h-full min-h-[600px]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Activity size={18} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">Live Pulse Feed</h3>
                        </div>

                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {complaints.length > 0 ? complaints.slice(0, 10).map((c, i) => (
                                <motion.div 
                                    key={c.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-blue-500/20 transition-all cursor-pointer group"
                                    onClick={() => {
                                        // Navigate to complaint details
                                        setView('complaint-details');
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{c.department}</span>
                                        <span className="text-[8px] font-bold text-slate-400">{c.submittedAt.split('•')[1] || 'Just now'}</span>
                                    </div>
                                    <h4 className="text-xs font-bold dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">{c.subject}</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                                    
                                    <div className="mt-3 flex items-center gap-3">
                                        <div className={`h-1.5 w-1.5 rounded-full ${
                                            c.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`} />
                                        <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">{c.status}</span>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 italic py-20">
                                    <Search size={40} className="mb-4" />
                                    <p className="text-sm">Listening for incoming civic reports...</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                             <button 
                                onClick={() => setView('my-complaints')}
                                className="w-full py-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            >
                                View Detailed History
                            </button>
                        </div>
                    </div>

                    {/* Operational Health Card */}
                    <div className="glass-card rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
                        <Activity className="absolute -right-10 -bottom-10 opacity-10" size={200} />
                        <div className="relative z-10">
                            <h3 className="text-lg font-black uppercase tracking-tighter mb-2">City Health Score</h3>
                            <div className="text-5xl font-black mb-4">94.2<span className="text-xl opacity-50 ml-1">%</span></div>
                            <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                                Current operational efficiency is performing above monthly target. System latency is at 12ms.
                            </p>
                            <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 w-fit">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">All Systems Normal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImpactAnalytics = ({ language, complaints }: { language: Language, complaints: Complaint[] }) => {
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const activeDepts = new Set(complaints.map(c => c.department)).size;
  const citizenRating = complaints.length > 0 ? Math.min(5.0, 4.2 + (resolvedCount * 0.01)).toFixed(1) : '4.8';

  const stats = [
    { label: 'Issues Reported', value: complaints.length, icon: BarChart3, color: 'text-glow-blue', glow: 'glow-icon-blue' },
    { label: 'Issues Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-glow-green', glow: 'glow-icon-green' },
    { label: 'Departments Active', value: activeDepts || 0, icon: Users, color: 'text-glow-purple', glow: 'glow-icon-purple' },
    { label: 'Citizen Rating', value: `${citizenRating}/5`, icon: Award, color: 'text-glow-red', glow: 'glow-icon-red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-dash-secondary">Today's Civic Impact</h3>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-glow-green animate-pulse" />
          <span className="text-[10px] font-bold text-glow-green uppercase tracking-tighter">Live Updates</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-[2rem] p-6 border border-dash-border relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${s.color}`}>
              <s.icon size={48} />
            </div>
            <div className={`h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center ${s.color} ${s.glow} mb-4`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-black dark:text-white mb-1">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-dash-secondary">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


const Dashboard = ({ 
    language, 
    user, 
    activeComplaint, 
    onComplaintSubmit, 
    onViewDetails,
    setView,
    complaints,
    theme,
    globalSearch,
    globalPosition,
    setGlobalPosition,
    globalAddress,
    setGlobalAddress,
    isSearchingLocation
}: { 
    language: Language, 
    user: User, 
    activeComplaint: Complaint | null,
    onComplaintSubmit: (c: Complaint) => void,
    onViewDetails: (id: string) => void,
    setView: (v: View) => void,
    complaints: Complaint[],
    theme: Theme,
    globalSearch?: string,
    globalPosition: [number, number],
    setGlobalPosition: (p: [number, number]) => void,
    globalAddress: string,
    setGlobalAddress: (a: string) => void,
    isSearchingLocation: boolean
}) => {
    const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
    const [isOfficesOpen, setIsOfficesOpen] = useState(false);

    const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
    const [problem, setProblem] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pincode, setPincode] = useState('');
    const address = globalAddress;
    const setAddress = setGlobalAddress;
    const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
    const [showMap, setShowMap] = useState(false);
    const position = globalPosition;
    const setPosition = setGlobalPosition;

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-detect location on mount for better user experience
    useEffect(() => {
        detectLocation();
    }, []);

    // Sync global search with address field for integrated experience
    useEffect(() => {
        if (globalSearch !== undefined) {
            setAddress(globalSearch);
        }
    }, [globalSearch]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log("📸 [DASHBOARD DEBUG] File selected:", file.name, "Size:", file.size, "Type:", file.type);
            setUploadedFile(file);
            console.log("✅ [DASHBOARD DEBUG] image state updated with file.");
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocationStatus('detecting');
        setShowMap(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setPosition([lat, lon]);
                setLocationStatus('detected');
                
                // Fetch address for current location
                try {
                  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                  const data = await response.json();
                  if (data && data.display_name) {
                    setAddress(data.display_name);
                  }
                } catch (e) { console.error(e); }
            },
            () => {
              setLocationStatus('error');
              setShowMap(true); 
            },
            { timeout: 10000 }
        );
    };

    const searchLocation = async () => {
      if (!address) return;
      setLocationStatus('detecting');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPosition([lat, lon]);
          setLocationStatus('detected');
          setShowMap(true);
          // Update address with the formal name from search result
          setAddress(data[0].display_name);
        } else {
          alert('Location not found. Please try a more specific address.');
          setLocationStatus('error');
        }
      } catch (e) {
        console.error('Search failed:', e);
        setLocationStatus('error');
      }
    };


    const handleSubmit = async () => {
        if (!problem && !uploadedFile) return;
        setIsAnalyzing(true);
        console.log("🚀 [DASHBOARD DEBUG] Starting complaint submission process...");
        
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const getBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            };

            let imgBase64 = undefined;
            if (uploadedFile) {
                console.log("📸 [DASHBOARD DEBUG] Converting image to Base64...");
                imgBase64 = await getBase64(uploadedFile);
            }

            const newComplaint: Complaint = {
                id: `CC-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                subject: problem ? (problem.substring(0, 50) + (problem.length > 50 ? '...' : '')) : "Image-only Complaint",
                description: problem || "Visual complaint submission with no text description.",
                image: imgBase64,
                imageFile: uploadedFile || undefined,
                pincode: pincode,
                address: address,
                location: { lat: position[0], lng: position[1] },
                category: '', 
                priority: '', 
                department: '', 
                estimatedTime: '', 
                submittedAt: `${dateStr} • ${timeStr}`,
                status: 'Submitted'
            };

            console.log("📤 [DASHBOARD DEBUG] Sending complaint to onComplaintSubmit...");
            await onComplaintSubmit(newComplaint);
            
            console.log("✅ [DASHBOARD DEBUG] Submission complete.");
            setProblem('');
            setUploadedFile(null);
            setPincode('');
        } catch (error) {
            console.error("❌ [DASHBOARD DEBUG] Submission failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };


    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'Danger': return 'bg-red-500 text-white';
            case 'Urgent': return 'bg-orange-500 text-white';
            case 'Important': return 'bg-yellow-500 text-black';
            default: return 'bg-green-500 text-white';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Welcome Banner - Refined Rectangular Design */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-blue-700 to-blue-900 dark:from-[#0d0f1a] dark:to-[#1a1c2e] border border-white/5 p-6 text-white shadow-2xl min-h-[160px] flex items-center"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-widest">
                            <LayoutDashboard size={10} /> {language === 'hi' ? 'डैशबोर्ड ओवरव्यू' : 'Dashboard Overview'}
                        </div>
                        <h1 className="text-3xl font-black tracking-tight leading-none">
                            {language === 'hi' ? `वापसी पर स्वागत है, ${user?.name || 'नागरिक'}` : `Welcome back, ${user?.name || 'Citizen'}`}
                        </h1>
                        <p className="text-gray-400 text-xs max-w-md leading-relaxed font-medium">
                            {language === 'hi' 
                                ? 'आज अपने शहर में सकारात्मक बदलाव लाने के लिए अपनी चिंताओं को दर्ज करें।' 
                                : 'Voice your concerns today to bring a positive change in your city.'}
                        </p>
                    </div>
                    <div className="relative group shrink-0">
                        <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                        <div className="relative h-28 w-64 overflow-hidden rounded-xl">
                            <img 
                                src="/image1.png" 
                                alt="City Vista" 
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" 
                                style={{ 
                                    maskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)',
                                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%, black 80%, transparent)'
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
            </motion.div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">{language === 'hi' ? 'नया मुद्दा दर्ज करें' : 'Report New Issue'}</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{language === 'hi' ? 'AI बहुभाषा तैयार' : 'AI Multi-language Ready'}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">{t('describe_problem')}</label>
                            <span className="text-[10px] font-medium text-slate-400 italic">{language === 'hi' ? 'अंग्रेजी, हिंदी और अन्य का समर्थन करता है...' : 'Supports English, Hindi, and more...'}</span>
                        </div>
                        <textarea 
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder={language === 'hi' ? "उदाहरण: सड़क पर गड्ढा है..." : "Example: There is a pothole on the road..."}
                            className="w-full min-h-[140px] rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-6 text-sm outline-none transition-all focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5"
                        />

                        {/* Priority selection removed - AI will handle this */}

                        
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative flex-1 group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 group-focus-within:text-primary transition-colors">
                                    <MapPin size={18} />
                                    <div className="h-4 w-[1px] bg-gray-200 dark:bg-slate-800" />
                                </div>
                                <input 
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder={language === 'hi' ? 'अपना पता यहाँ लिखें या खोजें...' : 'Enter or search address...'} 
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        searchLocation();
                                      }
                                    }}
                                    className="w-full pl-14 pr-32 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-primary outline-none transition-all dark:text-white" 
                                />
                                <div className="absolute right-2 top-2 flex gap-1">
                                  <button 
                                      onClick={searchLocation}
                                      className="h-10 px-3 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                                  >
                                      <Search size={14} /> {locationStatus === 'detecting' ? '...' : 'Search'}
                                  </button>
                                  <button 
                                      onClick={detectLocation}
                                      className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                      title="Detect my current location"
                                  >
                                      <Navigation size={16} />
                                  </button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-xs font-bold transition-all ${
                                        uploadedFile ? 'bg-green-50 border-green-200 text-green-600' : 'border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Upload size={16} /> {uploadedFile ? t('photo_added') : t('photos')}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/jpg, image/webp"
                                    onChange={handleFileUpload} 
                                />
                                
                                <div className="w-32">
                                    <input 
                                        type="text"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={async (e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setPincode(val);
                                            if (val.length === 6) {
                                                try {
                                                    const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${val}&country=India&format=json`);
                                                    const data = await response.json();
                                                    if (data && data.length > 0) {
                                                        const { lat, lon } = data[0];
                                                        setPosition([parseFloat(lat), parseFloat(lon)]);
                                                        setLocationStatus('detected');
                                                        setShowMap(true);
                                                    }
                                                } catch (error) {
                                                    console.error("Error fetching pincode location:", error);
                                                }
                                            }
                                        }}
                                        placeholder={t('pincode')} 
                                        className="w-full h-full px-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-xs font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-primary outline-none transition-all dark:text-white text-center" 
                                    />
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                          {showMap && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 overflow-hidden"
                            >
                                <LocationPicker position={position} setPosition={setPosition} setAddress={setAddress} theme={theme} />
                            </motion.div>
                          )}
                        </AnimatePresence>




                        <button 
                            disabled={isAnalyzing}
                            onClick={handleSubmit} 
                            className="mt-8 w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('ai_analyzing')}
                                </>
                            ) : t('submit')}
                        </button>
                    </div>

                    {/* Quick Actions & Impact Section */}
                    <div className="space-y-12 pt-4">
                        <QuickActions 
                            language={language} 
                            setView={setView} 
                            onEmergencyOpen={() => setIsEmergencyOpen(true)}
                            onOfficesOpen={() => setIsOfficesOpen(true)}
                        />
                        
                        {/* Live Civic Map Section */}
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <MapPin size={16} />
                                 </div>
                                 <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-dash-text">Live Civic Monitoring</h3>
                                    <p className="text-[10px] font-medium text-dash-secondary">Real-time status of reported issues in your area</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <button 
                                    onClick={() => setView('monitoring')}
                                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
                                 >
                                    View Full Monitor
                                 </button>
                                 <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-glow-blue" />
                                    <span className="text-[8px] font-black uppercase text-gray-500">Active</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-glow-green" />
                                    <span className="text-[8px] font-black uppercase text-gray-500">Resolved</span>
                                 </div>
                              </div>
                           </div>
                           <div className="relative group">
                             {isSearchingLocation && (
                               <div className="absolute inset-0 z-[2000] bg-black/20 backdrop-blur-[2px] flex items-center justify-center rounded-[2.5rem]">
                                 <div className="flex flex-col items-center gap-2">
                                   <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                   <span className="text-[10px] font-black uppercase text-white tracking-widest">Searching...</span>
                                 </div>
                               </div>
                             )}
                             <LiveMap complaints={complaints} language={language} theme={theme} center={position} />
                           </div>
                        </div>

                        <ImpactAnalytics language={language} complaints={complaints} />
                    </div>
                </div>

                {/* Real-time Tracking Card - Redesigned */}
                <div className="space-y-0">
                    {isAnalyzing ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-blue-500/30 p-8 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={40} className="text-primary animate-pulse" />
                            </div>
                            <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 relative">
                                <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <Cpu size={32} className="text-primary animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary">{language === 'hi' ? 'AI विश्लेषण जारी है' : 'Analyzing with AI...'}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                    {language === 'hi' ? 'हम आपके मुद्दे को समझ रहे हैं और सर्वोत्तम विभाग को सौंप रहे हैं' : 'Identifying your issue & assigning the best department'}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.div 
                                        key={i}
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                        className="h-1 w-1 rounded-full bg-primary"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : activeComplaint ? (
                        <div className="space-y-6">
                            <AIRecognitionCard result={activeComplaint} />
                            <TrackComplaintCard result={activeComplaint} onViewDetails={onViewDetails} />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden group h-full">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                                    <FileText size={24} />
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock size={16} className="text-primary" />
                                {language === 'hi' ? 'सक्रिय ट्रैकिंग' : 'Active Tracking'}
                            </h3>
                            
                            <div className="py-12 text-center space-y-4 h-full flex flex-col justify-center">
                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 opacity-50">
                                    <LayoutDashboard size={32} className="text-slate-300" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                    {language === 'hi' ? 'कोई सक्रिय शिकायत नहीं' : 'No Active Grievance'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <NearbyOfficesModal 
                isOpen={isOfficesOpen} 
                onClose={() => setIsOfficesOpen(false)} 
                language={language} 
            />
        </div>
    );
};

const GovSchemesPage = ({ language, schemes }: { language: Language, schemes: Scheme[] }) => {
    const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
    const [filter, setFilter] = useState('All');
    const [selectedScheme, setSelectedScheme] = useState<any>(null);

    // Unified filtering logic for real-time and static schemes
    const allMerged = [...(Array.isArray(schemes) ? schemes : []), ...SCHEMES];
    
    // Remove duplicates by title to ensure clean UI
    const uniqueSchemes = allMerged.filter((scheme, index, self) =>
        index === self.findIndex((t) => t.title === scheme.title)
    );

    const displaySchemes = filter === 'All' 
        ? uniqueSchemes 
        : uniqueSchemes.filter(s => (s.type || 'Central') === filter);


    // Safely get a unique ID for a scheme
    const getSchemeId = (scheme: Scheme, fallbackIdx: number) => {
        return scheme.id || `rt-${fallbackIdx}-${scheme.title.replace(/\s+/g, '-').toLowerCase()}`;
    };

    return (
        <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('schemes_title')}</h1>
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl border dark:border-slate-800">
                    {['All', 'Central', 'State'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            {f === 'All' ? t('filter_all') : f === 'Central' ? t('filter_central') : t('filter_state')}
                        </button>
                    ))}
                </div>
             </div>

             {/* Unified Discovery Hub */}
             <div className="mt-8">
               <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                     <ShieldCheck size={24} className="text-primary" />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic">Scheme Discovery Hub</h2>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified & Synced with National Portals</p>
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Combined and Filtered Schemes */}
                 {displaySchemes.map((scheme, idx) => {
                    const sid = getSchemeId(scheme, idx);
                    const isRealTime = (scheme as any).source !== undefined || (sid.toString().startsWith('live'));
                    
                    return (
                      <motion.div
                        layoutId={`scheme-${sid}`}
                        key={`${sid}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedScheme({
                          ...scheme,
                          id: sid,
                          type: scheme.type || 'Central'
                        })}
                        className="group relative flex flex-col p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden"
                      >
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-all" />
                        
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider w-fit">
                              {(scheme.type || 'Central') === 'Central' ? t('filter_central') : t('filter_state')}
                            </span>
                            {isRealTime && (
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Verified
                              </span>
                            )}
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                            <ChevronRight size={16} />
                          </div>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors leading-tight">
                          {scheme.title}
                        </h3>
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed font-medium">
                          {scheme.description}
                        </p>

                        <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Authority</span>
                            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                              {(scheme as any).ministry || 'Govt of India'}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details
                          </span>
                        </div>
                      </motion.div>
                    );
                 })}

                 {displaySchemes.length === 0 && (
                   <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                     <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search size={24} className="text-slate-300" />
                     </div>
                     <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight">No schemes found for this category.</p>
                     <p className="text-xs text-slate-400 mt-1">Try switching between Central and State filters.</p>
                   </div>
                 )}
               </div>
             </div>

             <AnimatePresence>
                {selectedScheme && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedScheme(null)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            layoutId={`scheme-${selectedScheme.id}`}
                            className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-10 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar border dark:border-slate-800"
                        >
                            <button onClick={() => setSelectedScheme(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"><X size={20}/></button>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded-md">
                                    {(selectedScheme.type || 'Central') === 'Central' ? t('filter_central') : t('filter_state')} {t('schemes')}
                                </span>
                                {selectedScheme.category && (
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">
                                        {selectedScheme.category}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold mb-8 dark:text-white leading-tight">{selectedScheme.title}</h2>
                            
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('about_scheme')}</h4>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">{selectedScheme.description}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('key_benefits')}</h4>
                                         <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">{selectedScheme.benefits || 'Multiple socio-economic benefits as per government guidelines.'}</p>
                                    </div>
                                    <div>
                                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('eligibility')}</h4>
                                         <p className="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap">{selectedScheme.eligibility || 'Check official government portal for detailed eligibility criteria.'}</p>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                                     <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('how_to_apply')}</h4>
                                     <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed mb-4">{selectedScheme.howToApply || 'Application process usually involves registration on the official portal or visiting the nearest Common Service Centre (CSC).'}</p>
                                     <div className="flex flex-wrap gap-4">
                                         {selectedScheme.link && (
                                             <a 
                                                href={selectedScheme.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                            >
                                                Visit Official Portal <ExternalLink size={14} />
                                            </a>
                                         )}
                                         <a 
                                             href={selectedScheme.registrationLink || selectedScheme.link || '#'} 
                                             target="_blank" 
                                             rel="noopener noreferrer" 
                                             className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                         >
                                             {t('register_now')} <ArrowRight size={14} />
                                         </a>
                                     </div>
                                </div>
                                {selectedScheme.ministry && (
                                    <div className="pt-4 border-t dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                                        <span>Ministry</span>
                                        <span className="text-gray-600 dark:text-gray-300">{selectedScheme.ministry}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
             </AnimatePresence>
        </div>
    );
};

const GovDonationsPage = ({ language, donations }: { language: Language, donations: Donation[] }) => {
    const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
    
    // Fallback if no real-time donations are fetched yet
    const displayDonations = (Array.isArray(donations) && donations.length > 0) ? donations : DONATIONS;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">{t('donations_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm font-medium leading-relaxed">{t('donations_desc')}</p>
                </div>
                {donations.length > 0 && (
                   <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-glow-green/10 border border-glow-green/20">
                      <div className="h-2 w-2 rounded-full bg-glow-green animate-pulse" />
                      <span className="text-[10px] font-black text-glow-green uppercase tracking-widest">Real-time Verified</span>
                   </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayDonations.map((org: any) => (
                    <motion.div 
                        key={org.id} 
                        whileHover={{ y: -8 }}
                        className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#0A0C1B] border border-gray-100 dark:border-white/5 shadow-soft transition-all hover:shadow-2xl hover:border-primary/20"
                    >
                        <div className="h-44 bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white relative overflow-hidden">
                             <HandCoins size={80} className="opacity-10 absolute -right-4 -bottom-4 rotate-12" />
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
                             <div className="relative z-10 flex flex-col items-center">
                                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3">
                                   <HeartHandshake size={32} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{org.category || org.purpose}</span>
                             </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">{org.name}</h3>
                                {org.isVerified && (
                                    <div className="shrink-0 h-6 w-6 rounded-full bg-glow-green/10 flex items-center justify-center text-glow-green border border-glow-green/20" title="Verified Fund">
                                        <ShieldCheck size={14} />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-8 font-medium line-clamp-3 italic">"{org.description}"</p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-y border-gray-50 dark:border-white/5">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tax Benefit</span>
                                    <span className="text-[10px] font-black text-glow-green uppercase">Section 80G</span>
                                </div>
                                
                                <a 
                                    href={org.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full"
                                >
                                    <button className="w-full py-4 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                                        {t('view_org')} <ExternalLink size={14} />
                                    </button>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {displayDonations.length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300 mx-auto">
                        <Activity size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No verified donations found at this time.</p>
                </div>
            )}
        </div>
    )
}

// --- Animal Welfare Components ---

const RescueHero = ({ language, complaints }: { language: Language, complaints: Complaint[] }) => {
  const animalComplaints = complaints.filter(c => 
    (c.category && c.category.toLowerCase().includes('animal')) || 
    (c.department && (c.department.toLowerCase().includes('veterinary') || c.department.toLowerCase().includes('animal')))
  );
  const rescuedCount = animalComplaints.filter(c => c.status === 'Resolved').length;
  // Mock count for NGOs/Hospitals based on "area"
  const nearbyNGOs = 12; 
  const hasData = animalComplaints.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#060B16] border border-slate-200 dark:border-glow-green/20 shadow-[0_0_40px_rgba(34,197,94,0.1)] min-h-[300px] flex items-center mb-8 glass-card group"
    >
      {/* Full Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/image/image6.jpeg" 
          alt="Rescue Hero" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105" 
        />
        {/* Dark Overlay & Soft Green Lighting */}
        <div className="absolute inset-0 bg-slate-900/60 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.1),transparent_70%)] z-10" />
      </div>
      
      <div className="relative z-20 px-10 py-8 max-w-2xl space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glow-green/10 border border-glow-green/20 text-glow-green text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
             <Activity size={10} className="animate-pulse" /> Emergency Rescue Portal
          </div>
          <h1 className="text-4xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {language === 'hi' ? 'पशु कल्याण' : 'Animal Welfare'}
          </h1>
        </div>

        <p className="text-gray-100 text-sm leading-relaxed max-w-sm font-medium">
          {language === 'hi' 
            ? 'घायल, लावारिस या लुप्तप्राय जानवरों की रिपोर्ट करें और उन्हें समय पर बचाने में मदद करें।' 
            : 'Connecting citizens with rescue NGOs. Your report could be the difference between life and death for a voiceless soul.'}
        </p>
        
        <div className="flex items-center gap-8 pt-2">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-glow-green/5 flex items-center justify-center text-glow-green/60 border border-glow-green/10">
                <PawPrint size={18} />
             </div>
             <div className="space-y-0.5">
               <p className="text-xl font-black text-white">
                 {hasData ? rescuedCount : "0"}
               </p>
               <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">Animals Saved</p>
             </div>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10" />
          
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-glow-blue/5 flex items-center justify-center text-glow-blue/60 border border-glow-blue/10">
                <Building2 size={18} />
             </div>
             <div className="space-y-0.5">
               <p className="text-xl font-black text-white">
                 {nearbyNGOs}
               </p>
               <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest">NGOs & Hospitals Nearby</p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Floating Glowing Icons for Premium Feel */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <motion.div animate={{ y: [0, -10, 0], opacity: [0.1, 0.3, 0.1] }} transition={{ repeat: Infinity, duration: 6 }} className="absolute top-[15%] right-[10%] text-glow-green/20">
           <Ambulance size={40} />
        </motion.div>
        <motion.div animate={{ y: [0, 10, 0], opacity: [0.1, 0.2, 0.1] }} transition={{ repeat: Infinity, duration: 8, delay: 1 }} className="absolute bottom-[20%] right-[15%] text-glow-blue/10">
           <Bone size={32} />
        </motion.div>
      </div>
    </motion.div>
  );
};

const AIRescueAssessment = ({ result, onViewDetails }: { result: any, onViewDetails: (id: string) => void }) => {
  if (!result) return (
    <div className="glass-card rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
       <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
         <Cpu size={32} />
       </div>
       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Submit a report to see<br/>AI Rescue Assessment</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2rem] p-6 border border-glow-green/20 relative overflow-hidden bg-white dark:bg-[#060B16]"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 bg-glow-green/5 blur-3xl rounded-full" />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center text-glow-green shadow-[0_0_15px_rgba(34,197,94,0.1)] border border-slate-200 dark:border-glow-green/20">
            <Cpu size={18} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-glow-green">AI Assessment</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-glow-green text-white text-[7px] font-black uppercase">Active</span>
      </div>
      
      <div className="space-y-4">
        {[
          { label: 'Detected Issue', value: result.visualCategory || result.category || 'Analyzing...', color: 'text-glow-green', icon: PawPrint, iconColor: 'text-glow-green/50' },
          { label: 'Urgency', value: result.priority || 'High', color: result.priority === 'Critical' || result.priority === 'Danger' ? 'text-red-500' : 'text-orange-400', icon: ShieldAlert, iconColor: 'text-glow-green/50' },
          { label: 'Assigned Unit', value: result.department || 'Animal Welfare', color: 'text-glow-green', icon: Building2, iconColor: 'text-glow-green/50' },
          { label: 'Risk Level', value: result.visualRiskLevel || 'Calculating...', color: 'text-glow-green', icon: Activity, iconColor: 'text-glow-green/50' },
          { label: 'Est. Resolution', value: result.estimatedTime || 'Pending', color: 'text-glow-green', icon: Clock, iconColor: 'text-glow-green/50' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
              <item.icon size={14} className={item.iconColor} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </div>
            <span className={`text-[9px] font-black ${item.color} text-right`}>{item.value}</span>
          </div>
        ))}
      </div>

      {(result.aiSummary || result.aiRemarks || result.safetyPrecautions || result.imageSummary) && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4 relative z-10">
          {result.aiSummary && (
             <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">AI Summary</p>
                <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed italic border-l-2 border-glow-green/30 pl-3">{result.aiSummary}</p>
             </div>
          )}
          {result.imageSummary && (
             <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-glow-blue/60">Visual Analysis</p>
                <p className="text-[10px] text-glow-blue leading-relaxed font-medium bg-glow-blue/5 p-3 rounded-xl border border-glow-blue/10">{result.imageSummary}</p>
             </div>
          )}
          {result.aiRemarks && (
             <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-glow-green/60">Official Remarks</p>
                <p className="text-[10px] text-glow-green leading-relaxed font-bold bg-glow-green/5 p-3 rounded-xl border border-glow-green/10">{result.aiRemarks}</p>
             </div>
          )}
          {result.safetyPrecautions && (
             <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={10} className="text-orange-500" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-orange-500">Safety Precautions</p>
                </div>
                <p className="text-[9px] text-orange-600 dark:text-orange-300 italic leading-relaxed">{result.safetyPrecautions}</p>
             </div>
          )}
        </div>
      )}
      
      <button 
        onClick={() => onViewDetails(result.id)}
        className="w-full mt-8 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-glow-green hover:text-white hover:border-glow-green transition-all duration-300 shadow-lg"
      >
        View Detailed Analysis
      </button>
    </motion.div>
  );
};

const AISocialAssessment = ({ result, onViewDetails }: { result: any, onViewDetails: (id: string) => void }) => {
  if (!result) return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 bg-white dark:bg-slate-950">
       <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
         <Cpu size={32} />
       </div>
       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Submit a report to see<br/>AI Social Assessment</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2.5rem] p-6 border border-pink-500/20 relative overflow-hidden bg-white dark:bg-slate-950"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 bg-pink-500/5 blur-3xl rounded-full" />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] border border-slate-200 dark:border-pink-500/20">
            <Cpu size={18} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">AI Social Intelligence</h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[7px] font-black uppercase tracking-widest">Active</span>
      </div>
      
      <div className="space-y-4">
        {[
          { label: 'Category', value: result.category || 'Analyzing...', color: 'text-pink-500', icon: Heart, iconColor: 'text-pink-500/50' },
          { label: 'Urgency', value: result.priority || 'High', color: result.priority === 'Critical' || result.priority === 'Danger' ? 'text-red-500' : 'text-orange-400', icon: ShieldAlert, iconColor: 'text-pink-500/50' },
          { label: 'Dept.', value: result.department || 'Social Help', color: 'text-pink-500', icon: Building2, iconColor: 'text-pink-500/50' },
          { label: 'Risk level', value: result.visualRiskLevel || 'Calculating...', color: 'text-pink-500', icon: Activity, iconColor: 'text-pink-500/50' },
          { label: 'ETA', value: result.estimatedTime || 'Pending', color: 'text-pink-500', icon: Clock, iconColor: 'text-pink-500/50' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-gray-300 transition-colors">
              <item.icon size={14} className={item.iconColor} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </div>
            <span className={`text-[9px] font-black ${item.color} text-right uppercase tracking-widest`}>{item.value}</span>
          </div>
        ))}
      </div>

      {(result.aiSummary || result.aiRemarks || result.imageSummary) && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 space-y-4 relative z-10">
          {result.aiSummary && (
             <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Contextual Summary</p>
                <p className="text-[10px] text-gray-800 dark:text-gray-400 leading-relaxed italic border-l-2 border-pink-500/30 pl-3">{result.aiSummary}</p>
             </div>
          )}
          {result.aiRemarks && (
             <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
                <p className="text-[8px] font-black uppercase tracking-widest text-pink-500/60 mb-1">AI Recommendation</p>
                <p className="text-[10px] text-pink-600 dark:text-pink-400 leading-relaxed font-bold">{result.aiRemarks}</p>
             </div>
          )}
        </div>
      )}
      
      <button 
        onClick={() => onViewDetails(result.id)}
        className="w-full mt-8 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-300 shadow-lg"
      >
        View Full Report
      </button>
    </motion.div>
  );
};

const LiveRescueTracker = ({ complaint, onViewDetails }: { complaint: any, onViewDetails: (id: string) => void }) => {
  const hasComplaint = !!complaint;
  const timelineSteps = complaint ? generateTimeline(complaint.status || 'Submitted', complaint.submittedAt || '') : [
    { label: 'Report Received', status: 'pending' as const, date: '--', time: '--', description: 'Waiting for report submission.' },
    { label: 'Rescue Team Assigned', status: 'pending' as const, date: '--', time: '--', description: 'Team will be assigned after report.' },
    { label: 'Rescue Started', status: 'pending' as const, date: '--', time: '--', description: 'Real-time tracking will start.' },
    { label: 'Medical Care', status: 'pending' as const, date: '--', time: '--', description: 'Professional vet care.' },
    { label: 'Rescued Safely', status: 'pending' as const, date: '--', time: '--', description: 'Life saved.' },
  ];

  return (
    <div className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 flex flex-col min-h-[300px] flex-1 bg-white dark:bg-[#060B16]">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center text-glow-blue shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-slate-200 dark:border-glow-blue/20">
          <Activity size={18} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-glow-blue">Live Tracker</h3>
      </div>
      
      <div className="relative pl-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2 max-h-[250px]">
        <div className="absolute left-[15px] top-[10px] bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 rounded-full" />
        
        {timelineSteps.map((step: any, i: number) => (
          <div key={i} className="relative">
            <div className={`absolute -left-[24px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
              step.status === 'completed' ? 'bg-glow-green border-glow-green shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
              step.status === 'active' ? 'bg-white dark:bg-[#060B16] border-glow-blue shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-white dark:bg-[#060B16] border-slate-300 dark:border-slate-700'
            }`}>
              {step.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
              {step.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-glow-blue animate-pulse" />}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h4 className={`text-[9px] font-black leading-none mb-1 uppercase tracking-widest ${step.status === 'pending' ? 'text-gray-400' : 'text-slate-900 dark:text-white'}`}>{step.label}</h4>
                <p className="text-[8px] text-gray-500 font-medium leading-relaxed truncate">{step.description}</p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-[9px] font-black text-slate-900 dark:text-white">{step.date}</p>
                <p className="text-[7px] text-gray-500 font-medium">{step.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => hasComplaint && onViewDetails(complaint.id)}
        disabled={!hasComplaint}
        className="w-full mt-6 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        Track Details
      </button>
    </div>
  );
};

const RescueSupportPortal = ({ setView }: { setView: (v: View) => void }) => {
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  const features = [
    { 
      label: 'Nearby Rescue NGOs', 
      status: 'Live Map', 
      color: 'text-glow-green', 
      bg: 'bg-glow-green/10', 
      icon: Building2, 
      desc: 'Connect with local organizations', 
      details: 'Active NGOs in your area: 1. Paws Care Foundation (+91 98765 43210), 2. Stray Relief Society (+91 87654 32109), 3. Animal Friends NGO (+91 76543 21098). Click to view markers on the live map.' 
    },
    { 
      label: 'Emergency Helpline', 
      status: '24/7 Active', 
      color: 'text-red-400', 
      bg: 'bg-red-400/10', 
      icon: PhoneCall, 
      desc: 'Direct access to specialists', 
      details: 'Animal Emergency Numbers: Govt Rescue: 1962, Wildlife Help: 1800-425-0014, Pet Hospital: +91 99887 76655. Call immediately for critical injuries.' 
    },
    { 
      label: 'Veterinary Partners', 
      status: 'Verified', 
      color: 'text-glow-blue', 
      bg: 'bg-glow-blue/10', 
      icon: Heart, 
      desc: 'Network of support clinics', 
      details: 'Our verified partners: [Blue Cross Veterinary](https://bluecross.org), [Delhi Animal Hospital](https://dah.gov.in), [Pet Clinic & NGO](https://petcare.com). Click any partner to visit their official website.' 
    },
    { 
      label: 'Rescue Tracking', 
      status: 'Real-time', 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10', 
      icon: Activity, 
      desc: 'Go to My Complaints', 
      action: () => setView('my-complaints'),
      details: 'Click here to view all your submitted rescue reports and their live status in the My Complaints section.' 
    },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2 mb-2">
         <Shield size={14} className="text-glow-green/60" />
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Rescue Support Portal</h3>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <button 
              key={i} 
              onClick={() => f.action ? f.action() : setSelectedFeature(f)}
              className="glass-card rounded-[1.5rem] p-5 border border-slate-200 dark:border-white/5 hover:border-glow-green/30 transition-all group text-left flex flex-col h-full bg-white dark:bg-[#060B16] hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-4 mb-3 shrink-0">
                <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center ${f.color} transition-transform group-hover:rotate-12 shrink-0 border border-slate-200 dark:border-white/5 shadow-lg`}>
                   <f.icon size={18} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-2">
                     <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{f.label}</p>
                   </div>
                   <p className="text-[9px] font-bold text-gray-500 mt-0.5">{f.status}</p>
                </div>
              </div>
              <p className="text-[10px] font-medium text-gray-400 leading-tight line-clamp-2 mt-auto group-hover:text-gray-500">{f.desc}</p>
            </button>
          ))}
       </div>

       <AnimatePresence>
         {selectedFeature && (
           <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="glass-card rounded-[2.5rem] w-full max-w-md p-8 border border-glow-green/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white dark:bg-[#060B16]"
             >
               <div className="flex justify-between items-start mb-6">
                 <div className={`h-14 w-14 rounded-2xl ${selectedFeature.bg} flex items-center justify-center ${selectedFeature.color} shadow-lg border border-slate-200 dark:border-white/5`}>
                   <selectedFeature.icon size={28} />
                 </div>
                 <button onClick={() => setSelectedFeature(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-slate-900 dark:hover:text-white"><X size={24} /></button>
               </div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedFeature.label}</h2>
               <div className="flex items-center gap-2 mb-6">
                  <div className={`h-2 w-2 rounded-full ${selectedFeature.color} animate-pulse`} />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${selectedFeature.color}`}>{selectedFeature.status}</p>
               </div>
               <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 whitespace-pre-line">
                 {selectedFeature.label === 'Veterinary Partners' ? (
                    <>
                      Our verified partners:<br />
                      • <a href="https://bluecross.org" target="_blank" className="text-glow-blue underline">Blue Cross Veterinary</a><br />
                      • <a href="https://dah.gov.in" target="_blank" className="text-glow-blue underline">Delhi Animal Hospital</a><br />
                      • <a href="https://petcare.com" target="_blank" className="text-glow-blue underline">Pet Clinic & NGO</a><br />
                      Click any link to visit their official website.
                    </>
                 ) : selectedFeature.details}
               </p>
               <button 
                 onClick={() => setSelectedFeature(null)}
                 className="w-full py-4 bg-glow-green text-white font-black rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-glow-green/20"
               >
                 Close
               </button>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
};

const AnimalTodayImpact = ({ complaints }: { complaints: Complaint[] }) => {
  const animalComplaints = complaints.filter(c => 
    (c.category && c.category.toLowerCase().includes('animal')) || 
    (c.department && (c.department.toLowerCase().includes('veterinary') || c.department.toLowerCase().includes('animal')))
  );
  const rescuedCount = animalComplaints.filter(c => c.status === 'Resolved').length;
  const inProgressCount = animalComplaints.filter(c => c.status === 'In Progress').length;
  const hasData = animalComplaints.length > 0;

  const successRate = hasData ? Math.round((rescuedCount / animalComplaints.length) * 100) : 0;
  
  const stats = [
    { label: 'Total Reports', value: hasData ? animalComplaints.length : "0", icon: MessageSquare, color: 'text-glow-blue', change: hasData ? `Active: ${inProgressCount}` : 'No records' },
    { label: 'Animals Rescued', value: hasData ? rescuedCount : "0", icon: PawPrint, color: 'text-glow-green', change: hasData ? 'Successfully resolved' : 'Waiting' },
    { label: 'Success Rate', value: hasData ? `${successRate}%` : "0%", icon: BarChart3, color: 'text-emerald-400', change: 'Impact %' },
    { label: 'Citizen Rating', value: hasData ? '4.9/5' : "N/A", icon: Award, color: 'text-orange-400', change: 'Community trust' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <BarChart3 size={14} className="text-glow-green/60" />
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Today's Impact</h3>
       </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:border-glow-green/20 transition-all bg-white dark:bg-[#060B16]">
            <div className={`absolute top-0 right-0 p-4 opacity-[0.03] ${s.color} group-hover:opacity-10 transition-opacity`}>
              <s.icon size={40} />
            </div>
            <div className={`h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center ${s.color} mb-4 border border-slate-200 dark:border-white/5 shadow-inner`}>
              <s.icon size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{s.label}</p>
            <p className={`text-[8px] font-bold ${s.color} opacity-60`}>{s.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnimalWelfarePage = ({ language, complaints, onComplaintSubmit, onViewDetails, setView, theme }: { language: Language, complaints: Complaint[], onComplaintSubmit: (c: Complaint) => void, onViewDetails: (id: string) => void, setView: (v: View) => void, theme: Theme }) => {
    const [problem, setProblem] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [address, setAddress] = useState('');
    const [showMap, setShowMap] = useState(true);
    const [position, setPosition] = useState<[number, number] | null>([28.6139, 77.2090]);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        detectLocation();
    }, []);

    const animalComplaints = complaints.filter(c => 
    (c.category && c.category.toLowerCase().includes('animal')) || 
    (c.department && (c.department.toLowerCase().includes('veterinary') || c.department.toLowerCase().includes('animal')))
  );
    const latestAnimalRescue = animalComplaints[0] || null;

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocationStatus('detecting');
        setShowMap(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setPosition([lat, lon]);
                setLocationStatus('detected');
                
                try {
                  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                  const data = await response.json();
                  if (data && data.display_name) {
                    setAddress(data.display_name);
                  }
                } catch (e) { console.error(e); }
            },
            () => {
              setLocationStatus('error');
              setShowMap(true);
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!problem && !uploadedFile) return;
        setIsAnalyzing(true);
        
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const getBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            };

            let imgBase64 = undefined;
            if (uploadedFile) {
                imgBase64 = await getBase64(uploadedFile);
            }

            const newComplaint: Complaint = {
                id: `RW-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                subject: problem ? (problem.substring(0, 50) + (problem.length > 50 ? '...' : '')) : "Animal Rescue Request",
                description: problem || "Visual animal rescue request with no text description.",
                image: imgBase64,
                imageFile: uploadedFile || undefined,
                pincode: '000000',
                address: address || 'Locating...',
                location: position ? { lat: position[0], lng: position[1] } : undefined,
                category: 'Animal Welfare', 
                priority: 'High', 
                department: 'Animal Welfare', 
                estimatedTime: '3 - 5 Working Days', 
                submittedAt: `${dateStr} • ${timeStr}`,
                status: 'Submitted'
            };

            await onComplaintSubmit(newComplaint);
            
            setProblem('');
            setUploadedFile(null);
            setAddress('');
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <RescueHero language={language} complaints={complaints} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-12">
                   <div className="glass-card rounded-[2.5rem] p-8 border border-glow-green/30 relative overflow-hidden shadow-[0_0_25px_rgba(34,197,94,0.05)] bg-white dark:bg-[#060B16]">
                      <div className="absolute -top-24 -left-24 h-48 w-48 bg-glow-green/5 blur-3xl rounded-full" />
                      
                      <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center text-glow-green shadow-[0_0_15px_rgba(34,197,94,0.1)] border border-slate-200 dark:border-glow-green/20">
                          <PawPrint size={18} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-glow-green drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]">Report an Animal in Need</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Upload Photo</label>
                           <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="h-48 w-full rounded-[2rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-gray-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 hover:border-glow-green/40 transition-all group overflow-hidden relative shadow-inner"
                           >
                              {uploadedFile ? (
                                <div className="relative h-full w-full">
                                  <img src={URL.createObjectURL(uploadedFile)} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-900/80 px-4 py-2 rounded-full">Change Photo</p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-[#060B16] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:text-glow-green group-hover:border-glow-green/40 border border-slate-200 dark:border-white/5">
                                    <Upload size={24} className="text-slate-400 dark:text-gray-500 transition-colors" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white">Click to upload</p>
                                    <p className="text-[8px] font-bold text-slate-500 dark:text-gray-500">Max size 5MB • JPG, PNG</p>
                                  </div>
                                </>
                              )}
                              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setUploadedFile(e.target.files[0])} />
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Describe Condition</label>
                           <textarea 
                              value={problem}
                              onChange={(e) => setProblem(e.target.value)}
                              placeholder="Describe what happened, injuries seen, and exact location markers..."
                              className="w-full h-48 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-glow-green/40 focus:bg-white dark:focus:bg-[#060B16] transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-gray-700 shadow-inner"
                           />
                        </div>
                      </div>
                      
                       <div className="mt-8 flex flex-col md:flex-row gap-6 items-end relative z-10">
                          <div className="flex-1 w-full space-y-3">
                             <div className="flex justify-between items-center px-2">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Animal Location / Address</label>
                             </div>
                            <div className="relative">
                               <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-glow-green/50" />
                               <input 
                                 type="text" 
                                 value={address}
                                 onChange={(e) => setAddress(e.target.value)}
                                 placeholder="Type address or location landmarks..."
                                 className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-glow-green/40 shadow-inner"
                               />
                            </div>
                          </div>
                         <button 
                            onClick={handleSubmit}
                            disabled={isAnalyzing || !problem}
                            className="h-14 px-12 bg-glow-green text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(34,197,94,0.2)] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                         >
                            {isAnalyzing ? (
                              <>
                                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ANALYZING...
                              </>
                            ) : (
                              <>SUBMIT REPORT <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                            )}
                         </button>
                      </div>
                   </div>

                   <RescueSupportPortal setView={setView} />
                   <AnimalTodayImpact complaints={complaints} />
                </div>

                <div className="space-y-8 flex flex-col">
                   <AIRescueAssessment result={latestAnimalRescue} onViewDetails={onViewDetails} />
                   <LiveRescueTracker complaint={latestAnimalRescue} onViewDetails={onViewDetails} />
                </div>
            </div>
        </div>
    );
};

const SocialHelpHero = ({ complaints, language }: { complaints: Complaint[], language: Language }) => {
  const socialComplaints = complaints.filter(c => c.department === 'Social Help');
  const resolvedCount = socialComplaints.filter(c => c.status === 'Resolved').length;
  const totalReports = socialComplaints.length;
  const reunitedCount = resolvedCount; 
  const ngosCount = totalReports > 0 ? 12 : 0; 

  const stats = [
    { label: 'People Helped', value: resolvedCount, icon: Users, color: 'text-pink-400', sub: 'This Month' },
    { label: 'NGOs & Trusts', value: ngosCount, icon: Building2, color: 'text-cyan-400', sub: 'Active' },
    { label: 'Reports Received', value: totalReports, icon: Heart, color: 'text-rose-500', sub: 'Total' },
    { label: 'Reunited', value: reunitedCount, icon: Users, color: 'text-emerald-400', sub: 'This Month' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-950 border border-pink-500/20 shadow-[0_0_50px_rgba(236,72,153,0.1)] min-h-[350px] flex items-center mb-10 group"
    >
      <div className="absolute inset-0 z-0">
        <img 
          src="social_help_hero_bg_1778251407521.png" 
          alt="Social Help Hero" 
          className="h-full w-full object-cover object-center transition-transform duration-1000 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-slate-900/70 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(236,72,153,0.15),transparent_70%)] z-10" />
      </div>
      
      <div className="relative z-20 px-12 py-10 max-w-2xl space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
             <Heart size={12} className="animate-pulse" /> Community Support Portal
          </div>
          <h1 className="text-5xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            Social Help & <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Community Support</span>
          </h1>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
          {stats.map((s, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                 <s.icon size={16} className="text-white" />
                 <span className="text-2xl font-black text-white tracking-tight">{s.value}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-200 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const SocialHelpTracker = ({ complaint, onViewDetails }: { complaint: Complaint | null, onViewDetails: (id: string) => void }) => {
  if (!complaint) return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px] bg-white dark:bg-slate-950">
       <div className="h-16 w-16 rounded-full bg-pink-500/5 flex items-center justify-center text-pink-500/20">
          <Activity size={32} />
       </div>
       <div className="space-y-1">
         <h4 className="text-sm font-bold text-gray-500">No active tracking</h4>
         <p className="text-xs text-gray-400 max-w-[200px]">Submit a report to see live rescue updates here.</p>
       </div>
    </div>
  );

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-pink-500/20 relative overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.05)] h-full bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pink-500 flex items-center gap-2">
          <Activity size={16} className="animate-pulse" /> Live Support Tracker
        </h3>
        <span className="text-[10px] font-bold text-gray-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">{complaint.id}</span>
      </div>

      <div className="relative pl-8 space-y-8">
        <div className="absolute left-[15px] top-[10px] bottom-4 w-[2px] bg-slate-200 dark:bg-slate-800 rounded-full" />
        
        {complaint.timeline?.map((step: any, i: number) => (
          <div key={i} className="relative">
            <div className={`absolute -left-[26px] top-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
              step.status === 'completed' ? 'bg-pink-500 border-pink-500' : 
              step.status === 'active' ? 'bg-white dark:bg-slate-950 border-purple-500' : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800'
            }`}>
              {step.status === 'active' && <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />}
            </div>
            
            <div className="space-y-1">
              <h4 className={`text-[11px] font-black uppercase tracking-wider ${step.status === 'pending' ? 'text-gray-400' : 'text-slate-900 dark:text-white'}`}>{step.label}</h4>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onViewDetails(complaint.id)}
        className="w-full mt-12 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-pink-500/20 text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500/10 transition-all flex items-center justify-center gap-2"
      >
        <LayoutDashboard size={14} /> View Details
      </button>
    </div>
  );
};

const SocialHelpImpact = ({ complaints }: { complaints: Complaint[] }) => {
  const socialComplaints = complaints.filter(c => c.department === 'Social Help');
  const resolvedCount = socialComplaints.filter(c => c.status === 'Resolved').length;
  
  const stats = [
    { label: 'People Helped', value: resolvedCount, icon: Users, color: 'text-pink-400' },
    { label: 'Reports Received', value: socialComplaints.length, icon: MessageSquare, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="glass-card rounded-[2rem] p-6 border border-slate-200 dark:border-white/5 relative bg-white dark:bg-[#060B16]">
            <div className={`h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${s.color} mb-4 border border-slate-200 dark:border-white/5 shadow-inner`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">{s.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SocialHelpPage = ({ language, complaints, onComplaintSubmit, onViewDetails, setView, theme }: { language: Language, complaints: Complaint[], onComplaintSubmit: (c: Complaint) => void, onViewDetails: (id: string) => void, setView: (v: View) => void, theme: Theme }) => {
    const [problem, setProblem] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [address, setAddress] = useState('');
    const [showMap, setShowMap] = useState(true);
    const [position, setPosition] = useState<[number, number] | null>([28.6139, 77.2090]);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const socialComplaints = complaints.filter(c => c.department === 'Social Help');
    const latestCase = socialComplaints[0] || null;

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setLocationStatus('detecting');
        setShowMap(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setPosition([lat, lon]);
                setLocationStatus('detected');
                
                try {
                  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                  const data = await response.json();
                  if (data && data.display_name) {
                    setAddress(data.display_name);
                  }
                } catch (e) { console.error(e); }
            },
            () => {
              setLocationStatus('error');
              setShowMap(true);
            },
            { timeout: 10000 }
        );
    };

    const searchLocation = async () => {
      if (!address) return;
      setLocationStatus('detecting');
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPosition([lat, lon]);
          setLocationStatus('detected');
          setShowMap(true);
          setAddress(data[0].display_name);
        } else {
          setLocationStatus('error');
        }
      } catch (e) {
        console.error('Search failed:', e);
        setLocationStatus('error');
      }
    };

    const handleSubmit = async () => {
        if (!problem && !uploadedFile) return;
        setIsAnalyzing(true);
        
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const getBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            };

            let imgBase64 = undefined;
            if (uploadedFile) {
                imgBase64 = await getBase64(uploadedFile);
            }

            const newComplaint: Complaint = {
                id: `SH-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                subject: problem ? (problem.substring(0, 50) + (problem.length > 50 ? '...' : '')) : "Social Help Request",
                description: problem || "Visual social help request with no text description.",
                image: imgBase64,
                imageFile: uploadedFile || undefined,
                pincode: '000000',
                address: address || 'Locating...',
                location: position ? { lat: position[0], lng: position[1] } : undefined,
                category: 'Social Help',
                department: 'Social Help',
                priority: 'High',
                status: 'Submitted',
                estimatedTime: '3 - 5 Working Days',
                submittedAt: `${dateStr} • ${timeStr}`
            };

            await onComplaintSubmit(newComplaint);
            
            setProblem('');
            setUploadedFile(null);
            setAddress('');
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SocialHelpHero complaints={complaints} language={language} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-12">
                   <div className="glass-card rounded-[2.5rem] p-8 border border-pink-500/30 relative overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.05)] bg-white dark:bg-slate-950">
                      <div className="absolute -top-24 -left-24 h-48 w-48 bg-pink-500/5 blur-3xl rounded-full" />
                      
                      <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-[#060B16] flex items-center justify-center text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] border border-slate-200 dark:border-pink-500/20">
                          <Heart size={18} />
                        </div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">Report a Social Help Case</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Upload Photo / Video</label>
                           <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="h-48 w-full rounded-[2rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-gray-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 hover:border-pink-500/40 transition-all group overflow-hidden relative shadow-inner"
                           >
                              {uploadedFile ? (
                                <div className="relative h-full w-full">
                                  <img src={URL.createObjectURL(uploadedFile)} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest bg-slate-900/80 px-4 py-2 rounded-full">Change Media</p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-[#060B16] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:text-pink-500 group-hover:border-pink-500/40 border border-slate-200 dark:border-white/5">
                                    <Upload size={24} className="text-slate-400 dark:text-gray-600 group-hover:text-pink-500 transition-colors" />
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-900 dark:text-white">Click to upload</p>
                                    <p className="text-[8px] font-bold text-slate-500 dark:text-gray-500">JPG, PNG, MP4 up to 50MB</p>
                                  </div>
                                </>
                              )}
                              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setUploadedFile(e.target.files[0])} />
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Describe the Situation</label>
                           <textarea 
                              value={problem}
                              onChange={(e) => setProblem(e.target.value)}
                              placeholder="Provide details about the person, location, behaviour, and any other relevant information..."
                              className="w-full h-48 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-pink-500/40 focus:bg-white dark:focus:bg-[#060B16] transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-gray-700 shadow-inner"
                           />
                        </div>
                      </div>
                      
                      <div className="mt-8 flex flex-col md:flex-row gap-6 items-end relative z-10">
                         <div className="flex-1 w-full space-y-3">
                            <div className="flex justify-between items-center px-2">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Location / Address</label>
                              <div className="flex gap-4">
                                <button 
                                  type="button"
                                  onClick={detectLocation}
                                  className="text-[9px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest hover:brightness-125 transition-all flex items-center gap-1"
                                >
                                  <Navigation size={10} /> Detect My Location
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setShowMap(!showMap)}
                                  className="text-[9px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-widest hover:brightness-125 transition-all"
                                 >
                                  {showMap ? 'Hide Map' : 'Pick From Map'}
                                </button>
                              </div>
                            </div>
                           <div className="relative">
                              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500/50" />
                              <input 
                                type="text" 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                                placeholder="Enter full address or nearby landmark..."
                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-pink-500/40 shadow-inner"
                              />
                           </div>
                           {showMap && (
                             <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                               <LocationPicker 
                                 position={position} 
                                 setPosition={setPosition} 
                                 setAddress={setAddress} 
                                 theme={theme}
                               />
                             </div>
                           )}
                         </div>
                         <button 
                            onClick={handleSubmit}
                            disabled={isAnalyzing || !problem}
                            className="h-14 px-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black rounded-2xl shadow-[0_10px_20px_rgba(236,72,153,0.2)] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                         >
                            {isAnalyzing ? (
                              <>
                                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ANALYZING...
                              </>
                            ) : (
                              <>SUBMIT REPORT <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                            )}
                         </button>
                      </div>
                   </div>

                   <SocialHelpImpact complaints={complaints} />

                   <div className="space-y-6">
                      <div className="flex items-center gap-2 px-2">
                        <MapPin size={14} className="text-pink-500/60" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Live Support Map</h3>
                      </div>
                      <LiveMap complaints={complaints.filter(c => c.department === 'Social Help')} language={language} theme={theme} center={position || [28.6139, 77.2090]} />
                   </div>

                   {/* Save a Life CTA */}
                   <div className="glass-card rounded-[2.5rem] p-10 border border-pink-500/20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-lg group bg-white dark:bg-slate-900">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.05),transparent_70%)]" />
                      <div className="relative z-10 flex-1 space-y-5 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/5 border border-pink-500/10 text-pink-600 dark:text-pink-400/60 text-[8px] font-black uppercase tracking-widest">
                           Join the movement
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">A little help can change a life.</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-w-md">
                          Your report can bring hope to someone in need. Join our community of volunteers and NGOs making a difference every single day.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                           <button className="px-8 py-3 bg-pink-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:bg-pink-600 transition-all flex items-center gap-2">Report Now <ChevronRight size={14}/></button>
                           <button className="px-8 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Support NGOs</button>
                        </div>
                      </div>
                      
                      <div className="relative shrink-0">
                         <div className="h-48 w-48 rounded-full border-4 border-pink-500/20 p-3 shadow-[0_0_50px_rgba(236,72,153,0.2)] group-hover:border-pink-500/40 transition-colors relative">
                            <div className="h-full w-full rounded-full overflow-hidden bg-slate-100 dark:bg-[#060B16] relative">
                               <img 
                                 src="social_help_banner_bg_1778251459405.png" 
                                 className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                 alt="Community Impact"
                               />
                            </div>
                            <div className="absolute -inset-2 rounded-full border border-pink-500/10 animate-pulse" />
                         </div>
                         <div className="absolute -bottom-4 -right-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/30">
                            <Heart size={28} />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-8 flex flex-col h-full">
                   <AISocialAssessment result={latestCase} onViewDetails={onViewDetails} />
                   <SocialHelpTracker complaint={latestCase} onViewDetails={onViewDetails} />
                </div>
            </div>
        </div>
    );
};

const InitiativesPage = ({ language, initiatives, onRefresh }: { language: Language, initiatives: Initiative[], onRefresh: () => void }) => {
    const t = (en: string, hi: string) => language === 'hi' ? hi : en;
    const [filter, setFilter] = useState('All');
    
    const categories = ['All', ...new Set(initiatives.map(i => i.category))];
    const filteredInitiatives = filter === 'All' ? initiatives : initiatives.filter(i => i.category === filter);

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Professional Hero Section */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 min-h-[400px] flex items-center p-12 shadow-2xl">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-[40%] -right-[10%] h-[150%] w-[60%] bg-gradient-to-br from-indigo-500/20 to-purple-600/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-[40%] -left-[10%] h-[150%] w-[60%] bg-gradient-to-tr from-fuchsia-500/20 to-blue-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                    <div className="space-y-8">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-xl"
                        >
                            <Sparkles size={14} className="text-yellow-400" /> {t('Civic Excellence Platform', 'नागरिक उत्कृष्टता मंच')}
                        </motion.div>
                        <motion.h1 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white"
                        >
                            {t('Transforming Local Governance Through Community Action.', 'सामुदायिक कार्रवाई के माध्यम से स्थानीय शासन को बदलना।')}
                        </motion.h1>
                        <motion.p 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-slate-400 text-base font-medium leading-relaxed max-w-xl"
                        >
                            {t('CitizenConnect initiatives represent the pinnacle of community-led urban development. Discover, track, and support the projects shaping the future of our digital city.', 'सिटिजनकनेक्ट पहल सामुदायिक नेतृत्व वाले शहरी विकास के शिखर का प्रतिनिधित्व करती है। हमारे डिजिटल शहर के भविष्य को आकार देने वाली परियोजनाओं को खोजें, ट्रैक करें और समर्थन करें।')}
                        </motion.p>
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex flex-wrap gap-4"
                        >
                           <button className="px-10 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-white/5">Explore Active Projects</button>
                           <div className="flex -space-x-3 items-center ml-4">
                              {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                                </div>
                              ))}
                              <div className="h-10 w-10 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">5k+</div>
                              <span className="ml-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Joined Today', 'आज शामिल हुए')}</span>
                           </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Active Projects', value: initiatives.length, icon: LayoutDashboard, color: 'text-blue-500' },
                  { label: 'Volunteers Engaged', value: initiatives.reduce((acc, curr) => acc + curr.volunteersJoined, 0), icon: Users, color: 'text-emerald-500' },
                  { label: 'Impact Score', value: '9.8/10', icon: Zap, color: 'text-amber-500' },
                  { label: 'Cities Covered', value: '12+', icon: MapPin, color: 'text-indigo-500' },
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-3xl p-6 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 flex flex-col items-center text-center space-y-2"
                  >
                    <div className={`h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <span className="text-2xl font-black dark:text-white">{stat.value}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </motion.div>
                ))}
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Filter size={16} />
                    </div>
                    <h2 className="text-lg font-black dark:text-white uppercase tracking-wider">{t('Discovery Gallery', 'डिस्कवरी गैलरी')}</h2>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                filter === cat 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredInitiatives.length > 0 ? filteredInitiatives.map((item, idx) => {
                    const progress = item.volunteersRequired > 0 
                        ? Math.min(100, Math.round((item.volunteersJoined / item.volunteersRequired) * 100)) 
                        : 0;
                    
                    return (
                        <motion.div 
                            key={item._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -10 }}
                            className="group rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 shadow-xl flex flex-col h-full bg-white dark:bg-slate-900 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img 
                                    src={item.images[0] || "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2670&auto=format&fit=crop"} 
                                    alt={item.title} 
                                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                
                                <div className="absolute top-6 left-6 flex gap-2">
                                  <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-white/20 shadow-xl">
                                      {item.category}
                                  </div>
                                  <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white border border-white/10 backdrop-blur-md shadow-xl ${item.status === 'Active' ? 'bg-emerald-500/80' : 'bg-amber-500/80'}`}>
                                      {item.status}
                                  </div>
                                </div>
                                
                                <div className="absolute bottom-6 left-6 right-6">
                                  <div className="flex items-center gap-2 text-white/90">
                                    <MapPin size={12} className="text-indigo-400" />
                                    <span className="text-[10px] font-bold truncate tracking-wide">{item.location.address}</span>
                                  </div>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors leading-tight">{item.title}</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">{item.description}</p>
                                </div>
                                
                                <div className="mt-auto space-y-6">
                                    <div className="space-y-4 bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('Mobilization Progress', 'लामबंदी प्रगति')}</span>
                                                <div className="flex items-center gap-2">
                                                  <Users size={14} className="text-indigo-500" />
                                                  <span className="text-lg font-black dark:text-white">{item.volunteersJoined} <span className="text-[10px] text-slate-400 font-bold tracking-widest">/ {item.volunteersRequired}</span></span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                              <span className="text-lg font-black text-indigo-500">{progress}%</span>
                                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('Capacity', 'क्षमता')}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'} shadow-[0_0_15px_rgba(99,102,241,0.3)]`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {item.groupLink && (
                                            <a 
                                                href={item.groupLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-[0.98] group/btn"
                                            >
                                                {t('ACCESS COMMUNITY PORTAL', 'सामुदायिक पोर्टल तक पहुंचें')} 
                                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        )}
                                        <button className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                          {t('View Impact Report', 'प्रभाव रिपोर्ट देखें')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                }) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-300">
                        <Inbox size={40} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No initiatives found in this category.</p>
                      <button onClick={() => setFilter('All')} className="text-indigo-500 font-black text-[10px] uppercase tracking-widest hover:underline">Show all projects</button>
                  </div>
                )}
            </div>

            {/* Newsletter CTA */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] p-12 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="space-y-4 max-w-xl">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Stay ahead with the <span className="text-indigo-600">Civic Pulse</span> newsletter.</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Get weekly updates on city-wide initiatives, impact reports, and upcoming community drives directly in your inbox.</p>
               </div>
               <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                  <input type="email" placeholder="Enter your email address" className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-80 shadow-soft" />
                  <button className="px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-125 transition-all shadow-lg shadow-indigo-500/10">Subscribe Now</button>
               </div>
            </div>
        </div>
    );
};

interface ChatbotProps {
  language: Language;
  setView: (v: View) => void;
}

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  sources?: string[];
  suggestedActions?: { label: string; view: string }[];
  isLoading?: boolean;
  isError?: boolean;
}

const Chatbot = ({ language, setView }: ChatbotProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const WELCOME_MSG: ChatMessage = { 
        text: language === 'hi' 
            ? "नमस्ते! 🙏 मैं नागरिक सहायक हूँ। CitizenConnect के बारे में, शिकायत दर्ज करने, सरकारी योजनाओं, और नागरिक सेवाओं के बारे में पूछें।" 
            : "Hello! 🙏 I'm Nagarik Sahayak, your CitizenConnect assistant. Ask me about filing complaints, government schemes, tracking issues, or civic services.", 
        sender: 'bot',
        suggestedActions: [
            { label: 'File a Complaint', view: 'dashboard' },
            { label: 'Government Schemes', view: 'schemes' },
        ]
    };
    
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, isMinimized]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setIsTyping(true);
        
        try {
            const history = messages.slice(-6).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessages(prev => [...prev, {
                    text: data.answer,
                    sender: 'bot',
                    sources: data.sources?.length > 0 ? data.sources : undefined,
                    suggestedActions: data.suggestedActions?.length > 0 ? data.suggestedActions : undefined,
                }]);
            } else {
                throw new Error(data.message || 'API error');
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                text: language === 'hi' 
                    ? 'माफ करें, अभी connection problem है। थोड़ी देर बाद try करें।'
                    : 'Sorry, connection issue right now. Please try again shortly.',
                sender: 'bot',
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleQuickAction = (view: string) => {
        setView(view as View);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-[360px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col"
                        style={{ height: '520px' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                                        <Bot size={18} />
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-indigo-700" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm block leading-none">
                                        {language === 'hi' ? 'नागरिक सहायक' : 'Nagarik Sahayak'}
                                    </span>
                                    <span className="text-[10px] text-blue-200 font-medium">
                                        {isTyping ? (language === 'hi' ? 'टाइप कर रहा है...' : 'Typing...') : (language === 'hi' ? 'ऑनलाइन • RAG संचालित' : 'Online • RAG Powered')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setMessages([WELCOME_MSG])}
                                    title="Clear chat"
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-blue-200 hover:text-white"
                                >
                                    <Activity size={14} />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col gap-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium ${
                                        m.sender === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-200 dark:shadow-none'
                                            : m.isError
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 rounded-bl-none'
                                            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border border-gray-100 dark:border-slate-700'
                                    }`}>
                                        {m.text}
                                    </div>
                                    
                                    {m.sources && m.sources.length > 0 && (
                                        <div className="flex flex-wrap gap-1 px-1">
                                            {m.sources.slice(0, 2).map((s, j) => (
                                                <span key={j} className="text-[9px] font-bold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    📚 {s}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 px-1">
                                            {m.suggestedActions.map((action, j) => (
                                                <button
                                                    key={j}
                                                    onClick={() => handleQuickAction(action.view)}
                                                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 px-3 py-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-1"
                                                >
                                                    <ExternalLink size={10} /> {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isTyping && (
                                <div className="flex items-start gap-2">
                                    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                                        <div className="flex gap-1 items-center h-4">
                                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Suggestions */}
                        {!isTyping && messages.length <= 1 && (
                            <div className="px-3 pb-2 flex gap-2 flex-wrap shrink-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 pt-2">
                                {[
                                    language === 'hi' ? 'शिकायत कैसे करें?' : 'How to file complaint?',
                                    language === 'hi' ? 'योजनाएं बताओ' : 'Tell me about schemes',
                                    'Emergency numbers',
                                ].map((q, i) => (
                                    <button key={i} onClick={() => { setInput(q); setTimeout(handleSend, 100); }}
                                        className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-gray-100 dark:border-slate-800 flex gap-2 items-center shrink-0 bg-white dark:bg-slate-900">
                            <input 
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder={language === 'hi' ? "कुछ पूछें..." : "Ask something about CitizenConnect..."} 
                                className="flex-1 text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 dark:bg-slate-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-colors"
                                disabled={isTyping}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={isTyping || !input.trim()}
                                className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200 dark:shadow-none"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* FAB Button */}
            <motion.button 
                onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-300/40 dark:shadow-blue-900/50 flex items-center justify-center relative"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <MessageSquare size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
            </motion.button>
        </div>
    );
};

const ProfilePage = ({ user, language, onUpdateUser, complaints, onViewDetails, setView }: { 
    user: User, 
    language: Language, 
    onUpdateUser: (u: User) => void, 
    complaints: Complaint[],
    onViewDetails: (id: string) => void,
    setView: (v: View) => void
}) => {
    const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key] || key;
    const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
    const avatarInputRef = React.useRef<HTMLInputElement>(null);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
            onUpdateUser({ ...user, avatar: url });
        }
    };

    const pastGrievances = complaints.slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{language === 'hi' ? 'उपयोगकर्ता प्रोफ़ाइल' : 'User Profile'}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Details */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-soft">
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group">
                                <div className="h-28 w-28 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md mb-4 overflow-hidden">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <UserPlus size={40} className="text-blue-600 dark:text-blue-400" />
                                    )}
                                </div>
                                <button 
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute bottom-4 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                >
                                    <Upload size={14} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={avatarInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full mt-2">{language === 'hi' ? 'सत्यापित नागरिक' : 'Verified Citizen'}</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('email_addr')}</label>
                                <p className="text-sm font-medium text-slate-900 dark:text-white break-all">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('phone_number')}</label>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.phone || '+91 98765 43210'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('address_label')}</label>
                                <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{user.address || (language === 'hi' ? 'सेक्टर 4, नई दिल्ली, भारत' : 'Sector 4, New Delhi, India')}</p>
                            </div>
                            
                            <button 
                                onClick={() => setView('settings')}
                                className="w-full mt-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-gray-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {language === 'hi' ? 'प्रोफ़ाइल सेटिंग्स संपादित करें' : 'Edit Profile Settings'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grievance History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-soft">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{language === 'hi' ? 'शिकायत इतिहास' : 'Grievance History'}</h2>
                            <button 
                                onClick={() => onViewDetails('all')} // Use a special key or just navigate to my-complaints
                                className="text-xs font-bold text-blue-600 hover:underline"
                            >
                                {language === 'hi' ? 'सभी देखें' : 'View All'}
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {pastGrievances.length > 0 ? pastGrievances.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => onViewDetails(item.id)}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-blue-600 dark:text-blue-400 shadow-sm">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">{item.subject}</h4>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.id}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1">{item.category} • {item.submittedAt.split(' • ')[0]}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                            item.status === 'Resolved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                        }`}>
                                            {item.status}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                                    No grievances reported yet.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-blue-600 text-white shadow-xl flex items-center justify-between overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">{language === 'hi' ? 'बेहतरी के लिए हमारी सहायता करें' : 'Help us improve further'}</h3>
                            <p className="text-blue-100 text-sm max-w-sm">{language === 'hi' ? 'अपनी हालिया शिकायतों के समाधान की गुणवत्ता पर अपनी प्रतिक्रिया साझा करें।' : 'Share your feedback on the resolution quality of your recent grievances.'}</p>
                            <button className="mt-6 px-6 py-2.5 bg-white text-blue-600 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-50 transition-all">{language === 'hi' ? 'फीडबैक सबमिट करें' : 'Submit Feedback'}</button>
                        </div>
                        <LayoutDashboard size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoadingScreen = ({ onComplete, language }: { onComplete: () => void, language: Language }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
            >
                <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <h1 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
                    Citizen<span className="text-primary italic font-serif lowercase">connect</span>
                </h1>
                <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                    {language === 'hi' ? 'नागरिक हब प्रारंभ किया जा रहा है...' : 'Initializing Civic Hub...'}
                </p>
            </motion.div>
        </div>
    );
};

const MyComplaintsPage = ({ language, complaints, onViewDetails }: { language: Language, complaints: Complaint[], onViewDetails: (id: string) => void }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">{language === 'hi' ? 'मेरी शिकायतें' : 'My Complaints'}</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and track your submitted civic issues.</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {complaints.length > 0 ? complaints.map((c) => (
                                <tr 
                                    key={c.id} 
                                    onClick={() => onViewDetails(c.id)}
                                    className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 text-sm font-bold text-primary">{c.id}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold dark:text-white group-hover:text-primary transition-colors">{c.subject}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{c.category}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{c.submittedAt.split(' • ')[0]}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            c.status === 'Resolved' ? 'bg-green-500/10 text-green-500' : 
                                            c.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${
                                            c.priority === 'High' || c.priority === 'Critical' ? 'text-red-500' : 
                                            c.priority === 'Medium' ? 'text-orange-400' : 'text-slate-400'
                                        }`}>{c.priority}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No complaints found. Submit your first issue from the dashboard.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
const ComplaintDetailPage = ({ language, complaint: initialComplaint, onBack }: { language: Language, complaint: Complaint, onBack: () => void }) => {
    const [complaint, setComplaint] = useState<Complaint>(initialComplaint);

    // Fetch latest from backend so timeline always reflects real DB status
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const res = await fetch(`/api/complaints/${initialComplaint.id}`);
                if (res.ok) {
                    const d = await res.json();
                    setComplaint(prev => ({
                        ...prev,
                        subject: d.title,
                        category: d.category || d.type,
                        description: d.description,
                        address: d.address,
                        department: d.department || 'General',
                        priority: d.priority || 'Medium',
                        status: d.status || 'Submitted',
                        image: d.images && d.images.length > 0 
                            ? (d.images[0].startsWith('http') ? d.images[0] : `${d.images[0]}`) 
                            : prev.image,
                        estimatedTime: d.estimatedResolution || 'TBD',
                        submittedAt: d.createdAt || prev.submittedAt,
                        aiSummary: d.aiSummary || '',
                        aiRemarks: d.aiRemarks || '',
                        visualCategory: d.visualCategory || '',
                        visualRiskLevel: d.visualRiskLevel || '',
                        detectedObjects: d.detectedObjects || [],
                        imageSummary: d.imageSummary || '',
                        imageConfidence: d.imageConfidence || 0,
                        detectedLanguage: d.detectedLanguage || '',
                        safetyPrecautions: d.safetyPrecautions || '',
                    }));
                }
            } catch (e) {
                // silently fall back to initialComplaint
            }
        };
        fetchLatest();
    }, [initialComplaint.id]);

    if (!complaint) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-colors shadow-sm"
                >
                    <ChevronDown className="rotate-90" size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">Complaint Details</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">ID: <span className="text-primary">{complaint.id}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card rounded-[2rem] p-8 border border-dash-border">
                        <div className="flex items-center justify-between mb-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                complaint.status === 'Resolved' ? 'bg-green-500/10 text-green-500' : 
                                complaint.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'
                            }`}>
                                {complaint.status}
                            </span>
                            <span className="text-xs text-dash-secondary font-medium">{complaint.submittedAt}</span>
                        </div>

                        <h2 className="text-xl font-bold dark:text-white mb-4">{complaint.subject}</h2>
                        <p className="text-sm text-dash-secondary leading-relaxed mb-8">{complaint.description}</p>

                        {complaint.image && (
                            <div className="rounded-2xl overflow-hidden border border-dash-border mb-8 max-h-[400px]">
                                <img src={complaint.image} alt="Complaint Attachment" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-dash-border">
                            <div>
                                <h4 className="text-[10px] font-bold text-dash-secondary uppercase tracking-widest mb-3">Location Information</h4>
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold dark:text-white">{complaint.pincode}</p>
                                        <p className="text-xs text-dash-secondary leading-relaxed">{complaint.address}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-dash-secondary uppercase tracking-widest mb-3">Department Remarks</h4>
                                <div className="p-4 rounded-xl bg-white/5 border border-dash-border italic text-xs text-dash-secondary">
                                    "Your complaint is currently assigned to the field officer for physical verification. Expect an update within 24-48 hours."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <AIRecognitionCard result={complaint} />
                    
                    <div className="glass-card rounded-[2rem] p-8 border border-dash-border">
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Activity size={18} className="text-glow-purple" />
                            Tracking History
                        </h3>

                        <div className="relative pl-8 space-y-8">
                            <div className="absolute left-[15px] top-[10px] bottom-4 w-[2px] bg-slate-800 rounded-full" />
                            
                            {generateTimeline(complaint.status || 'Submitted', complaint.submittedAt || '').map((step: any, i: number) => (
                                <div key={`${step.label}-${i}`} className="relative">
                                    <div className={`absolute -left-[24px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                                        step.status === 'completed' ? 'bg-glow-green border-glow-green shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 
                                        step.status === 'active' ? 'bg-dash-bg border-glow-blue shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-dash-bg border-slate-700'
                                    }`}>
                                        {step.status === 'completed' && <CheckCircle2 size={10} className="text-[#060B16]" />}
                                        {step.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-glow-blue animate-pulse" />}
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-[11px] font-bold mb-1 ${step.status === 'pending' ? 'text-dash-secondary' : 'text-dash-text'}`}>{step.label}</h4>
                                            <p className="text-[10px] text-dash-secondary leading-relaxed line-clamp-2">{step.description}</p>
                                        </div>
                                        <div className="sm:text-right shrink-0">
                                            <span className="text-[9px] text-dash-secondary font-bold">{step.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationsPage = ({ language }: { language: Language }) => {
    const notifications = [
        { id: 1, title: 'Complaint Resolved', desc: 'Your complaint #CC-0985 has been resolved.', time: '2h ago', icon: CheckCircle2, color: 'text-green-500' },
        { id: 2, title: 'New Government Scheme', desc: 'New "Solar Energy Subsidy" scheme launched.', time: '5h ago', icon: BookOpenText, color: 'text-blue-500' },
        { id: 3, title: 'Emergency Alert', desc: 'Heavy rainfall expected in your sector.', time: '1d ago', icon: AlertCircle, color: 'text-red-500' },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold dark:text-white">{language === 'hi' ? 'सूचनाएं' : 'Notifications'}</h1>
            <div className="space-y-4">
                {notifications.map((n) => (
                    <div key={n.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 hover:shadow-lg transition-all cursor-pointer">
                        <div className={`h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 ${n.color}`}>
                            <n.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold dark:text-white">{n.title}</h3>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{n.time}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{n.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsPage = ({ language, theme, setTheme, setLanguage, user, onUpdateUser }: { 
    language: Language, 
    theme: Theme, 
    setTheme: (t: Theme) => void, 
    setLanguage: (l: Language) => void,
    user: User,
    onUpdateUser: (u: User) => void
}) => {
    const [activeTab, setActiveTab] = useState<'Profile' | 'Preferences' | 'Notifications' | 'Security'>('Profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    
    // Form States
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [notificationSettings, setNotificationSettings] = useState({
        email: true,
        push: true,
        sms: false,
        newsletters: true
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const token = localStorage.getItem('citizenconnect_token');
            const response = await fetch('/api/auth/updatedetails', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });

            if (response.ok) {
                const data = await response.json();
                onUpdateUser({ ...user, ...data.data });
                setSaveStatus('success');
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            alert("New passwords don't match!");
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const token = localStorage.getItem('citizenconnect_token');
            const response = await fetch('/api/auth/updatepassword', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: securityForm.currentPassword,
                    newPassword: securityForm.newPassword
                })
            });

            if (response.ok) {
                setSaveStatus('success');
                setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const tabs = [
        { id: 'Profile', icon: User },
        { id: 'Preferences', icon: Settings },
        { id: 'Notifications', icon: Bell },
        { id: 'Security', icon: ShieldCheck }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage your account identity and digital workspace.</p>
                </div>
                {saveStatus === 'success' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} /> Changes saved successfully
                    </motion.div>
                )}
                {saveStatus === 'error' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-xs font-bold">
                        <AlertCircle size={14} /> Failed to save changes
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-soft space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                                    activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-lg shadow-blue-500/20' 
                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-soft min-h-[500px]">
                        
                        <AnimatePresence mode="wait">
                            {activeTab === 'Profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</h2>
                                            <p className="text-xs font-medium text-slate-500">Update your personal details and contact info.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                            <input 
                                                type="text" 
                                                value={profileForm.name}
                                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                            <input 
                                                type="email" 
                                                value={profileForm.email}
                                                onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <input 
                                                type="text" 
                                                value={profileForm.phone}
                                                onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                                            <input 
                                                type="text" 
                                                value={profileForm.address}
                                                onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                            />
                                        </div>
                                        <div className="md:col-span-2 pt-6">
                                            <button 
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Profile Details'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'Preferences' && (
                                <motion.div
                                    key="preferences"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <Settings size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">App Preferences</h2>
                                            <p className="text-xs font-medium text-slate-500">Customize how the platform looks and feels.</p>
                                        </div>
                                    </div>

                                     <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <h4 className="text-sm font-bold dark:text-white">Dark Mode</h4>
                                                <p className="text-[11px] text-slate-500 font-medium">Switch to a darker theme for reduced eye strain.</p>
                                            </div>
                                            <button 
                                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                                className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-8' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <h4 className="text-sm font-bold dark:text-white">Data Privacy</h4>
                                                <p className="text-[11px] text-slate-500 font-medium">Export all your reporting data as a JSON/PDF file.</p>
                                            </div>
                                            <button className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                                                <Download size={14} /> Export My Data
                                            </button>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Platform Language</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { id: 'en', label: 'English (US)', flag: '🇺🇸' },
                                                    { id: 'hi', label: 'हिन्दी (IN)', flag: '🇮🇳' }
                                                ].map((l) => (
                                                    <button 
                                                        key={l.id}
                                                        onClick={() => setLanguage(l.id as Language)}
                                                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                                            language === l.id 
                                                                ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-blue-500/10' 
                                                                : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                                        }`}
                                                    >
                                                        <span className="text-2xl">{l.flag}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider">{l.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'Notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                            <Bell size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notification Settings</h2>
                                            <p className="text-xs font-medium text-slate-500">Choose how you stay updated with city events.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'email', label: 'Email Alerts', desc: 'Get updates on your grievances via email.' },
                                            { id: 'push', label: 'Push Notifications', desc: 'Real-time alerts on your browser/mobile.' },
                                            { id: 'sms', label: 'SMS Updates', desc: 'Critical alerts delivered via text message.' },
                                            { id: 'newsletters', label: 'Community Newsletter', desc: 'Weekly roundup of city improvements.' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <div>
                                                    <h4 className="text-sm font-bold dark:text-white">{item.label}</h4>
                                                    <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setNotificationSettings({...notificationSettings, [item.id]: !((notificationSettings as any)[item.id])})}
                                                    className={`w-12 h-6 rounded-full relative transition-all ${((notificationSettings as any)[item.id]) ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${((notificationSettings as any)[item.id]) ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'Security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security & Password</h2>
                                            <p className="text-xs font-medium text-slate-500">Protect your account from unauthorized access.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                                        <Key size={16} />
                                                    </div>
                                                    <h4 className="text-sm font-bold dark:text-white">Two-Factor Auth</h4>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium mb-4">Add an extra layer of security to your account using TOTP.</p>
                                                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Enable 2FA Now</button>
                                            </div>
                                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                                        <Activity size={16} />
                                                    </div>
                                                    <h4 className="text-sm font-bold dark:text-white">Login Sessions</h4>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium mb-4">View and manage your active sessions across all devices.</p>
                                                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Manage Sessions</button>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordUpdate} className="space-y-6 pt-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                                <input 
                                                    type="password" 
                                                    value={securityForm.currentPassword}
                                                    onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={securityForm.newPassword}
                                                        onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={securityForm.confirmPassword}
                                                        onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                                                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-6 flex items-center justify-between">
                                                <button 
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                                >
                                                    {isSaving ? 'Updating...' : 'Update Password Security'}
                                                </button>
                                            </div>
                                        </form>

                                        <div className="mt-12 pt-8 border-t border-red-500/10 space-y-6">
                                            <div>
                                                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-1">Danger Zone</h3>
                                                <p className="text-[11px] text-slate-500 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                                            </div>
                                            <button className="px-6 py-3 rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Delete My Citizen Account</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>
            </div>
        </div>
    );
};

const HelpSupportPage = ({ language }: { language: Language }) => {
    const faqs = [
        { q: 'How to track my complaint?', a: 'You can track your complaint in the "My Complaints" section using the ID provided.' },
        { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption to protect your personal information.' },
        { q: 'How to donate?', a: 'Go to the "Donations" section and choose a scheme to support.' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold dark:text-white">{language === 'hi' ? 'सहायता और समर्थन' : 'Help & Support'}</h1>
                <p className="text-gray-500">How can we help you today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h3 className="font-bold dark:text-white mb-2">{faq.q}</h3>
                                <p className="text-sm text-gray-500">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-6">
                    <h2 className="text-xl font-bold dark:text-white">Contact Us</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Subject" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:text-white" />
                        <textarea placeholder="Describe your issue..." className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:text-white" />
                        <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">Send Message</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

const generateTimeline = (currentStatus: string, submittedAt: string): TimelineStep[] => {
  const STATUS_ORDER: string[] = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
  
  // Normalize status for matching
  const normalizedStatus = currentStatus.trim().toLowerCase();
  let currentIndex = STATUS_ORDER.findIndex(s => s.toLowerCase() === normalizedStatus);
  
  if (currentIndex === -1) {
    if (normalizedStatus.includes('review')) currentIndex = 1;
    else if (normalizedStatus.includes('progress')) currentIndex = 2;
    else if (normalizedStatus.includes('resolv')) currentIndex = 3;
    else currentIndex = 0;
  }

  let dateStr = new Date().toLocaleDateString('en-GB');
  try {
    if (submittedAt) {
      const d = new Date(submittedAt);
      if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('en-GB');
    }
  } catch (e) {}

  return STATUS_ORDER.map((label, idx) => {
    let stepStatus: 'completed' | 'active' | 'pending';
    if (idx < currentIndex) stepStatus = 'completed';
    else if (idx === currentIndex) stepStatus = 'active';
    else stepStatus = 'pending';

    const descriptions: Record<string, string> = {
      'Submitted': 'Your complaint has been submitted successfully.',
      'Under Review': 'Your complaint is under review by the department.',
      'In Progress': 'Action has been initiated on your complaint.',
      'Resolved': 'Your complaint has been resolved.'
    };

    return {
      label,
      status: stepStatus,
      description: descriptions[label] || '',
      date: idx === 0 ? dateStr : (idx <= currentIndex ? 'Updated' : '--'),
      time: ''
    };
  });
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    className="h-full"
  >
    {children}
  </motion.div>
);
const NotificationToast = ({ notification, onClose }: { notification: any, onClose: () => void }) => {
  if (!notification) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[9999] w-80 bg-white dark:bg-[#1e213a] border border-blue-500/10 dark:border-glow-blue/30 rounded-2xl p-4 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/20 flex gap-4 items-start backdrop-blur-md"
    >
      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
        <Bell size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{notification.title}</h4>
        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">{notification.body}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md text-gray-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('citizenconnect_theme');
      if (stored === 'light' || stored === 'dark') return stored as Theme;
    } catch (e) {}
    return 'dark'; // Default to dark on every system
  });
  const [complaints, setComplaints] = useState<Complaint[]>([]); 
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(() => {
    return localStorage.getItem('citizenconnect_active_id');
  });
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Global Location State for Unified Map Search
  const [globalAddress, setGlobalAddress] = useState('');
  const [globalPosition, setGlobalPosition] = useState<[number, number]>([28.6139, 77.2090]); // Default Delhi
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Sync view state with URL
  useEffect(() => {
    const path = location.pathname.substring(1) || 'landing';
    if (view !== path && path !== 'loading') {
       // We keep the view state for backward compatibility with components that use setView
       // but we should eventually migrate them to useNavigate
    }
  }, [location]);

  const setView = (v: View) => {
    const path = v === 'landing' ? '/' : `/${v}`;
    navigate(path);
  };

  // Extract current view from pathname
  const currentView = (location.pathname.substring(1) || (user ? 'dashboard' : 'landing')) as View;
  const view = currentView; // Overwrite the local state usage with the URL-derived one

  const handleGlobalSearch = async (query: string) => {
    if (!query) return;
    setIsSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setGlobalPosition([lat, lon]);
        setGlobalAddress(data[0].display_name);
        if (view !== 'dashboard' && view !== 'monitoring') {
          setView('dashboard');
        }
      }
    } catch (e) {
      console.error('Global search failed:', e);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  useEffect(() => {
    // Setup FCM listener
    const setupFCM = async () => {
      try {
        const token = await requestForToken();
        if (token) setFcmToken(token);
      } catch (err) {
        console.error('FCM Setup error:', err);
      }
    };

    if (user) {
      setupFCM();
    }
  }, [user]);

  useEffect(() => {
    // Listen for foreground messages
    let unsubscribe: any;
    
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload: any) => {
        console.log('Message received in foreground: ', payload);
        const title = payload?.notification?.title || 'CitizenConnect Update';
        const body = payload?.notification?.body || 'You have a new message.';
        
        setNotification({ title, body });
        
        // Native Fallback (Free Forever)
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(title, { body, icon: '/image/image.png' });
          } catch (e) {
            console.warn("Native notification failed:", e);
          }
        }
        
        // Clear notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
      });
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints');
      if (response.ok) {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Invalid JSON from /api/complaints');
          return;
        }
        if (Array.isArray(data)) {
          const mapped: Complaint[] = data.map((d: any) => ({
            id: d._id || d.id,
            subject: d.title || d.subject || 'No Title',
            category: d.category || d.type || 'General',
            description: d.description || '',
            address: d.address || '',
            department: d.department || 'General',
            priority: d.priority || 'Medium',
            status: d.status || 'Submitted',
            image: d.images && d.images.length > 0 
              ? (d.images[0].startsWith('http') ? d.images[0] : `${window.location.origin}${d.images[0]}`) 
              : undefined,
            pincode: d.pincode || '000000',
            estimatedTime: d.estimatedResolution || d.estimatedTime || 'TBD',
            submittedAt: d.createdAt || d.submittedAt || new Date().toISOString(),
            aiSummary: d.aiSummary || '',
            aiRemarks: d.aiRemarks || '',
            visualCategory: d.visualCategory || '',
            visualRiskLevel: d.visualRiskLevel || '',
            detectedObjects: d.detectedObjects || [],
            imageSummary: d.imageSummary || '',
            imageConfidence: d.imageConfidence || 0,
            detectedLanguage: d.detectedLanguage || '',
            location: (d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number') 
              ? { lat: d.location.lat, lng: d.location.lng } 
              : undefined,
          }));
          setComplaints(mapped);
        } else {
          console.warn('Fetched complaints data is not an array:', data);
          setComplaints([]);
        }
      }
    } catch (error) {
      console.error('Error fetching complaints from backend:', error);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('citizenconnect_token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          role: data.role
        });
        // If we were on landing or login/signup, go to dashboard
        if (view === 'landing' || view === 'login' || view === 'signup' || view === 'loading') {
          setView('dashboard');
        }
      } else {
        // Token invalid or expired
        localStorage.removeItem('citizenconnect_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const fetchSchemes = async () => {
    try {
      const response = await fetch('/api/schemes');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          setSchemes(data.data);
        } else if (data && Array.isArray(data)) {
          setSchemes(data);
        } else {
          console.warn('Fetched schemes data is not an array:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/donations');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          setDonations(data.data);
        } else if (data && Array.isArray(data)) {
          setDonations(data);
        } else {
          console.warn('Fetched donations data is not an array:', data);
        }
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const fetchInitiatives = async () => {
    try {
      const response = await fetch('/api/initiatives');
      if (response.ok) {
        const data = await response.json();
        setInitiatives(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    }
  };

  const hasCheckedAuth = useRef(false);
  useEffect(() => {
    // Initial data fetch for public content
    const fetchPublicData = async () => {
      await fetchSchemes();
      await fetchDonations();
      await fetchInitiatives();
    };
    fetchPublicData();

    // Only fetch protected data if we have a user
    if (user) {
      fetchComplaints();

      // Realtime Polling for accurate data
      const pollInterval = setInterval(() => {
        fetchComplaints();
        fetchDonations();
      }, 30000); // Sync every 30 seconds

      return () => clearInterval(pollInterval);
    } else if (!hasCheckedAuth.current) {
      // If no user, check auth once to see if we should log them in
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, [user]);

  const handleNewComplaint = async (c: Complaint) => {
    console.log("🌐 [API DEBUG] handleNewComplaint (FormData) started for:", c.subject);
    
    try {
      const formData = new FormData();
      formData.append('title', c.subject);
      formData.append('description', c.description);
      formData.append('address', c.address);
      formData.append('language', language);
      if (c.category) {
        formData.append('category', c.category);
      }
      if (c.location) {
        formData.append('location', JSON.stringify(c.location));
      }
      
      // If we have a File object from the Dashboard/Animal Welfare, use it
      // Note: c.image might be a base64 string or we might have the original File
      // For Dashboard, we now pass the File object in our new handleSubmit
      if (c.imageFile) {
        console.log("📸 [API DEBUG] Appending physical file to FormData...");
        formData.append('images', c.imageFile);
      } else if (c.image && c.image.startsWith('data:')) {
        console.log("📸 [API DEBUG] Converting base64 back to file for FormData...");
        // Fallback for legacy base64 if needed
        const response = await fetch(c.image);
        const blob = await response.blob();
        formData.append('images', new File([blob], "upload.jpg", { type: "image/jpeg" }));
      }

      const response = await fetch('/api/complaints', {
        method: 'POST',
        // No Content-Type header - browser will set it with boundary
        body: formData
      });
      
      console.log("📡 [API DEBUG] Response Status:", response.status);
      if (response.ok) {
        const savedData = await response.json();
        console.log("✅ [API DEBUG] Complaint saved successfully. ID:", savedData._id);
        const newMapped: Complaint = {
          ...c,
          id: savedData._id,
          category: savedData.category,
          department: savedData.department,
          priority: savedData.priority,
          estimatedTime: savedData.estimatedResolution,
          submittedAt: savedData.createdAt,
          status: savedData.status,
          aiSummary: savedData.aiSummary || '',
          aiRemarks: savedData.aiRemarks || '',
          visualCategory: savedData.visualCategory || '',
          visualRiskLevel: savedData.visualRiskLevel || '',
          detectedObjects: savedData.detectedObjects || [],
          imageSummary: savedData.imageSummary || '',
          imageConfidence: savedData.imageConfidence || 0,
          detectedLanguage: savedData.detectedLanguage || '',
          safetyPrecautions: savedData.safetyPrecautions || ''
          // No timeline stored - computed dynamically at render time
        };
        setComplaints(prev => [newMapped, ...prev]);
        setActiveComplaintId(newMapped.id);
        return;
      }
    } catch (error) {
      console.error('Error saving complaint to backend:', error);
    }
    // Fallback if backend fails
    setComplaints(prev => [c, ...prev]);
    setActiveComplaintId(c.id);
  };

  // Complaints are NOT cached in localStorage - always fetched fresh from MongoDB on load
  // This ensures status changes in DB are always reflected in UI without stale cache

  useEffect(() => {
    if (activeComplaintId) {
      localStorage.setItem('citizenconnect_active_id', activeComplaintId);
    } else {
      localStorage.removeItem('citizenconnect_active_id');
    }
  }, [activeComplaintId]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('citizenconnect_theme', theme);
    } catch (e) {}
  }, [theme]);

  const isDashboardView = [
    'dashboard', 
    'profile',
    'monitoring',
    'animal-welfare', 
    'social-help', 
    'government-schemes', 
    'government-donations',
    'notifications',
    'settings',
    'help-support',
    'my-complaints',
    'complaint-details',
    'initiatives'
  ].includes(view);

  const shouldShowDashboardNav = isDashboardView || (view === 'about' && user !== null);

  const shouldShowGallery = [
    'dashboard', 
    'animal-welfare', 
    'government-schemes', 
    'government-donations'
  ].includes(view);

  if (view === 'loading') {
    return <LoadingScreen language={language} onComplete={() => setView('landing')} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('citizenconnect_token');
    setUser(null);
    setView('landing');
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col bg-bg dark:bg-slate-950 text-text dark:text-slate-100 transition-colors duration-300`}>
      <AnimatePresence>
        {notification && <NotificationToast notification={notification} onClose={() => setNotification(null)} />}
      </AnimatePresence>
      {shouldShowDashboardNav ? (
        <DashboardNavbar 
          currentView={view} 
          setView={setView} 
          user={user} 
          onLogout={handleLogout} 
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          handleGlobalSearch={handleGlobalSearch}
        />
      ) : (
        <PublicNavbar 
          currentView={view} 
          setView={setView} 
          user={user} 
          onLogout={handleLogout} 
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      )}
      
      <div className={`flex-1 flex w-full relative`}>
        {isDashboardView && <Sidebar currentView={view} setView={setView} onLogout={handleLogout} language={language} />}
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-[70] lg:hidden border-r border-gray-100 dark:border-white/10 shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  <div className="h-20 border-b border-gray-100 dark:border-white/10 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                        <LayoutDashboard size={22} />
                      </div>
                      <span className="text-xl font-bold dark:text-white">CitizenConnect</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {isDashboardView ? (
                      <SidebarContent currentView={view} setView={(v) => { setView(v); setIsMobileMenuOpen(false); }} language={language} />
                    ) : (
                      <div className="space-y-2">
                        <button 
                          onClick={() => { setView('landing'); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all ${view === 'landing' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          <Home size={20} /> {t('home')}
                        </button>
                        <button 
                          onClick={() => { setView('initiatives'); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all ${view === 'initiatives' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          <Sparkles size={20} /> {t('initiatives')}
                        </button>
                        <button 
                          onClick={() => { setView('about'); setIsMobileMenuOpen(false); }}
                          className={`w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold transition-all ${view === 'about' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                          <Info size={20} /> {t('about')}
                        </button>
                        {!user && (
                          <>
                            <div className="h-px bg-gray-100 dark:bg-white/5 my-4" />
                            <button 
                              onClick={() => { setView('login'); setIsMobileMenuOpen(false); }}
                              className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                              <LogIn size={20} /> {t('login')}
                            </button>
                            <button 
                              onClick={() => { setView('signup'); setIsMobileMenuOpen(false); }}
                              className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20"
                            >
                              <UserPlus size={20} /> {t('signup')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={20} />
                      <span>{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <main className={`flex-1 w-full min-w-0 py-10 transition-all duration-300`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><LandingPage setView={setView} language={language} /></PageWrapper>} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <PageWrapper><AuthPage type="login" setView={setView} onLogin={setUser} language={language} /></PageWrapper>} />
                <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <PageWrapper><AuthPage type="signup" setView={setView} onLogin={setUser} language={language} /></PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage setView={setView} language={language} /></PageWrapper>} />
                <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage setView={setView} language={language} /></PageWrapper>} />
                
                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={user ? (
                  <PageWrapper>
                    <Dashboard 
                      language={language} 
                      user={user} 
                      activeComplaint={complaints.find(c => c.id === activeComplaintId) || null}
                      onComplaintSubmit={handleNewComplaint}
                      onViewDetails={(id) => {
                        setSelectedComplaintId(id);
                        setView('complaint-details');
                      }}
                      setView={setView}
                      complaints={complaints}
                      theme={theme}
                      globalSearch={view === 'dashboard' ? searchQuery : undefined}
                      globalPosition={globalPosition}
                      setGlobalPosition={setGlobalPosition}
                      globalAddress={globalAddress}
                      setGlobalAddress={setGlobalAddress}
                      isSearchingLocation={isSearchingLocation}
                    />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />} />
                
                <Route path="/profile" element={user ? (
                  <PageWrapper>
                    <ProfilePage 
                      user={user} 
                      language={language} 
                      onUpdateUser={setUser} 
                      complaints={complaints}
                      onViewDetails={(id) => {
                        if (id === 'all') {
                          setView('my-complaints');
                        } else {
                          setSelectedComplaintId(id);
                          setView('complaint-details');
                        }
                      }}
                      setView={setView}
                    />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />} />

                <Route path="/government-schemes" element={<PageWrapper><GovSchemesPage language={language} schemes={schemes} /></PageWrapper>} />
                <Route path="/government-donations" element={<PageWrapper><GovDonationsPage language={language} donations={donations} /></PageWrapper>} />
                <Route path="/initiatives" element={<PageWrapper><InitiativesPage language={language} initiatives={initiatives} onRefresh={fetchInitiatives} /></PageWrapper>} />
                
                <Route path="/monitoring" element={
                  <PageWrapper>
                    <LiveCivicMonitoringPage 
                      complaints={complaints} 
                      language={language} 
                      theme={theme} 
                      setView={setView} 
                      globalPosition={globalPosition}
                      isSearchingLocation={isSearchingLocation}
                    />
                  </PageWrapper>
                } />
                
                <Route path="/animal-welfare" element={
                  <PageWrapper>
                    <AnimalWelfarePage 
                      language={language} 
                      complaints={complaints}
                      onComplaintSubmit={handleNewComplaint}
                      onViewDetails={(id) => {
                        setSelectedComplaintId(id);
                        setView('complaint-details');
                      }}
                      setView={setView}
                      theme={theme}
                    />
                  </PageWrapper>
                } />
                
                <Route path="/social-help" element={
                  <PageWrapper>
                    <SocialHelpPage 
                      language={language} 
                      complaints={complaints}
                      onComplaintSubmit={handleNewComplaint}
                      onViewDetails={(id) => {
                        setSelectedComplaintId(id);
                        setView('complaint-details');
                      }}
                      setView={setView}
                      theme={theme}
                    />
                  </PageWrapper>
                } />
                
                <Route path="/notifications" element={<PageWrapper><NotificationsPage language={language} /></PageWrapper>} />
                
                <Route path="/settings" element={user ? (
                  <PageWrapper>
                    <SettingsPage 
                      language={language} 
                      theme={theme} 
                      setTheme={setTheme} 
                      setLanguage={setLanguage} 
                      user={user} 
                      onUpdateUser={setUser} 
                    />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />} />
                
                <Route path="/help-support" element={<PageWrapper><HelpSupportPage language={language} /></PageWrapper>} />
                
                <Route path="/my-complaints" element={user ? (
                  <PageWrapper>
                    <MyComplaintsPage 
                      language={language} 
                      complaints={complaints}
                      onViewDetails={(id) => {
                        setSelectedComplaintId(id);
                        setView('complaint-details');
                      }}
                    />
                  </PageWrapper>
                ) : <Navigate to="/login" replace />} />
                
                <Route path="/complaint-details" element={selectedComplaintId && complaints.find(c => c.id === selectedComplaintId) ? (
                  <PageWrapper>
                    <ComplaintDetailPage 
                      language={language}
                      complaint={complaints.find(c => c.id === selectedComplaintId)!}
                      onBack={() => setView('my-complaints')}
                    />
                  </PageWrapper>
                ) : <Navigate to="/my-complaints" replace />} />
                
                <Route path="/about" element={
                  <PageWrapper>
                    <div className="max-w-3xl mx-auto text-center space-y-8 pt-12">
                       <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{TRANSLATIONS[language].about_title}</h1>
                       <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                          {TRANSLATIONS[language].about_desc}
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                           <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                               <h3 className="font-bold text-primary mb-2">{TRANSLATIONS[language].our_mission}</h3>
                               <p className="text-sm text-gray-600 dark:text-gray-400">{TRANSLATIONS[language].mission_desc}</p>
                           </div>
                           <div className="p-8 rounded-3xl bg-accent/10 dark:bg-accent/10 border border-accent/20 dark:border-accent/20">
                               <h3 className="font-bold text-accent mb-2">{TRANSLATIONS[language].our_vision}</h3>
                               <p className="text-sm text-gray-600 dark:text-gray-400">{TRANSLATIONS[language].vision_desc}</p>
                           </div>
                       </div>
                    </div>
                  </PageWrapper>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>

            {shouldShowGallery && (
              <div className="mt-20 pt-16 border-t border-gray-100 dark:border-slate-800">
                <div className="text-center mb-12">
                   <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
                      {language === 'hi' ? 'नागरिक प्रभाव दीर्घा' : 'Civic Impact Gallery'}
                  </h2>
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto italic">
                    {language === 'hi' ? 'हमारे नागरिकों द्वारा रिपोर्ट किए गए वास्तविक मुद्दों की एक झलक।' : 'A glimpse of real issues reported by our citizens.'}
                  </p>
                </div>
                <CivicGallery language={language} />
              </div>
            )}
          </div>
        </main>
      </div>

      <Chatbot language={language} setView={setView} />

      {!isDashboardView && (
          <footer className="border-t border-gray-100 dark:border-slate-800 py-12 bg-white dark:bg-slate-950 transition-colors">
              <div className="max-w-7xl mx-auto px-4 text-center">
                  <div className="flex justify-center gap-6 mb-8 text-gray-400 dark:text-gray-600">
                      <Home size={18} />
                      <Info size={18} />
                      <MessageSquare size={18} />
                  </div>
                  <p className="text-xs font-bold text-gray-300 dark:text-slate-800 uppercase tracking-widest">{language === 'hi' ? '© 2026 सिटिजनकनेक्ट कलेक्टिव। सर्वाधिकार सुरक्षित।' : '© 2026 CitizenConnect Collective. All Rights Reserved.'}</p>
              </div>
          </footer>
      )}
    </div>
    </ErrorBoundary>
  );
}
