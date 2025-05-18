// services/mockApi.js

/**
 * Mock API service to intercept and mock all API calls
 */

// Flag to determine whether to use mock APIs or real APIs
let useMockApis = true;

// Store original fetch function
const originalFetch = window.fetch;

// Mock data for different API endpoints
const mockData = {
    // Rule Engine API mocks
    ruleEngine: {
        // Mock for /execute endpoint
        execute: (url, options) => {
            console.log(`Mock API: POST ${url}`);
            const requestBody = JSON.parse(options.body);

            return {
                status: 200,
                json: async () => ({
                    result: true,
                    status: 'success',
                    executionTime: '120ms',
                    evaluationData: {
                        customer: {
                            age: 35,
                            salary: 75000,
                            registrationDate: '2019-05-15T00:00:00'
                        },
                        branch: {
                            location: 'Mumbai'
                        },
                        'customer.accounts': {
                            balance: 60000
                        }
                    },
                    ruleName: requestBody.ruleName,
                    environment: requestBody.environment,
                    personaType: requestBody.personaType,
                    personaId: requestBody.personaId,
                    timestamp: new Date().toISOString()
                })
            };
        },

        // Mock for /history endpoint
        history: (url) => {
            console.log(`Mock API: GET ${url}`);

            // Extract ruleName and personaId from URL
            const urlParts = url.split('/');
            const ruleName = urlParts[urlParts.length - 2];
            const personaId = urlParts[urlParts.length - 1];

            return {
                status: 200,
                json: async () => [
                    {
                        timestamp: new Date().toISOString(),
                        status: 'success',
                        result: {
                            ruleName,
                            personaId,
                            result: true,
                            executionTime: '120ms'
                        }
                    },
                    {
                        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                        status: 'success',
                        result: {
                            ruleName,
                            personaId,
                            result: false,
                            executionTime: '115ms'
                        }
                    },
                    {
                        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                        status: 'error',
                        result: {
                            ruleName,
                            personaId,
                            error: 'Data source unavailable',
                            executionTime: '50ms'
                        }
                    }
                ]
            };
        }
    },

    // Rule Metadata API mocks
    ruleMetadata: {
        // Mock for /rules endpoint
        rules: () => {
            console.log('Mock API: GET /rules');

            return {
                status: 200,
                json: async () => [
                    { name: 'CustomerEligibility', description: 'Determines if a customer is eligible for a service' },
                    { name: 'LoanApproval', description: 'Determines if a loan should be approved' },
                    { name: 'FraudDetection', description: 'Detects potentially fraudulent transactions' },
                    { name: 'AccountUpgrade', description: 'Determines if an account is eligible for upgrade' },
                    { name: 'DiscountEligibility', description: 'Determines if a customer is eligible for discounts' }
                ]
            };
        },

        // Mock for /rule/{ruleName} endpoint
        rule: (url) => {
            console.log(`Mock API: GET ${url}`);

            // Extract ruleName from URL
            const urlParts = url.split('/');
            const ruleName = urlParts[urlParts.length - 1];

            return {
                status: 200,
                json: async () => ({
                    "op": "or",
                    "terms": [
                        {
                            "field": {
                                "name": "age",
                                "namespace": "customer",
                                "datasource": "DB1",
                                "evaluation_group": "1"
                            },
                            "comp": "equal to",
                            "value": "3544"
                        },
                        {
                            "field": {
                                "name": "salary",
                                "datasource": "DB1",
                                "namespace": "customer",
                                "evaluation_group": "1"
                            },
                            "comp": "greater than",
                            "value": "5000"
                        },
                        {
                            "field": {
                                "name": "location",
                                "datasource": "WI",
                                "namespace": "branch",
                                "evaluation_group": "2"
                            },
                            "comp": "equal to",
                            "value": "Mumbai"
                        },
                        {
                            "op": "or",
                            "terms": [
                                {
                                    "field": {
                                        "name": "balance",
                                        "datasource": "DB1",
                                        "namespace": "customer.accounts",
                                        "evaluation_group": "3"
                                    },
                                    "comp": "greater than",
                                    "value": "50000"
                                },
                                {
                                    "field": {
                                        "datasource": "DB1",
                                        "name": "registrationDate",
                                        "namespace": "customer",
                                        "evaluation_group": "3"
                                    },
                                    "comp": "greater than",
                                    "value": "2000-03-26T00:00:00"
                                }
                            ]
                        }
                    ]
                })
            };
        }
    },

    // GraphQL API mocks
    graphql: (url, options) => {
        console.log(`Mock API: POST ${url}`);
        const requestBody = JSON.parse(options.body);

        return {
            status: 200,
            json: async () => ({
                data: {
                    // Mock response based on the GraphQL query
                    // This is a simplified example
                    result: 'GraphQL mock response'
                }
            })
        };
    },

    // Query Generator API mocks
    queryGenerator: (url, options) => {
        console.log(`Mock API: POST ${url}`);

        return {
            status: 200,
            json: async () => ({
                query: 'SELECT * FROM customers WHERE id = :id',
                parameters: { id: '12345' }
            })
        };
    },

    // Token refresh mocks
    tokenRefresh: {
        nonProd: () => {
            console.log('Mock API: POST token refresh (non-prod)');

            return {
                status: 200,
                text: async () => 'mock-non-prod-token-' + Date.now()
            };
        },

        prod: () => {
            console.log('Mock API: POST token refresh (prod)');

            return {
                status: 200,
                text: async () => 'mock-prod-token-' + Date.now()
            };
        }
    },

    // Generic mock for any other API
    generic: (url, options) => {
        console.log(`Mock API: ${options.method || 'GET'} ${url}`);

        return {
            status: 200,
            json: async () => ({
                message: 'This is a generic mock response',
                url,
                method: options.method || 'GET',
                headers: options.headers ? Object.fromEntries(options.headers.entries()) : {},
                body: options.body
            }),
            text: async () => 'This is a generic mock response'
        };
    }
};

