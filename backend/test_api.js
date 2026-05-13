const axios = require('axios');

async function test() {
    try {
        console.log('--- Testing Signup ---');
        const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
            name: "Test Node",
            email: "node_test_" + Date.now() + "@example.com",
            password: "Password123",
            phone: "1234567890",
            address: "Node City"
        });
        console.log('Signup Result:', signupRes.data.success ? 'SUCCESS' : 'FAILED');
        
        console.log('--- Testing Schemes ---');
        const schemeRes = await axios.get('http://localhost:5000/api/schemes');
        console.log('Schemes Found:', schemeRes.data.data.length);
        
        console.log('--- ALL TESTS PASSED ---');
    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

test();
