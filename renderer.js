const config = require('./config');
const { remote } = require('electron');
const { dialog } = remote;
const path = require('path');
const fs = require('fs');
const db = require('./db');
const components = require('./components');

window.addEventListener('DOMContentLoaded', async () => {
  // Get the logged-in user from localStorage
  const loggedInUser = localStorage.getItem('loggedInUser');
  console.log(`Logged in as: ${loggedInUser}`);

  // Get the current environment
  const currentEnvironment = config.defaultEnvironment;
  const envConfig = config.environments[currentEnvironment];

  // Initialize database for the current environment
  await db.initializeDatabase(currentEnvironment);

  console.log(`Current Environment: ${currentEnvironment}`);
  console.log(`Rule Engine API: ${envConfig.apis.ruleEngine}`);
  console.log(`GraphQL Endpoint: ${envConfig.apis.graphql}`);
  console.log(`DB Host: ${envConfig.db.host}`);

  // Setup UI elements
  const requestDialog = document.getElementById('request-dialog');
  const requestForm = document.getElementById('request-form');
  const suiteDialog = document.getElementById('suite-dialog');
  const suiteForm = document.getElementById('suite-form');
  const detailsElement = document.getElementById('details');

  // Initialize form components
  components.initRequestForm(
    requestDialog,
    requestForm,
    db.saveRequest,
    loadRequests,
    loggedInUser
  );

  components.initSuiteForm(
    suiteDialog,
    suiteForm,
    db.savePrioritySuite,
    loadPrioritySuites,
    currentEnvironment,
    loggedInUser,
    dialog
  );

  // Function to handle executing a single request
  async function executeRequest(requestId, requestData) {
    try {
      detailsElement.textContent = `Executing request: ${requestData.name}...`;

      // Construct GraphQL query based on request data
      const graphqlQuery = `query {
        ruleEvaluation(
          ruleName: "${requestData.ruleName}"
          personaType: "${requestData.personaType}"
          personaId: "${requestData.personaId}"
        ) {
          result
          explanation
          metadata
        }
      }`;

      const startTime = Date.now();

      // Call the GraphQL API
      const response = await fetchGraphQLData(
        envConfig.apis.graphql, 
        graphqlQuery
      );

      const executionTime = Date.now() - startTime;

      // Save run history
      const runData = {
        runType: 'request',
        referenceId: requestId,
        graphqlQuery: graphqlQuery,
        responseData: response || { error: 'No response received' },
        status: response && !response.errors ? 'success' : 'failure',
        executionTime: executionTime,
        createdBy: loggedInUser
      };

      await db.saveRunHistory(requestData.environment, runData);

      // Display the results
      detailsElement.textContent = JSON.stringify({
        request: requestData,
        query: graphqlQuery,
        response: response,
        executionTime: `${executionTime}ms`
      }, null, 2);

      return response;
    } catch (error) {
      console.error('Error executing request:', error);
      detailsElement.textContent = `Error executing request: ${error.message}`;

      // Save error in run history
      const runData = {
        runType: 'request',
        referenceId: requestId,
        graphqlQuery: graphqlQuery || 'Error generating query',
        responseData: { error: error.message },
        status: 'failure',
        executionTime: 0,
        createdBy: loggedInUser
      };

      await db.saveRunHistory(requestData.environment, runData);

      return null;
    }
  }

  // Function to handle executing a priority suite
  async function executePrioritySuite(suiteId, suiteData) {
    try {
      detailsElement.textContent = `Executing priority suite: ${suiteData.name}...`;

      // Read CSV file
      const csvContent = fs.readFileSync(suiteData.csvFilePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Parse headers
      const headers = lines[0].split(',').map(header => header.trim());

      const results = [];
      const startTime = Date.now();
      let successCount = 0;
      let failureCount = 0;

      // Process each line in CSV
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.trim());
        const lineData = {};

        // Create object from CSV line
        headers.forEach((header, index) => {
          lineData[header] = values[index] || '';
        });

        // Construct GraphQL query for this line
        const graphqlQuery = `query {
          ruleEvaluation(
            ruleName: "${lineData.ruleName || ''}"
            personaType: "${lineData.personaType || ''}"
            personaId: "${lineData.personaId || ''}"
          ) {
            result
            explanation
            metadata
          }
        }`;

        try {
          // Call the GraphQL API
          const response = await fetchGraphQLData(
            envConfig.apis.graphql, 
            graphqlQuery
          );

          results.push({
            lineData,
            query: graphqlQuery,
            response,
            success: response && !response.errors
          });

          if (response && !response.errors) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          results.push({
            lineData,
            query: graphqlQuery,
            error: error.message,
            success: false
          });
          failureCount++;
        }
      }

      const executionTime = Date.now() - startTime;
      const status = failureCount === 0 ? 'success' : (successCount === 0 ? 'failure' : 'partial');

      // Save run history
      const runData = {
        runType: 'suite',
        referenceId: suiteId,
        graphqlQuery: JSON.stringify(results.map(r => r.query).slice(0, 10)) + (results.length > 10 ? '...' : ''),
        responseData: {
          totalLines: lines.length - 1,
          successCount,
          failureCount,
          results: results.slice(0, 10), // Limit to first 10 results to avoid DB size issues
          truncated: results.length > 10
        },
        status: status,
        executionTime: executionTime,
        createdBy: loggedInUser
      };

      await db.saveRunHistory(currentEnvironment, runData);

      // Display the results
      detailsElement.textContent = JSON.stringify({
        suite: suiteData,
        executionSummary: {
          totalLines: lines.length - 1,
          successCount,
          failureCount,
          executionTime: `${executionTime}ms`
        },
        results: results
      }, null, 2);

      return results;
    } catch (error) {
      console.error('Error executing priority suite:', error);
      detailsElement.textContent = `Error executing priority suite: ${error.message}`;

      // Save error in run history
      const runData = {
        runType: 'suite',
        referenceId: suiteId,
        graphqlQuery: 'Error processing suite',
        responseData: { error: error.message },
        status: 'failure',
        executionTime: 0,
        createdBy: loggedInUser
      };

      await db.saveRunHistory(currentEnvironment, runData);

      return null;
    }
  }

  // Function to display run history
  async function showRunHistory(runType, itemId, itemName) {
    try {
      const history = await db.getRunHistory(currentEnvironment, runType, itemId);

      if (history.length === 0) {
        detailsElement.textContent = `No execution history found for ${runType} '${itemName}'`;
        return;
      }

      detailsElement.textContent = `Execution History for ${runType} '${itemName}':\n\n` + 
        JSON.stringify(history.map(h => ({
          id: h.id,
          timestamp: h.created_at,
          status: h.status,
          executionTime: `${h.execution_time}ms`,
          query: h.graphql_query.substring(0, 100) + (h.graphql_query.length > 100 ? '...' : ''),
          response: h.response_data
        })), null, 2);
    } catch (error) {
      console.error('Error fetching run history:', error);
      detailsElement.textContent = `Error fetching run history: ${error.message}`;
    }
  }

  // Load requests and priority suites on startup
  async function loadRequests() {
    try {
      const requests = await db.getRequests(currentEnvironment);
      displayRequests(requests);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }

  async function loadPrioritySuites() {
    try {
      const suites = await db.getPrioritySuites(currentEnvironment);
      displayPrioritySuites(suites);
    } catch (error) {
      console.error('Error loading priority suites:', error);
    }
  }

  function displayRequests(requests) {
    const requestsTree = document.getElementById('requests-tree');
    components.displayRequests(
      requests, 
      requestsTree, 
      executeRequest, 
      showRunHistory, 
      toggleRequestStatus, 
      detailsElement
    );
  }

  function displayPrioritySuites(suites) {
    const suitesTree = document.getElementById('suites-tree');
    components.displayPrioritySuites(
      suites, 
      suitesTree, 
      executePrioritySuite, 
      showRunHistory, 
      toggleSuiteStatus, 
      detailsElement
    );
  }

  // Function to toggle request status (active/inactive)
  async function toggleRequestStatus(requestId, currentStatus) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await db.updateRequestStatus(currentEnvironment, requestId, newStatus);
      loadRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status: ' + error.message);
    }
  }

  // Function to toggle suite status (active/inactive)
  async function toggleSuiteStatus(suiteId, currentStatus) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await db.updatePrioritySuiteStatus(currentEnvironment, suiteId, newStatus);
      loadPrioritySuites(); // Refresh the list
    } catch (error) {
      console.error('Error updating suite status:', error);
      alert('Failed to update suite status: ' + error.message);
    }
  }

  // Initial load
  loadRequests();
  loadPrioritySuites();
});

// Use the GraphQL API
async function fetchGraphQLData(endpoint, query) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    console.log('GraphQL Data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching GraphQL data:', error);
    throw error;
  }
}
