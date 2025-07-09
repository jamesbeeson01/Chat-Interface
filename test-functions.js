const { textGetter, treatment } = require('./bots');
const { getTitles } = require('./database');

// Test function runner
async function testFunctions() {
    console.log('=== Testing Functions ===\n');
    
    try {
        // Test 1: getTitles
        console.log('1. Testing getTitles...');
        const titlesData = await getTitles();
        console.log('Number of titles:', titlesData.length);
        console.log('First few titles:', titlesData.slice(0, 3));
        console.log('---\n');
        
        // Test 2: textGetter (simplified)
        console.log('2. Testing textGetter...');
        const testContents = [
            { role: 'user', text: 'Lets switch topics to morality' }
        ];
        const { titles, textbookPrompt, hasFunction } = await textGetter(testContents);
        
        if (hasFunction) {
            console.log('✓ Function call made successfully');
            console.log('Suggested titles:', titles || 'None');
            console.log(textbookPrompt.substring(0, 200));
        } else {
            console.log('ℹ No function call made');
        }

        console.log('---\n');
        
        // Test 3: treatment function
        console.log('3. Testing treatment function...');
        const treatmentContents = [{ 
            role: 'user', 
            parts: [{ text: 'Can we go over Chapter 11 content?' }]
        }];
        const treatmentResult = await treatment(treatmentContents, 'Chapter 11');
        
        if (treatmentResult && treatmentResult.text) {
            console.log('✓ Treatment response generated');
            console.log('Response length:', treatmentResult.text.length, 'characters');
            console.log('First 100 characters:', treatmentResult.text.substring(0, 100) + '...');
        } else {
            console.log('❌ No response from treatment function');
        }
        
        if (treatmentResult && treatmentResult.error) {
            console.log('❌ Error occurred:', treatmentResult.error);
        }
        console.log('---\n');
        
        // Add more tests as needed
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run the tests
testFunctions();
