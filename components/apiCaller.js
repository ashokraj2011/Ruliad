// components/apiCaller.js

function setupApiCallerPanel() {
    // Get DOM elements
    const apiUrlInput = document.getElementById('api-url');
    const apiMethodSelect = document.getElementById('api-method');
    const apiHeadersTableBody = document.querySelector('#api-headers-table tbody');
    const addHeaderBtn = document.getElementById('add-header-btn');
    const apiRequestBodyTextarea = document.getElementById('api-request-body');
    const sendApiRequestBtn = document.getElementById('send-api-request-btn');
    const apiResponseArea = document.getElementById('api-response-area');
    const apiCallerForm = document.getElementById('api-caller-form');
    const requestTabs = document.getElementById('request-tabs');
    const responseTabs = document.querySelector('.response-tabs');
    const responseStatus = document.querySelector('.response-status');
    const responseTime = document.querySelector('.response-time');

    // Auth elements
    const authTypeSelect = document.getElementById('auth-type');
    const basicAuthFields = document.getElementById('basic-auth-fields');
    const bearerAuthFields = document.getElementById('bearer-auth-fields');
    const apiKeyFields = document.getElementById('api-key-fields');
    const basicAuthUsername = document.getElementById('basic-auth-username');
    const basicAuthPassword = document.getElementById('basic-auth-password');
    const bearerToken = document.getElementById('bearer-token');
    const apiKeyName = document.getElementById('api-key-name');
    const apiKeyValue = document.getElementById('api-key-value');
    const apiKeyLocation = document.getElementById('api-key-location');

    // Query parameters elements
    const apiParamsTableBody = document.querySelector('#api-params-table tbody');
    const addParamBtn = document.getElementById('add-param-btn');

    if (!apiCallerForm) {
        console.warn('API Caller panel elements not found. Skipping setup.');
        return;
    }

    // Setup tabs functionality
    function setupTabs() {
        // Request tabs
        if (requestTabs) {
            const tabs = requestTabs.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    tab.classList.add('active');

                    // Hide all tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    // Show the corresponding tab content
                    const tabId = tab.getAttribute('data-tab');
                    const tabContent = document.getElementById(`${tabId}-tab`);
                    if (tabContent) {
                        tabContent.classList.add('active');
                    }
                });
            });
        }

        // Response tabs
        if (responseTabs) {
            const tabs = responseTabs.querySelectorAll('.response-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    tab.classList.add('active');

                    // For now, we only have one response area
                    // In the future, we can add separate areas for body and headers
                });
            });
        }
    }

    // Function to add a new header row
    const addHeaderRow = (key = '', value = '') => {
        const row = apiHeadersTableBody.insertRow();
        row.innerHTML = `
            <td><input type="text" placeholder="Key" class="api-header-key" value="${key}" /></td>
            <td><input type="text" placeholder="Value" class="api-header-value" value="${value}" /></td>
            <td><button type="button" class="remove-header-btn">✖</button></td>
        `;
        row.querySelector('.remove-header-btn').addEventListener('click', () => {
            row.remove();
        });
    };

    // Function to add a new query parameter row
    const addParamRow = (key = '', value = '') => {
        const row = apiParamsTableBody.insertRow();
        row.innerHTML = `
            <td><input type="text" placeholder="Key" class="api-param-key" value="${key}" /></td>
            <td><input type="text" placeholder="Value" class="api-param-value" value="${value}" /></td>
            <td><button type="button" class="remove-param-btn">✖</button></td>
        `;
        row.querySelector('.remove-param-btn').addEventListener('click', () => {
            row.remove();
        });
    };

    // Function to handle auth type selection
    const handleAuthTypeChange = () => {
        // Hide all auth fields
        basicAuthFields.classList.add('hidden');
        bearerAuthFields.classList.add('hidden');
        apiKeyFields.classList.add('hidden');

        // Show the selected auth fields
        const authType = authTypeSelect.value;
        switch (authType) {
            case 'basic':
                basicAuthFields.classList.remove('hidden');
                break;
            case 'bearer':
                bearerAuthFields.classList.remove('hidden');
                break;
            case 'api-key':
                apiKeyFields.classList.remove('hidden');
                break;
        }
    };

    // Add initial empty header row
    addHeaderRow();

    // Add initial empty parameter row
    addParamRow();

    // Event listener for adding headers
    addHeaderBtn.addEventListener('click', () => addHeaderRow());

    // Event listener for adding parameters
    addParamBtn.addEventListener('click', () => addParamRow());

    // Event listener for auth type selection
    authTypeSelect.addEventListener('change', handleAuthTypeChange);

    // Call handleAuthTypeChange initially to set up the correct fields
    handleAuthTypeChange();

    // Function to update response status display
    const updateResponseStatus = (status, timeMs) => {
        if (!responseStatus || !responseTime) return;

        // Clear existing classes
        responseStatus.className = 'response-status';

        // Add appropriate status class
        if (status >= 200 && status < 300) {
            responseStatus.classList.add('status-success');
        } else if (status >= 400) {
            responseStatus.classList.add('status-error');
        } else {
            responseStatus.classList.add('status-warning');
        }

        // Update text
        responseStatus.textContent = `${status}`;
        responseTime.textContent = `${timeMs}ms`;
    };

    // Event listener for sending the API request
    apiCallerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        apiResponseArea.textContent = 'Loading...';
        responseStatus.textContent = 'Sending request...';
        responseTime.textContent = '';

        let url = apiUrlInput.value;
        const method = apiMethodSelect.value;
        const body = apiRequestBodyTextarea.value;

        // Collect headers
        const headers = {};
        apiHeadersTableBody.querySelectorAll('tr').forEach(row => {
            const keyInput = row.querySelector('.api-header-key');
            const valueInput = row.querySelector('.api-header-value');
            if (keyInput && valueInput) {
                const key = keyInput.value.trim();
                if (key) {
                    headers[key] = valueInput.value.trim();
                }
            }
        });

        // Collect query parameters
        const queryParams = new URLSearchParams();
        let hasQueryParams = false;
        apiParamsTableBody.querySelectorAll('tr').forEach(row => {
            const keyInput = row.querySelector('.api-param-key');
            const valueInput = row.querySelector('.api-param-value');
            if (keyInput && valueInput) {
                const key = keyInput.value.trim();
                if (key) {
                    queryParams.append(key, valueInput.value.trim());
                    hasQueryParams = true;
                }
            }
        });

        // Add query parameters to URL
        if (hasQueryParams) {
            // Check if URL already has query parameters
            const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
            const existingParams = urlObj.searchParams;

            // Merge existing params with new ones
            for (const [key, value] of queryParams.entries()) {
                existingParams.append(key, value);
            }

            // Update URL
            url = urlObj.toString();

            // If we added http:// as a prefix and it wasn't there originally, remove it
            if (!apiUrlInput.value.includes('://') && url.startsWith('http://')) {
                url = url.substring(7);
            }
        }

        // Apply authentication
        const authType = authTypeSelect.value;
        switch (authType) {
            case 'basic':
                const username = basicAuthUsername.value.trim();
                const password = basicAuthPassword.value.trim();
                if (username) {
                    const base64Credentials = btoa(`${username}:${password}`);
                    headers['Authorization'] = `Basic ${base64Credentials}`;
                }
                break;
            case 'bearer':
                const token = bearerToken.value.trim();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                break;
            case 'api-key':
                const keyName = apiKeyName.value.trim();
                const keyValue = apiKeyValue.value.trim();
                const keyLocation = apiKeyLocation.value;

                if (keyName && keyValue) {
                    if (keyLocation === 'header') {
                        headers[keyName] = keyValue;
                    } else if (keyLocation === 'query' && !queryParams.has(keyName)) {
                        // Add to URL if not already added through query params
                        const urlObj = new URL(url.includes('://') ? url : `http://${url}`);
                        urlObj.searchParams.append(keyName, keyValue);
                        url = urlObj.toString();

                        // If we added http:// as a prefix and it wasn't there originally, remove it
                        if (!apiUrlInput.value.includes('://') && url.startsWith('http://')) {
                            url = url.substring(7);
                        }
                    }
                }
                break;
        }

        // Ensure Content-Type is set for methods that typically have a body
        if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body) {
            if (!Object.keys(headers).some(hKey => hKey.toLowerCase() === 'content-type')) {
                headers['Content-Type'] = 'application/json'; // Default to JSON
            }
        }

        const requestOptions = {
            method: method,
            headers: new Headers(headers),
        };

        if (method !== 'GET' && method !== 'HEAD' && body) {
            requestOptions.body = body;
        }

        const startTime = performance.now();

        try {
            const response = await fetch(url, requestOptions);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            const responseBody = await response.text();
            let formattedBody = responseBody;
            try {
                // Try to parse and pretty-print if JSON
                formattedBody = JSON.stringify(JSON.parse(responseBody), null, 2);
            } catch (e) {
                // Not JSON, or malformed JSON, leave as text
            }

            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            // Update response status display
            updateResponseStatus(response.status, responseTime);

            // Update response body
            apiResponseArea.textContent = formattedBody;

            // Store headers for tab switching (future enhancement)
            apiResponseArea.dataset.headers = JSON.stringify(responseHeaders);
            apiResponseArea.dataset.status = `${response.status} ${response.statusText}`;
        } catch (error) {
            updateResponseStatus(0, 0);
            responseStatus.textContent = 'Error';
            apiResponseArea.textContent = `Error: ${error.message}\n\nStack Trace:\n${error.stack}`;
        }
    });

    // Initialize tabs
    setupTabs();

    // Event listener for saving the API request
    const saveApiRequestBtn = document.getElementById('save-api-request');
    if (saveApiRequestBtn) {
        saveApiRequestBtn.addEventListener('click', async () => {
            const url = apiUrlInput.value;
            if (!url) {
                alert('Please enter a URL');
                return;
            }

            const method = apiMethodSelect.value;
            const body = apiRequestBodyTextarea.value;

            // Collect headers
            const headers = {};
            apiHeadersTableBody.querySelectorAll('tr').forEach(row => {
                const keyInput = row.querySelector('.api-header-key');
                const valueInput = row.querySelector('.api-header-value');
                if (keyInput && valueInput) {
                    const key = keyInput.value.trim();
                    if (key) {
                        headers[key] = valueInput.value.trim();
                    }
                }
            });

            // Collect query parameters
            const queryParams = {};
            apiParamsTableBody.querySelectorAll('tr').forEach(row => {
                const keyInput = row.querySelector('.api-param-key');
                const valueInput = row.querySelector('.api-param-value');
                if (keyInput && valueInput) {
                    const key = keyInput.value.trim();
                    if (key) {
                        queryParams[key] = valueInput.value.trim();
                    }
                }
            });

            // Collect authentication settings
            const auth = {
                type: authTypeSelect.value
            };

            // Add auth details based on type
            switch (auth.type) {
                case 'basic':
                    auth.username = basicAuthUsername.value.trim();
                    auth.password = basicAuthPassword.value.trim();
                    break;
                case 'bearer':
                    auth.token = bearerToken.value.trim();
                    break;
                case 'api-key':
                    auth.keyName = apiKeyName.value.trim();
                    auth.keyValue = apiKeyValue.value.trim();
                    auth.keyLocation = apiKeyLocation.value;
                    break;
            }

            // Prompt for a name for the API request
            const name = prompt('Enter a name for this API request:');
            if (!name) return; // User cancelled

            // Get the current environment
            const environment = require('../config').defaultEnvironment;

            const apiCallData = {
                name,
                environment,
                url,
                method,
                headers,
                body,
                queryParams,
                auth,
                status: 'active',
                createdBy: localStorage.getItem('loggedInUser') || 'admin',
            };

            try {
                await require('../db').saveApiCall(environment, apiCallData);
                alert('API request saved successfully!');

                // Refresh the API Calls tree if the function is available
                if (typeof window.loadAndRenderApiCalls === 'function') {
                    window.loadAndRenderApiCalls();
                } else if (typeof loadAndRenderApiCalls === 'function') {
                    loadAndRenderApiCalls();
                }
            } catch (err) {
                console.error('Error saving API Call:', err);
                require('@electron/remote').dialog.showErrorBox('Save Error', err.message);
            }
        });
    }
}

module.exports = { setupApiCallerPanel };
