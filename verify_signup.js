import { signup } from './src/controllers/auth.controller.js';
import { ApiError } from './src/utils/ApiError.js';

// Mock Response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

async function testSignup() {
    console.log("Running Signup Logic Tests...");

    // Test 1: Missing all fields
    const res1 = mockRes();
    await signup({ body: {} }, res1);
    console.log("Test 1 (Missing fields):", res1.statusCode === 400 ? "PASS" : "FAIL", res1.body.message);

    // Test 2: Support for 'phone' instead of 'contact'
    // Note: This test will fail on DB connection if we don't mock the User model,
    // but it should at least pass the initial field validation.
    const res2 = mockRes();
    try {
        await signup({
            body: {
                name: "Test",
                phone: "1234567890",
                email: "test@test.com",
                password: "password"
            }
        }, res2);
    } catch (e) {
        // Expecting DB connection error since we haven't started MongoDB
        if (e.message.includes("buffering timed out") || e.message.includes("topology")) {
            console.log("Test 2 (Phone field validation): PASS (Passed validation, failed on DB as expected)");
        } else {
            console.log("Test 2 (Phone field validation): FAIL", e.message);
        }
    }

    console.log("Tests completed.");
}

testSignup();
