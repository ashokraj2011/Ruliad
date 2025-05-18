// services/data.js
// Handles database initialization and data retrieval

const db = require('../db');
const config = require('../config');

/**
 * Initialize database tables for the given environment
 */
async function initializeDatabase(environment) {
    try {
        console.log(`services/data.js: Initializing database for environment: ${environment}`);
        const result = await db.initializeDatabase(environment);
        console.log(`services/data.js: Database initialization ${result ? 'succeeded' : 'failed'} for environment: ${environment}`);
        return result;
    } catch (error) {
        console.error(`services/data.js: Database initialization error for environment ${environment}: ${error.message}`);
        console.error('Error details:', error);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        // Don't throw the error - just log it and return false
        // This prevents the error from bubbling up and causing issues
        return false;
    }
}

/**
 * Fetch all requests grouped by environment and rule name
 * Returns an object: { ENV: { ruleName: [request, ...], ... }, ... }
 */
async function getRequestsByEnv() {
    try {
        console.log('Starting getRequestsByEnv to fetch requests for all environments');
        const envs = Object.keys(config.environments);
        console.log(`Found ${envs.length} environments in config:`, envs);

        const result = {};
        for (const env of envs) {
            console.log(`Fetching requests for environment: ${env}`);
            try {
                const rows = await db.getAllRequests(env);
                console.log(`Received ${rows.length} requests for environment: ${env}`);

                result[env] = {};
                rows.forEach(r => {
                    if (!result[env][r.rule_name]) result[env][r.rule_name] = [];
                    result[env][r.rule_name].push(r);
                });

                // Log the number of rules found
                const ruleCount = Object.keys(result[env]).length;
                console.log(`Organized ${rows.length} requests into ${ruleCount} rules for environment: ${env}`);
            } catch (envErr) {
                console.error(`Error loading data for ${env}: ${envErr.message}`);
                console.error('Error details:', envErr);
                result[env] = {}; // Empty but valid result for this environment
            }
        }
        return result;
    } catch (error) {
        console.error('Error in getRequestsByEnv:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return {}; // Return empty object instead of throwing
    }
}

/**
 * Fetch all priority suites
 */
async function getSuites() {
    try {
        console.log(`Fetching priority suites for default environment: ${config.defaultEnvironment}`);
        const suites = await db.getAllPrioritySuites(config.defaultEnvironment);
        console.log(`Received ${suites.length} priority suites for environment: ${config.defaultEnvironment}`);
        return suites;
    } catch (error) {
        console.error(`Error loading suites for environment ${config.defaultEnvironment}:`, error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        return []; // Return empty array instead of throwing
    }
}

module.exports = { initializeDatabase, getRequestsByEnv, getSuites };
