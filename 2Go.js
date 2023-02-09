const axios = require('axios');

class TestSuite {
    constructor() {
        this.tests = [];
    }

    add(name, fn) {
        this.tests.push({ name, fn });
    }

    run() {
        this.tests.forEach(({ name, fn }) => {
            try {
                fn();
                console.log(`PASS: ${name}`);
            } catch (error) {
                console.error(`FAIL: ${name}`);
                console.error(error);
            }
        });
    }
}

class TestCase {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    get(url) {
        return axios.get(this.baseURL + url);
    }

    post(url, data) {
        return axios.post(this.baseURL + url, data);
    }

    put(url, data) {
        return axios.put(this.baseURL + url, data);
    }

    delete(url) {
        return axios.delete(this.baseURL + url);
    }

    async assertStatusCode(response, expectedStatusCode) {
        if (response.status !== expectedStatusCode) {
            throw new Error(`Expected status code ${expectedStatusCode}, but got ${response.status}.`);
        }
    }
}

module.exports = {
    TestSuite,
    TestCase
};
