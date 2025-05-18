// services/mockDb.js

/**
 * Mock database service to provide mock data for database operations
 */

// Mock data for different database operations
const mockData = {
    // Mock data for requests
    requests: {
        DEV: [
            {
                id: 'mock-request-1',
                name: 'Mock Request 1',
                ruleName: 'CustomerEligibility',
                environment: 'DEV',
                personaType: 'MID',
                personaId: '12345',
                jsonContext: { test: 'data' },
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'mock-request-2',
                name: 'Mock Request 2',
                ruleName: 'LoanApproval',
                environment: 'DEV',
                personaType: 'WID',
                personaId: '67890',
                jsonContext: { test: 'data' },
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        UAT: [
            {
                id: 'mock-request-3',
                name: 'Mock Request 3',
                ruleName: 'CustomerEligibility',
                environment: 'UAT',
                personaType: 'MID',
                personaId: '12345',
                jsonContext: { test: 'data' },
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        PRE_PROD: [],
        PROD: [],
        LOCAL: []
    },
    
    // Mock data for priority suites
    prioritySuites: {
        DEV: [
            {
                id: 'mock-suite-1',
                name: 'Mock Suite 1',
                environment: 'DEV',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'mock-suite-2',
                name: 'Mock Suite 2',
                environment: 'DEV',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        UAT: [
            {
                id: 'mock-suite-3',
                name: 'Mock Suite 3',
                environment: 'UAT',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        PRE_PROD: [],
        PROD: [],
        LOCAL: []
    },
    
    // Mock data for API calls
    apiCalls: {
        DEV: [
            {
                id: 'mock-api-call-1',
                name: 'Mock API Call 1',
                url: 'https://api.example.com/endpoint1',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                environment: 'DEV',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'mock-api-call-2',
                name: 'Mock API Call 2',
                url: 'https://api.example.com/endpoint2',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{"test": "data"}',
                environment: 'DEV',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        UAT: [
            {
                id: 'mock-api-call-3',
                name: 'Mock API Call 3',
                url: 'https://api.example.com/endpoint3',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
                environment: 'UAT',
                status: 'active',
                createdBy: 'admin',
                createdAt: new Date().toISOString()
            }
        ],
        PRE_PROD: [],
        PROD: [],
        LOCAL: []
    }
};

/**
 * Mock implementation of getAllRequests
 * @param {string} environment - The environment to get requests for
 * @returns {Promise<Array>} - A promise that resolves to an array of requests
 */
async function getAllRequests(environment) {
    console.log(`Mock DB: getAllRequests for environment: ${environment}`);
    
    // Return mock data for the specified environment, or an empty array if not found
    return Promise.resolve(mockData.requests[environment] || []);
}

/**
 * Mock implementation of getAllPrioritySuites
 * @param {string} environment - The environment to get priority suites for
 * @returns {Promise<Array>} - A promise that resolves to an array of priority suites
 */
async function getAllPrioritySuites(environment) {
    console.log(`Mock DB: getAllPrioritySuites for environment: ${environment}`);
    
    // Return mock data for the specified environment, or an empty array if not found
    return Promise.resolve(mockData.prioritySuites[environment] || []);
}

/**
 * Mock implementation of getAllApiCalls
 * @param {string} environment - The environment to get API calls for
 * @returns {Promise<Array>} - A promise that resolves to an array of API calls
 */
async function getAllApiCalls(environment) {
    console.log(`Mock DB: getAllApiCalls for environment: ${environment}`);
    
    // Return mock data for the specified environment, or an empty array if not found
    return Promise.resolve(mockData.apiCalls[environment] || []);
}

/**
 * Mock implementation of saveRequest
 * @param {string} environment - The environment to save the request to
 * @param {Object} requestData - The request data to save
 * @returns {Promise<Object>} - A promise that resolves to the saved request
 */
async function saveRequest(environment, requestData) {
    console.log(`Mock DB: saveRequest for environment: ${environment}`);
    
    // Create a new request with a mock ID
    const newRequest = {
        ...requestData,
        id: `mock-request-${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    
    // Add the new request to the mock data
    if (!mockData.requests[environment]) {
        mockData.requests[environment] = [];
    }
    mockData.requests[environment].push(newRequest);
    
    return Promise.resolve(newRequest);
}

/**
 * Mock implementation of savePrioritySuite
 * @param {string} environment - The environment to save the priority suite to
 * @param {Object} suiteData - The priority suite data to save
 * @returns {Promise<Object>} - A promise that resolves to the saved priority suite
 */
async function savePrioritySuite(environment, suiteData) {
    console.log(`Mock DB: savePrioritySuite for environment: ${environment}`);
    
    // Create a new priority suite with a mock ID
    const newSuite = {
        ...suiteData,
        id: `mock-suite-${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    
    // Add the new priority suite to the mock data
    if (!mockData.prioritySuites[environment]) {
        mockData.prioritySuites[environment] = [];
    }
    mockData.prioritySuites[environment].push(newSuite);
    
    return Promise.resolve(newSuite);
}

/**
 * Mock implementation of saveApiCall
 * @param {string} environment - The environment to save the API call to
 * @param {Object} apiCallData - The API call data to save
 * @returns {Promise<Object>} - A promise that resolves to the saved API call
 */
async function saveApiCall(environment, apiCallData) {
    console.log(`Mock DB: saveApiCall for environment: ${environment}`);
    
    // Create a new API call with a mock ID
    const newApiCall = {
        ...apiCallData,
        id: `mock-api-call-${Date.now()}`,
        createdAt: new Date().toISOString()
    };
    
    // Add the new API call to the mock data
    if (!mockData.apiCalls[environment]) {
        mockData.apiCalls[environment] = [];
    }
    mockData.apiCalls[environment].push(newApiCall);
    
    return Promise.resolve(newApiCall);
}

module.exports = {
    getAllRequests,
    getAllPrioritySuites,
    getAllApiCalls,
    saveRequest,
    savePrioritySuite,
    saveApiCall
};