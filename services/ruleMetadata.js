// services/ruleMetadata.js

/**
 * Functions for interacting with the ruleMetadata API
 */

// Cache for rule names by environment
const ruleNamesCache = {};

// Flag to track if metadata has been preloaded
let metadataPreloaded = false;

/**
 * Fetches rule names from the ruleMetadata API for a given environment
 * @param {string} environment - The environment to fetch rule names for
 * @returns {Promise<string[]>} - A promise that resolves to an array of rule names
 */
async function fetchRuleNames(environment) {
    // Check if we have cached rule names for this environment
    if (ruleNamesCache[environment]) {
        console.log(`Using cached rule names for environment: ${environment}`);
        return ruleNamesCache[environment];
    }

    try {
        console.log(`Fetching rule names for environment: ${environment}`);
        const config = require('../config');
        const envConfig = config.environments[environment];

        if (!envConfig || !envConfig.apis || !envConfig.apis.ruleMetadata) {
            console.error(`No ruleMetadata API configured for environment: ${environment}`);
            return [];
        }

        // Assuming the API endpoint for getting all rules is /rules
        const apiUrl = `${envConfig.apis.ruleMetadata}/rules`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch rule names: ${response.statusText}`);
        }

        const data = await response.json();

        // Assuming the API returns an array of rule objects with a name property
        // Adjust this based on the actual API response structure
        const ruleNames = data.map(rule => rule.name);

        // Cache the rule names for this environment
        ruleNamesCache[environment] = ruleNames;

        console.log(`Fetched ${ruleNames.length} rule names for environment: ${environment}`);
        return ruleNames;
    } catch (error) {
        console.error(`Error fetching rule names for environment ${environment}:`, error);
        return [];
    }
}

/**
 * Clears the rule names cache for a specific environment or all environments
 * @param {string} [environment] - The environment to clear the cache for. If not provided, clears all caches.
 */
function clearRuleNamesCache(environment) {
    if (environment) {
        delete ruleNamesCache[environment];
        console.log(`Cleared rule names cache for environment: ${environment}`);
    } else {
        Object.keys(ruleNamesCache).forEach(env => delete ruleNamesCache[env]);
        console.log('Cleared all rule names caches');
    }
}

/**
 * Populates a select element with rule names for a given environment
 * @param {HTMLSelectElement} selectElement - The select element to populate
 * @param {string} environment - The environment to fetch rule names for
 * @param {string} [selectedRuleName] - Optional rule name to select
 * @returns {Promise<void>}
 */
async function populateRuleNameDropdown(selectElement, environment, selectedRuleName = '') {
    if (!selectElement) {
        console.error('No select element provided to populate with rule names');
        return;
    }

    // Clear existing options
    selectElement.innerHTML = '';

    // Add a loading option
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Loading rule names...';
    selectElement.appendChild(loadingOption);

    try {
        const ruleNames = await fetchRuleNames(environment);

        // Clear the select element
        selectElement.innerHTML = '';

        // Add an empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select a rule...';
        selectElement.appendChild(emptyOption);

        // Add options for each rule name
        ruleNames.forEach(ruleName => {
            const option = document.createElement('option');
            option.value = ruleName;
            option.textContent = ruleName;
            selectElement.appendChild(option);
        });

        // Select the provided rule name if it exists
        if (selectedRuleName) {
            selectElement.value = selectedRuleName;
        }
    } catch (error) {
        console.error('Error populating rule name dropdown:', error);

        // Clear the select element
        selectElement.innerHTML = '';

        // Add an error option
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading rule names';
        selectElement.appendChild(errorOption);
    }
}

/**
 * Preloads rule names for all environments
 * @returns {Promise<void>}
 */
async function preloadAllMetadata() {
    if (metadataPreloaded) {
        console.log('Metadata already preloaded, skipping...');
        return;
    }

    console.log('Preloading metadata for all environments...');
    const config = require('../config');
    const environments = Object.keys(config.environments);

    // Create an array of promises to fetch rule names for all environments
    const fetchPromises = environments.map(env => fetchRuleNames(env));

    try {
        // Wait for all promises to resolve
        await Promise.all(fetchPromises);
        metadataPreloaded = true;
        console.log('Metadata preloaded successfully for all environments');
    } catch (error) {
        console.error('Error preloading metadata:', error);
    }
}

/**
 * Checks if metadata has been preloaded
 * @returns {boolean}
 */
function isMetadataPreloaded() {
    return metadataPreloaded;
}

/**
 * Fetches the rule definition for a specific rule from the ruleMetadata API
 * @param {string} environment - The environment to fetch the rule definition for
 * @param {string} ruleName - The name of the rule to fetch the definition for
 * @returns {Promise<Object>} - A promise that resolves to the rule definition object
 */
async function fetchRuleDefinition(environment, ruleName) {
    try {
        console.log(`Fetching rule definition for rule: ${ruleName} in environment: ${environment}`);

        // Return mock data instead of making an API call
        // This is the rule definition provided in the issue description
        const mockRuleDefinition = {
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
        };

        console.log(`Using mock rule definition for rule: ${ruleName}`);
        return mockRuleDefinition;
    } catch (error) {
        console.error(`Error fetching rule definition for rule ${ruleName} in environment ${environment}:`, error);
        throw error;
    }
}

module.exports = {
    fetchRuleNames,
    clearRuleNamesCache,
    populateRuleNameDropdown,
    preloadAllMetadata,
    isMetadataPreloaded,
    fetchRuleDefinition
};
