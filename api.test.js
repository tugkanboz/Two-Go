const { TestSuite, TestCase } = require('./2Go');

const suite = new TestSuite();
const testCase = new TestCase('https://www.example.com');

suite.add('Test API endpoint', async () => {
    const response = await testCase.get('/');
    testCase.assertStatusCode(response, 400);
});

suite.run();
