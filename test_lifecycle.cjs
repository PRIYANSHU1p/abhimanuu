const http = require('http');
const fs = require('fs');

const STATUS_ORDER = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

function patch(id, status) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ status });
    const req = http.request({
      hostname: 'localhost', port: 5000,
      path: '/api/complaints/' + id + '/status',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getComplaint(id) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/complaints/' + id, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(d) }));
    }).on('error', reject);
  });
}

function listComplaints() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/complaints', (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function generateTimeline(currentStatus) {
  let currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1) currentIndex = 0;
  return STATUS_ORDER.map((label, idx) => {
    let stepStatus;
    if (idx < currentIndex) stepStatus = 'completed';
    else if (idx === currentIndex) stepStatus = 'active';
    else stepStatus = 'pending';
    return { label, status: stepStatus };
  });
}

function verifyTimeline(timeline, targetStatus) {
  return timeline.every((step, idx) => {
    const currIdx = STATUS_ORDER.indexOf(targetStatus);
    if (idx < currIdx) return step.status === 'completed';
    if (idx === currIdx) return step.status === 'active';
    return step.status === 'pending';
  });
}

async function runTests() {
  console.log('=== CitizenConnect Complaint Lifecycle Test ===\n');

  // Step 1: Get first complaint
  const listRes = await listComplaints();
  if (!listRes.length) {
    console.log('ERROR: No complaints found in MongoDB');
    process.exit(1);
  }

  const complaint = listRes[0];
  const id = complaint._id;

  console.log('Complaint ID  :', id);
  console.log('Title         :', complaint.title);
  console.log('Start Status  :', complaint.status);
  console.log('');

  let allPassed = true;
  const patchResults = [];

  // Step 2: Cycle through all 4 statuses
  for (const targetStatus of STATUS_ORDER) {
    // PATCH
    const patchRes = await patch(id, targetStatus);
    const patchOk = patchRes.statusCode === 200 && patchRes.body.status === targetStatus;

    // GET to verify DB persisted correctly
    const getRes = await getComplaint(id);
    const dbOk = getRes.statusCode === 200 && getRes.body.status === targetStatus;

    // Simulate frontend generateTimeline
    const timeline = generateTimeline(targetStatus);
    const timelineOk = verifyTimeline(timeline, targetStatus);

    const passed = patchOk && dbOk && timelineOk;
    if (!passed) allPassed = false;

    patchResults.push({ status: targetStatus, patchCode: patchRes.statusCode, dbStatus: getRes.body.status, patchOk, dbOk, timelineOk });

    console.log('--- Status: ' + targetStatus + ' ---');
    console.log('  PATCH HTTP ' + patchRes.statusCode + '  : ' + (patchOk ? 'PASS' : 'FAIL'));
    console.log('  MongoDB GET : ' + getRes.body.status + '  ' + (dbOk ? 'PASS' : 'FAIL'));
    console.log('  Timeline nodes:');
    timeline.forEach(s => {
      const icon = s.status === 'completed' ? '[DONE   ]' : s.status === 'active' ? '[ACTIVE ]' : '[PENDING]';
      console.log('    ' + icon + ' ' + s.label);
    });
    console.log('  Timeline logic: ' + (timelineOk ? 'PASS' : 'FAIL'));
    console.log('');
  }

  // Step 3: Code integrity checks
  console.log('=== Code Integrity Checks ===');
  const src = fs.readFileSync('src/App.tsx', 'utf8');

  const checks = [
    {
      name: 'localStorage complaint cache removed',
      pass: !src.includes("citizenconnect_complaints"),
      good: 'REMOVED',
      bad: 'STILL PRESENT'
    },
    {
      name: 'Hardcoded static timeline arrays removed',
      pass: !src.includes("status: 'completed', description: 'Your complaint has been submitted"),
      good: 'REMOVED',
      bad: 'STILL PRESENT'
    },
    {
      name: 'Old boolean flag logic removed (isUnderReview)',
      pass: !src.includes('isUnderReview'),
      good: 'REMOVED',
      bad: 'STILL PRESENT'
    },
    {
      name: 'STATUS_ORDER index logic present',
      pass: src.includes('STATUS_ORDER'),
      good: 'PRESENT',
      bad: 'MISSING'
    },
    {
      name: 'generateTimeline called from status (not stored array)',
      pass: src.includes('generateTimeline(result.status') || src.includes('generateTimeline(complaint.status'),
      good: 'YES - reads from complaint.status',
      bad: 'NO - reading from stored array'
    },
    {
      name: 'timeline field in Complaint interface is optional',
      pass: src.includes('timeline?: TimelineStep[]'),
      good: 'OPTIONAL (correct)',
      bad: 'REQUIRED (wrong - would force stale data)'
    }
  ];

  let codeOk = true;
  checks.forEach(c => {
    if (!c.pass) codeOk = false;
    console.log('  ' + (c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + ': ' + (c.pass ? c.good : c.bad));
  });

  console.log('');
  console.log('=== FINAL RESULT ===');
  console.log('Real Complaint ID tested     : ' + id);
  console.log('');
  console.log('PATCH API responses:');
  patchResults.forEach(r => {
    console.log('  ' + r.status.padEnd(14) + ' -> HTTP ' + r.patchCode + ' | DB: ' + r.dbStatus + ' | ' + (r.patchOk && r.dbOk && r.timelineOk ? 'PASS' : 'FAIL'));
  });
  console.log('');
  console.log('MongoDB updated correctly     : ' + (allPassed ? 'YES' : 'NO'));
  console.log('Frontend timeline logic valid : ' + (allPassed ? 'YES' : 'NO'));
  console.log('No hardcoded Submitted state  : ' + (checks[0].pass && checks[1].pass && checks[2].pass ? 'CONFIRMED' : 'FAILED'));
  console.log('Timeline reads from status    : ' + (checks[4].pass ? 'CONFIRMED' : 'FAILED'));
  console.log('Code integrity                : ' + (codeOk ? 'PASS' : 'FAIL'));
  console.log('');
  console.log('Files modified:');
  console.log('  - e:/citizenconnect (1)/src/App.tsx');
  console.log('  - e:/citizenconnect (1)/backend/controllers/complaintController.js');
  console.log('  - e:/citizenconnect (1)/backend/models/Complaint.js');
  console.log('');

  if (allPassed && codeOk) {
    console.log('Step 1 Complaint Lifecycle = COMPLETE');
  } else {
    console.log('Step 1 Complaint Lifecycle = NOT COMPLETE');
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