/**
 * Determines which mock to use based on the URL and options
 * @param {string} url - The URL to fetch
 * @param {Object} options - The fetch options
 * @returns {Object} - The mock response
 */
function getMockResponse(url, options = {}) {
    // Rule Engine API
    if (url.includes('/ruleengine')) {
        if (url.includes('/execute')) {
            return mockData.ruleEngine.execute(url, options);
        } else if (url.includes('/history')) {
            return mockData.ruleEngine.history(url);
        }
    }

    // Rule Metadata API
    if (url.includes('/metadata')) {
        if (url.includes('/rules')) {
            return mockData.ruleMetadata.rules();
        } else if (url.includes('/rule/')) {
            return mockData.ruleMetadata.rule(url);
        }
    }

    // GraphQL API
    if (url.includes('/graphql')) {
        return mockData.graphql(url, options);
    }

    // Query Generator API
    if (url.includes('/query-generator')) {
        return mockData.queryGenerator(url, options);
    }

    // Token refresh
    if (url.includes('/auth/refresh')) {
        if (url.includes('localhost') || url.includes('non-prod')) {
            return mockData.tokenRefresh.nonProd();
        } else {
            return mockData.tokenRefresh.prod();
        }
    }

    // Default to generic mock
    return mockData.generic(url, options);
}

/**
 * Mock implementation of the fetch API
 * @param {string} url - The URL to fetch
 * @param {Object} options - The fetch options
 * @returns {Promise<Response>} - A promise that resolves to a Response object
 */
async function mockFetch(url, options = {}) {
    if (!useMockApis) {
        // Use the original fetch if mock APIs are disabled
        return originalFetch(url, options);
    }

    try {
        // Get the appropriate mock response
        const mockResponse = getMockResponse(url, options);

        // Create a custom response object that mimics the Response interface
        const response = {
            status: mockResponse.status,
            statusText: mockResponse.status === 200 ? 'OK' : 'Error',
            ok: mockResponse.status >= 200 && mockResponse.status < 300,
            headers: new Headers({
                'Content-Type': 'application/json'
            }),

            // Implement json() method
            json: mockResponse.json || (async () => ({})),

            // Implement text() method
            text: mockResponse.text || (async () => ''),

            // Add other methods as needed
            blob: async () => new Blob(),
            arrayBuffer: async () => new ArrayBuffer(0),
            formData: async () => new FormData()
        };

        // Add ability to iterate over headers
        response.headers.forEach = (callback) => {
            response.headers.entries().forEach(([key, value]) => {
                callback(value, key);
            });
        };

        return response;
    } catch (error) {
        console.error('Error in mock fetch:', error);
        throw error;
    }
}

/**
 * Initializes the mock API service
 * @param {boolean} useMock - Whether to use mock APIs or real APIs
 */
function initMockApi(useMock = true) {
    useMockApis = useMock;

    // Replace the global fetch function with our mock
    window.fetch = function(url, options) {
        return mockFetch(url, options);
    };

    console.log(`Mock API service initialized. Using ${useMockApis ? 'mock' : 'real'} APIs.`);
}

/**
 * Restores the original fetch function
 */
function restoreFetch() {
    window.fetch = originalFetch;
    console.log('Original fetch function restored.');
}

/**
 * Toggles between mock and real APIs
 * @returns {boolean} - The new state of useMockApis
 */
function toggleMockApi() {
    useMockApis = !useMockApis;
    console.log(`Switched to ${useMockApis ? 'mock' : 'real'} APIs.`);
    return useMockApis;
}

/**
 * Gets the current state of the mock API service
 * @returns {boolean} - Whether mock APIs are being used
 */
function isUsingMockApi() {
    return useMockApis;
}

module.exports = {
    initMockApi,
    restoreFetch,
    toggleMockApi,
    isUsingMockApi
};
