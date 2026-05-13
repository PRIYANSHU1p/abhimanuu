
const http = require('http');

http.get('http://localhost:5000/api/complaints', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const complaints = JSON.parse(data);
            // Sort by createdAt descending
            complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const last = complaints[0];
            console.log("NEWEST COMPLAINT:", JSON.stringify(last, null, 2));
        } catch (e) {
            console.error("Parse error:", e);
        }
    });
}).on('error', (err) => {
    console.error(err);
});
