const classifyComplaint = (text) => {
    const input = text.toLowerCase();
    
    let category = 'General Inquiry';
    let department = 'Municipality General Desk';
    let priority = 'Normal';
    let estimatedResolution = '3 - 5 Working Days';

    // 2. CATEGORY DETECTION & 3. AUTO DEPARTMENT ASSIGNMENT
    if (input.includes('water') || input.includes('leakage') || input.includes('pipe') || input.includes('drainage') || input.includes('sewage')) {
        category = 'Public Utility - Water/Sewage';
        department = 'Water Department';
        priority = 'Critical';
    } else if (input.includes('light') || input.includes('wire') || input.includes('transformer') || input.includes('electric') || input.includes('pole')) {
        category = 'Energy & Electricity';
        department = 'Electricity Board (EB)';
        priority = 'Medium';
    } else if (input.includes('garbage') || input.includes('waste') || input.includes('dirty')) {
        category = 'Sanitation';
        department = 'Municipal Corporation';
        priority = 'Low';
    } else if (input.includes('accident') || input.includes('fire') || input.includes('emergency')) {
        category = 'Safety';
        department = 'Emergency Services';
        priority = 'Critical';
    } else if (input.includes('road') || input.includes('pothole') || input.includes('damage') || input.includes('traffic') || input.includes('sadak') || input.includes('rasta')) {
        category = 'Public Infrastructure - Roads';
        department = 'PWD';
        priority = 'High';
    } else if (input.includes('dog') || input.includes('cow') || input.includes('janwar') || input.includes('animal') || input.includes('cat') || input.includes('rescue')) {
        category = 'Animal Welfare';
        department = 'Animal Control Support';
        priority = 'Normal';
    } else if (input.includes('social') || input.includes('domestic') || input.includes('harassment') || input.includes('dispute') || input.includes('abuse')) {
        category = 'Social Help';
        department = 'Community Support Services';
        priority = 'High';
    }

    // 4. PRIORITY PREDICTION overrides
    if (input.includes('wire fell on road')) {
        priority = 'Critical';
    } else if (input.includes('street light not working')) {
        priority = 'Medium';
    } else if (input.includes('small pothole')) {
        priority = 'Low';
    }

    // 5. ETA PREDICTION based on priority
    if (priority === 'Low') {
        estimatedResolution = '5 - 7 Days';
    } else if (priority === 'Medium' || priority === 'Normal') {
        estimatedResolution = '3 - 5 Working Days';
    } else if (priority === 'High') {
        estimatedResolution = '24 - 48 Hours';
    } else if (priority === 'Critical') {
        estimatedResolution = 'Immediate Action Required';
    }

    return { category, department, priority, estimatedResolution };
};

module.exports = { classifyComplaint };
