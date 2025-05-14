const { Pool } = require('pg');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Database connection pools for each environment
const dbPools = {};

// Initialize DB connection for the specified environment
function getDbPool(environment) {
  if (!dbPools[environment]) {
    const envConfig = config.environments[environment].db;
    dbPools[environment] = new Pool({
      user: envConfig.user,
      host: envConfig.host,
      database: envConfig.database,
      password: envConfig.password,
      port: envConfig.port,
    });
  }
  return dbPools[environment];
}

// Initialize database with tables if they don't exist
async function initializeDatabase(environment) {
  try {
    const pool = getDbPool(environment);
    const sqlScript = fs.readFileSync(path.join(__dirname, 'db_scripts.sql'), 'utf8');
    await pool.query(sqlScript);
    console.log(`Database tables initialized for ${environment} environment`);
    return true;
  } catch (error) {
    console.error(`Failed to initialize database for ${environment}:`, error);
    return false;
  }
}

// Save a new request to the database
async function saveRequest(environment, request) {
  const pool = getDbPool(environment);
  const query = `
    INSERT INTO requests 
      (name, environment, rule_name, persona_type, persona_id, status, created_by, last_modified_by)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`;

  const values = [
    request.name,
    environment,
    request.ruleName,
    request.personaType,
    request.personaId,
    request.status || 'active',  // Add status with default value if not provided
    request.createdBy,
    request.createdBy
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Save a new priority suite to the database
async function savePrioritySuite(environment, suite) {
  const pool = getDbPool(environment);
  const query = `
    INSERT INTO priority_suites 
      (name, csv_file_path, status, created_by, last_modified_by)
    VALUES 
      ($1, $2, $3, $4, $5)
    RETURNING id`;

  const values = [
    suite.name,
    suite.csvFilePath,
    suite.status || 'active',  // Add status with default value if not provided
    suite.createdBy,
    suite.createdBy
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Update request status
async function updateRequestStatus(environment, requestId, status) {
  const pool = getDbPool(environment);
  const query = `
    UPDATE requests 
    SET status = $1, last_modified_at = CURRENT_TIMESTAMP 
    WHERE id = $2
    RETURNING id`;

  const result = await pool.query(query, [status, requestId]);
  return result.rows[0];
}

// Update priority suite status
async function updatePrioritySuiteStatus(environment, suiteId, status) {
  const pool = getDbPool(environment);
  const query = `
    UPDATE priority_suites 
    SET status = $1, last_modified_at = CURRENT_TIMESTAMP 
    WHERE id = $2
    RETURNING id`;

  const result = await pool.query(query, [status, suiteId]);
  return result.rows[0];
}

// Get all requests for the given environment (optionally filter by status)
async function getRequests(environment, status = 'active') {
  const pool = getDbPool(environment);
  const query = `
    SELECT * FROM requests 
    WHERE environment = $1 AND status = $2
    ORDER BY created_at DESC`;
  
  const result = await pool.query(query, [environment, status]);
  return result.rows;
}

// Get all requests for the given environment (all statuses)
async function getAllRequests(environment) {
  const pool = getDbPool(environment);
  const query = `
    SELECT * FROM requests 
    WHERE environment = $1
    ORDER BY created_at DESC`;
  
  const result = await pool.query(query, [environment]);
  return result.rows;
}

// Get all priority suites (optionally filter by status)
async function getPrioritySuites(environment, status = 'active') {
  const pool = getDbPool(environment);
  const query = `
    SELECT * FROM priority_suites 
    WHERE status = $1
    ORDER BY created_at DESC`;
  
  const result = await pool.query(query, [status]);
  return result.rows;
}

// Get all priority suites (all statuses)
async function getAllPrioritySuites(environment) {
  const pool = getDbPool(environment);
  const query = `SELECT * FROM priority_suites ORDER BY created_at DESC`;
  const result = await pool.query(query);
  return result.rows;
}

// Save run history to the database
async function saveRunHistory(environment, runData) {
  const pool = getDbPool(environment);
  const query = `
    INSERT INTO run_history 
      (run_type, reference_id, environment, graphql_query, response_data, status, execution_time, created_by)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`;

  const values = [
    runData.runType,             // 'request' or 'suite'
    runData.referenceId,         // ID of the request or suite
    environment,
    runData.graphqlQuery,        // The GraphQL query used
    runData.responseData,        // The actual response data as JSON
    runData.status,              // 'success', 'failure', 'partial'
    runData.executionTime,       // Time taken to execute in ms
    runData.createdBy
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get run history for a specific request or suite
async function getRunHistory(environment, runType, referenceId) {
  const pool = getDbPool(environment);
  const query = `
    SELECT * FROM run_history 
    WHERE environment = $1 AND run_type = $2 AND reference_id = $3
    ORDER BY created_at DESC`;
  
  const result = await pool.query(query, [environment, runType, referenceId]);
  return result.rows;
}

// Get all run history for an environment
async function getAllRunHistory(environment) {
  const pool = getDbPool(environment);
  const query = `
    SELECT 
      rh.*,
      CASE 
        WHEN rh.run_type = 'request' THEN r.name
        WHEN rh.run_type = 'suite' THEN ps.name
        ELSE 'Unknown'
      END as item_name
    FROM run_history rh
    LEFT JOIN requests r ON rh.run_type = 'request' AND rh.reference_id = r.id
    LEFT JOIN priority_suites ps ON rh.run_type = 'suite' AND rh.reference_id = ps.id
    WHERE rh.environment = $1
    ORDER BY rh.created_at DESC`;
  
  const result = await pool.query(query, [environment]);
  return result.rows;
}

module.exports = {
  initializeDatabase,
  saveRequest,
  savePrioritySuite,
  updateRequestStatus,
  updatePrioritySuiteStatus,
  getRequests,
  getAllRequests,
  getPrioritySuites,
  getAllPrioritySuites,
  saveRunHistory,
  getRunHistory,
  getAllRunHistory
};

