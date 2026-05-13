/**
 * CitizenConnect RAG Chatbot Service
 * 
 * HOW RAG WORKS (simple explanation):
 * 1. We have a "Knowledge Base" - all info about CitizenConnect (schemes, departments, how to file complaints, etc.)
 * 2. Each knowledge chunk is converted to a "vector/embedding" (list of numbers representing meaning)
 * 3. When user asks something → convert question to vector
 * 4. Find the MOST SIMILAR chunks using cosine similarity
 * 5. Send those chunks as CONTEXT to Gemini → "Answer only based on this context"
 * 6. If no relevant context found → politely decline
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// ============================================================
// KNOWLEDGE BASE — CitizenConnect ki saari jankari
// ============================================================
const KNOWLEDGE_BASE = [
  // --- WHAT IS CITIZENCONNECT ---
  {
    id: 'about-1',
    topic: 'About CitizenConnect',
    content: `CitizenConnect is a civic engagement platform that bridges the gap between citizens and government departments. 
    It allows you to report public issues like road damage, water leakage, garbage problems, and social help cases. 
    The platform uses AI (Artificial Intelligence) to automatically analyze your complaint, detect priority level, 
    assign the right government department, and estimate resolution time.`,
    keywords: ['citizenconnect', 'platform', 'what is', 'about', 'purpose', 'app', 'kya hai', 'kyun', 'why']
  },
  {
    id: 'about-2',
    topic: 'How to file a complaint',
    content: `To file a complaint on CitizenConnect:
    1. Go to the Dashboard and click "Report Issue"
    2. Describe your problem in text (any language - Hindi, English, or Hinglish supported)
    3. Optionally upload a photo or video as evidence
    4. The AI will auto-detect your location and categorize the issue
    5. You get a unique Complaint ID (e.g., CC-2024-12345) to track your case
    6. You can track real-time status: Submitted → In Progress → Resolved`,
    keywords: ['complaint', 'file', 'report', 'shikayat', 'kaise', 'how to', 'submit', 'issue', 'problem', 'report issue', 'nayi shikayat']
  },
  {
    id: 'about-3',
    topic: 'Complaint tracking and status',
    content: `Every complaint gets a unique ID. You can track it in "My Complaints" section.
    Status stages are:
    - Submitted: Your complaint has been received and logged
    - In Progress: Government department is working on it
    - Resolved: Issue has been fixed
    You can also view the full timeline showing when each stage happened and estimated resolution time.`,
    keywords: ['track', 'status', 'complaint id', 'progress', 'resolved', 'submitted', 'kab', 'when', 'timeline', 'update']
  },

  // --- COMPLAINT CATEGORIES ---
  {
    id: 'cat-1',
    topic: 'Road and Infrastructure Complaints',
    content: `Road and Infrastructure issues that CitizenConnect handles:
    - Potholes (gadde) in roads
    - Broken footpaths / pavements
    - Damaged street lights
    - Waterlogging after rain
    - Broken traffic signals
    - Open manholes (danger zones)
    - Bridge maintenance issues
    Department: Public Works Department (PWD) / Municipal Corporation
    Typical resolution: 3-7 working days`,
    keywords: ['road', 'pothole', 'gadda', 'light', 'street', 'footpath', 'manhole', 'bridge', 'infrastructure', 'sadak', 'bijli', 'pavement']
  },
  {
    id: 'cat-2',
    topic: 'Water and Sanitation Complaints',
    content: `Water and Sanitation issues handled:
    - Water supply interruption / no water
    - Contaminated or dirty water supply
    - Water pipe leakage on roads
    - Sewage overflow or blocked drains
    - Open drainage causing disease risk
    Department: Delhi Jal Board / Municipal Sanitation Dept
    Typical resolution: 2-5 working days`,
    keywords: ['water', 'pani', 'sewage', 'drain', 'leak', 'pipe', 'supply', 'jal', 'naali', 'ganda', 'contaminated', 'drinking water']
  },
  {
    id: 'cat-3',
    topic: 'Garbage and Waste Management',
    content: `Waste Management issues:
    - Garbage not picked up for multiple days
    - Illegal dumping in open areas
    - Overflowing dustbins
    - Construction debris not removed
    - Burning of garbage causing pollution
    Department: Sanitation / Solid Waste Management Department
    Typical resolution: 1-3 working days`,
    keywords: ['garbage', 'waste', 'dustbin', 'kachra', 'safai', 'cleaning', 'dump', 'pollution', 'smoke', 'trash', 'litter']
  },
  {
    id: 'cat-4',
    topic: 'Social Help Cases',
    content: `Social Help module is for reporting vulnerable people who need immediate help:
    - Homeless/destitute people (especially elderly)
    - People with mental illness on streets
    - Abandoned children
    - Domestic violence cases (anonymous reporting)
    - Accident victims needing help
    The AI analyzes the situation and connects with relevant NGOs and emergency services.
    This is NOT for general civic infrastructure issues.`,
    keywords: ['social', 'help', 'homeless', 'begar', 'madad', 'NGO', 'destitute', 'poor', 'mental', 'accident', 'emergency', 'child', 'woman', 'domestic']
  },
  {
    id: 'cat-5',
    topic: 'Animal Welfare Complaints',
    content: `Animal welfare issues:
    - Injured stray animals (dogs, cats, cattle)
    - Aggressive/rabid stray animals threatening public safety
    - Dead animals not removed from roads
    - Illegal animal cruelty
    Department: Municipal Veterinary Services / Animal Welfare Board
    NGOs: PETA India, Friendicoes, WSD (Wildlife SOS)
    Typical resolution: 24-48 hours for injured animals`,
    keywords: ['animal', 'dog', 'cat', 'janwar', 'stray', 'injured', 'hurt', 'rabid', 'bite', 'cattle', 'cow', 'bull', 'peta', 'welfare']
  },

  // --- GOVERNMENT SCHEMES ---
  {
    id: 'scheme-1',
    topic: 'PM-Kisan Samman Nidhi Scheme',
    content: `PM-Kisan Samman Nidhi:
    - Benefit: Rs. 6000 per year (Rs. 2000 every 4 months) directly to farmer bank accounts
    - Eligibility: Small and marginal farmers across India
    - How to apply: Visit pmkisan.gov.in or register through Common Service Centre (CSC)
    - Registration link: pmkisan.gov.in/RegistrationForm.aspx
    - Started: December 2018 by Government of India
    - Category: Agriculture support scheme`,
    keywords: ['pm kisan', 'kisan', 'farmer', 'kisaan', 'agriculture', 'krishi', '6000', '2000', 'samman nidhi', 'khet', 'farming']
  },
  {
    id: 'scheme-2',
    topic: 'Ayushman Bharat Health Scheme',
    content: `Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY):
    - Benefit: Free health insurance coverage up to Rs. 5 lakh per family per year
    - Covers: 10 crore+ poor and vulnerable families
    - Covers: Over 1500 medical procedures and hospitalizations
    - Eligibility: Families identified in SECC (Socio-Economic Caste Census) 2011 data
    - How to apply: Visit empaneled hospitals or check eligibility at pmjay.gov.in
    - Registration: setu.pmjay.gov.in
    - Category: Health insurance`,
    keywords: ['ayushman', 'health', 'hospital', 'treatment', 'insurance', 'swasthya', 'bimari', 'doctor', 'medical', 'pm jay', 'jan arogya', '5 lakh', 'free']
  },
  {
    id: 'scheme-3',
    topic: 'PM SVANidhi Street Vendor Loan',
    content: `PM Street Vendor's AtmaNirbhar Nidhi (SVANidhi):
    - Benefit: Working capital loans starting from Rs. 10,000 for street vendors
    - Who can apply: Street vendors (rehri/patri waale) in urban areas
    - Loan amounts: Rs. 10,000 → Rs. 20,000 → Rs. 50,000 (on repayment)
    - Interest: Subsidized interest rate with digital transaction incentive
    - How to apply: pmsvanidhi.mohua.gov.in or nearby bank/MFI
    - Category: Economic empowerment of vendors`,
    keywords: ['svanidhi', 'vendor', 'rehri', 'street vendor', 'patri', 'loan', 'karza', 'business', 'small business', 'atmanirbhar', '10000']
  },
  {
    id: 'scheme-4',
    topic: 'Pradhan Mantri Awas Yojana - Housing Scheme',
    content: `Pradhan Mantri Awas Yojana (PMAY) - Housing for All:
    - Benefit: Financial assistance to build or improve homes (up to Rs. 1.5 lakh for rural, more for urban)
    - Eligibility: Below Poverty Line (BPL) families, EWS/LIG categories in urban areas
    - Urban: pmaymis.nic.in
    - Rural: rhreporting.nic.in
    - Documents needed: Aadhar card, income certificate, land ownership proof
    - Category: Housing and shelter`,
    keywords: ['awas', 'housing', 'ghar', 'house', 'home', 'pmay', 'shelter', 'makaan', 'flat', 'construction', 'bpl', 'poor', 'rural', 'urban']
  },
  {
    id: 'scheme-5',
    topic: 'Ujjwala Yojana - Free LPG Connection',
    content: `Pradhan Mantri Ujjwala Yojana:
    - Benefit: Free LPG gas connection to BPL households (primarily women)
    - Purpose: Eliminate health hazards from chulha/wood burning
    - Eligibility: Women from BPL families, 18+ years, no existing LPG connection
    - How to apply: Nearest LPG distributor (HP Gas, Bharat Gas, Indane)
    - Portal: pmuy.gov.in
    - Category: Clean cooking fuel`,
    keywords: ['ujjwala', 'lpg', 'gas', 'cylinder', 'cooking', 'chulha', 'fuel', 'bpl', 'women', 'mahila', 'connection', 'indane', 'bharat gas', 'hp gas']
  },

  // --- DEPARTMENTS ---
  {
    id: 'dept-1',
    topic: 'Government Departments on CitizenConnect',
    content: `Departments available on CitizenConnect platform:
    1. Public Works Department (PWD) - Roads, bridges, public buildings
    2. Delhi Jal Board / Water Dept - Water supply, sewage
    3. Sanitation Department - Garbage, cleanliness
    4. Electricity Department (BSES/TPDDL) - Power supply, street lights
    5. Police Department - Law & order, safety
    6. Health Department - Public health, hospitals
    7. Social Welfare Department - Destitute care, NGO coordination
    8. Animal Welfare - Stray animals, veterinary
    9. Transport Department - Traffic signals, public transport
    10. Environment Department - Pollution, trees, parks`,
    keywords: ['department', 'vibhaag', 'who handles', 'kaun', 'which', 'office', 'authority', 'pwd', 'municipal', 'corporation', 'government']
  },

  // --- INITIATIVES ---
  {
    id: 'init-1',
    topic: 'Community Initiatives and Volunteering',
    content: `CitizenConnect Community Initiatives are citizen-led projects:
    - Yamuna Riverfront Cleaning Drive (Delhi) - Join WhatsApp group for coordination
    - Gurugram Green Belt Tree Plantation - 1000 trees planting project
    - Noida Night Vigilance Safety Group - Volunteer night patrols
    How to join: Go to "Initiatives" section → Click "Join Initiative" to register volunteers
    "Join Community Group" button → Opens WhatsApp/Telegram group for real-time coordination
    Any citizen can propose a new initiative through the platform.`,
    keywords: ['initiative', 'volunteer', 'community', 'join', 'samaj', 'plantation', 'cleaning', 'safety', 'drive', 'pehel', 'swayamsevi', 'group', 'whatsapp']
  },

  // --- DONATIONS ---
  {
    id: 'don-1',
    topic: 'Donations and NGO Support',
    content: `Verified donation portals on CitizenConnect:
    - PM-CARES Fund: Direct government fund for national emergencies (pmcares.gov.in)
    - Milaap: Verified crowdfunding for medical, education (milaap.org)
    - Give India: Curated NGO donations platform (give.do)
    - HelpAge India: Support for elderly destitute (helpageindia.org)
    - Goonj: Cloth, material support for disaster relief (goonj.org)
    All donation links are verified and go directly to official portals. 
    CitizenConnect does NOT collect any money itself.`,
    keywords: ['donate', 'daan', 'charity', 'ngo', 'fund', 'help', 'money', 'contribution', 'relief', 'milaap', 'give', 'pm cares', 'helpageindia']
  },

  // --- ACCOUNT & TECHNICAL ---
  {
    id: 'tech-1',
    topic: 'Account and Login',
    content: `Account related info for CitizenConnect:
    - Registration: Free, requires name, email, phone number
    - Login: Email + password
    - Profile: You can upload avatar, edit contact details
    - Complaint history: All your submitted complaints visible in "My Complaints"
    - Language: Supports English and Hindi (toggle in top bar)
    - Notifications: Get real-time push notifications on complaint status updates`,
    keywords: ['account', 'login', 'register', 'signup', 'password', 'profile', 'email', 'phone', 'notification', 'language', 'hindi', 'english', 'khata']
  },
  {
    id: 'tech-2',
    topic: 'AI Features of CitizenConnect',
    content: `CitizenConnect uses multiple AI technologies:
    1. Gemini AI (by Google): Analyzes complaint text + images, detects category, priority, department
    2. Groq/Llama: Fallback AI if Gemini is unavailable
    3. Computer Vision: Automatically analyzes uploaded photos to detect hazards (pothole, flooding, fire)
    4. Language Detection: Understands Hindi, English, Hinglish, regional languages
    5. This Chatbot: Uses RAG (Retrieval-Augmented Generation) to answer your questions about the platform
    The AI does NOT make final decisions - everything goes through human verification.`,
    keywords: ['ai', 'artificial intelligence', 'gemini', 'bot', 'automatic', 'detect', 'photo analysis', 'image', 'smart', 'technology', 'kaise kaam karta', 'chatbot']
  },
  {
    id: 'tech-3',
    topic: 'Emergency contacts and helplines',
    content: `Emergency contacts you should know:
    - Police: 100
    - Fire Brigade: 101
    - Ambulance: 102 or 108
    - Women Helpline: 1091
    - Child Helpline: 1098
    - Disaster Management: 1078
    - NDMA: 011-26701700
    CitizenConnect is NOT an emergency service. For life-threatening situations, ALWAYS call 100/102 first.
    Use CitizenConnect for non-emergency civic issues.`,
    keywords: ['emergency', 'helpline', 'number', 'call', 'police', 'ambulance', '100', '102', '108', 'fire', 'aapat', 'accident', 'urgent', 'danger']
  }
];

// ============================================================
// SIMPLE TF-IDF BASED SIMILARITY (No API needed for retrieval)
// ============================================================

function textToVector(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
  
  const freq = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });
  return freq;
}

function cosineSimilarity(vecA, vecB) {
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dotProduct = 0, magA = 0, magB = 0;
  
  for (const key of allKeys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function keywordBoost(query, chunk) {
  const q = query.toLowerCase();
  const matchCount = chunk.keywords.filter(kw => q.includes(kw.toLowerCase())).length;
  return matchCount * 0.15;
}

function retrieveRelevantChunks(query, topK = 3, minScore = 0.05) {
  const queryVec = textToVector(query);
  
  const scored = KNOWLEDGE_BASE.map(chunk => {
    const chunkVec = textToVector(chunk.content + ' ' + chunk.keywords.join(' ') + ' ' + chunk.topic);
    const similarity = cosineSimilarity(queryVec, chunkVec);
    const boost = keywordBoost(query, chunk);
    return { chunk, score: similarity + boost };
  });

  return scored
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => ({ ...s.chunk, score: s.score }));
}

// ============================================================
// MAIN CHATBOT FUNCTION
// ============================================================

const ragChatbot = async (userMessage, conversationHistory = []) => {
  console.log(`\n🤖 [CHATBOT] Query: "${userMessage}"`);
  
  const relevantChunks = retrieveRelevantChunks(userMessage, 4);
  console.log(`📚 [CHATBOT] Retrieved ${relevantChunks.length} chunks. Scores:`, relevantChunks.map(c => `${c.id}:${c.score.toFixed(3)}`));
  
  const topScore = relevantChunks[0]?.score || 0;
  const isRelevant = topScore >= 0.06;

  const context = relevantChunks.length > 0
    ? relevantChunks.map((c, i) => `[Source ${i + 1} - ${c.topic}]\n${c.content}`).join('\n\n---\n\n')
    : '';

  const historyStr = conversationHistory.slice(-8).map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n');

  const systemPrompt = `You are "Nagarik Sahayak" (नागरिक सहायक), the official AI assistant for CitizenConnect — 
a civic grievance and government services platform for Indian citizens.

YOUR STRICT RULES:
1. Answer ONLY questions related to CitizenConnect platform, civic issues, government schemes, complaint filing, social help, community initiatives, or emergency helplines.
2. Use the CONTEXT provided below as your primary knowledge source.
3. If the question is NOT related to civics, government, CitizenConnect, or public services → respond with a polite decline.
4. Be concise, helpful, and empathetic. Support Hindi and English both.
5. If suggesting actions, mention specific sections of the app (Dashboard, My Complaints, Initiatives, Schemes, Donations).
6. Never make up information not present in context.
7. For emergencies (police/ambulance) always mention call 100/102.

${context ? `--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n${context}\n--- END OF CONTEXT ---` : ''}

${historyStr ? `--- RECENT CONVERSATION ---\n${historyStr}\n---` : ''}

RESPONSE FORMAT: 
- Answer in the SAME LANGUAGE as the user's question (Hindi → Hindi, English → English, Hinglish → mix)
- Keep response under 150 words
- If actionable, add ONE suggested action at the end
- If out of scope, say exactly: "मैं केवल CitizenConnect और नागरिक सेवाओं से जुड़े सवालों में मदद कर सकता हूँ। / I can only help with CitizenConnect and civic service queries."`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User question: ${userMessage}` }
    ]);
    
    const answer = result.response.text().trim();
    console.log(`✅ [CHATBOT] Answer generated. Relevant: ${isRelevant}`);
    
    return {
      answer,
      sources: relevantChunks.map(c => c.topic),
      isRelevant,
      suggestedActions: detectSuggestedActions(userMessage, relevantChunks),
      confidence: topScore
    };

  } catch (geminiError) {
    console.warn('⚠️ [CHATBOT] Gemini failed, trying Groq...', geminiError.message);
    
    try {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error('GROQ_API_KEY missing');
      
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 250
      }, {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const answer = response.data.choices[0].message.content.trim();
      return {
        answer,
        sources: relevantChunks.map(c => c.topic),
        isRelevant,
        suggestedActions: detectSuggestedActions(userMessage, relevantChunks),
        confidence: topScore
      };
    } catch (groqError) {
      console.error('❌ [CHATBOT] Both AI services failed:', groqError.message);
      return {
        answer: isRelevant 
          ? 'मुझे अभी AI service से connect करने में problem हो रही है। कृपया थोड़ी देर बाद try करें। / Having trouble connecting to AI service. Please try again shortly.'
          : 'मैं केवल CitizenConnect और नागरिक सेवाओं से जुड़े सवालों में मदद कर सकता हूँ। / I can only help with CitizenConnect and civic service queries.',
        sources: [],
        isRelevant,
        suggestedActions: [],
        confidence: 0
      };
    }
  }
};

function detectSuggestedActions(query, chunks) {
  const actions = [];
  const q = query.toLowerCase();
  
  if (chunks.some(c => c.id?.startsWith('cat') || q.includes('complaint') || q.includes('shikayat') || q.includes('report'))) {
    actions.push({ label: 'File a Complaint', view: 'dashboard' });
  }
  if (chunks.some(c => c.id?.startsWith('scheme')) || q.includes('scheme') || q.includes('yojana')) {
    actions.push({ label: 'View Schemes', view: 'schemes' });
  }
  if (chunks.some(c => c.id?.startsWith('init')) || q.includes('volunteer') || q.includes('initiative')) {
    actions.push({ label: 'View Initiatives', view: 'initiatives' });
  }
  if (chunks.some(c => c.id?.startsWith('don')) || q.includes('donat') || q.includes('ngo')) {
    actions.push({ label: 'View Donations', view: 'donations' });
  }
  if (q.includes('track') || q.includes('status') || q.includes('my complaint')) {
    actions.push({ label: 'My Complaints', view: 'my-complaints' });
  }
  
  return actions.slice(0, 2);
}

module.exports = { ragChatbot };
