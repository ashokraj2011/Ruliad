// services/data.js
// Handles database initialization and data retrieval

const db = require('../db');
const config = require('../config');

/**
 * Initialize database tables for the given environment
 */
async function initializeDatabase(environment) {
    return db.initializeDatabase(environment);
}

/**
 * Fetch all requests grouped by environment and rule name
 * Returns an object: { ENV: { ruleName: [request, ...], ... }, ... }
 */
async function getRequestsByEnv() {
    const envs = Object.keys(config.environments);
    const result = {};
    for (const env of envs) {
        const rows = await db.getAllRequests(env);
        result[env] = {};
        rows.forEach(r => {
            if (!result[env][r.rule_name]) result[env][r.rule_name] = [];
            result[env][r.rule_name].push(r);
        });
    }
    return result;
}

/**
 * Fetch all priority suites
 */
async function getSuites() {
    return db.getAllPrioritySuites(config.defaultEnvironment);
}

module.exports = { initializeDatabase, getRequestsByEnv, getSuites };

