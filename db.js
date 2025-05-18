const { Pool } = require('pg');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Database connection pools for each environment
const dbPools = {};

// Initialize DB connection for the specified environment
function getDbPool(environment) {
  // Always use DEV if the requested environment doesn't exist in config
  const safeEnvironment = config.environments[environment] ? environment : 'DEV';
  
  if (!dbPools[safeEnvironment]) {
    const envConfig = config.environments[safeEnvironment].db;
    dbPools[safeEnvironment] = new Pool({
      user: envConfig.user,
      host: envConfig.host,
      database: envConfig.database,
      password: envConfig.password,
      port: envConfig.port,
    });
    
    console.log(`Created DB pool for ${safeEnvironment} environment`);
  }
  return dbPools[safeEnvironment];
}

// Initialize the database (create tables if they don't exist)
async function initializeDatabase(environment) {
  const pool = getDbPool(environment);
  
  try {
    console.log(`Initializing database for ${environment}...`);
    
    // Read the SQL scripts
    const sqlScript = fs.readFileSync(path.join(__dirname, 'db_scripts.sql'), 'utf8');
    
    // Execute the script
    await pool.query(sqlScript);
    console.log('Database tables created or verified');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Save a request to the database
async function saveRequest(environment, request) {
  try {
    // All metadata is stored in DEV environment database, 
    // but we track which environment the request is for
    const pool = getDbPool('DEV');
    console.log(`Saving request metadata for ${environment} environment to DEV database:`, request);
    
    const query = `
      INSERT INTO requests 
        (name, environment, rule_name, persona_type, persona_id, json_context, status, created_by, last_modified_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`;

    const values = [
      request.name,
      request.environment, // Store the selected environment as metadata
      request.ruleName,
      request.personaType,
      request.personaId,
      request.jsonContext || {},
      request.status || 'active',
      request.createdBy,
      request.createdBy
    ];
    
    const result = await pool.query(query, values);
    console.log('Database result:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in saveRequest:', error);
    throw error;
  }
}

// Save a priority suite to the database
async function savePrioritySuite(environment, suite) {
  try {
    // Always save to DEV environment
    const pool = getDbPool('DEV');
    console.log(`Saving priority suite to DEV database:`, suite);
    
    const query = `
      INSERT INTO priority_suites 
        (name, csv_file_path, status, created_by, last_modified_by)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING id`;

    const values = [
      suite.name,
      suite.csvFilePath,
      suite.status || 'active',
      suite.createdBy,
      suite.createdBy
    ];
    
    const result = await pool.query(query, values);
    console.log('Database result:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in savePrioritySuite:', error);
    throw error;
  }
}

// Update request status - also operates on DEV database
async function updateRequestStatus(environment, requestId, status, modifiedBy) {
  try {
    // Status updates are also stored in DEV database
    const pool = getDbPool('DEV');
    const query = `
      UPDATE requests 
      SET status = $1, 
          last_modified_by = $2,
          last_modified_at = CURRENT_TIMESTAMP 
      WHERE id = $3
      RETURNING id`;

    const values = [status, modifiedBy, requestId];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in updateRequestStatus:', error);
    throw error;
  }
}

// Update priority suite status
async function updatePrioritySuiteStatus(environment, suiteId, status, modifiedBy) {
  try {
    const pool = getDbPool(environment);
    const query = `
      UPDATE priority_suites 
      SET status = $1, 
          last_modified_by = $2,
          last_modified_at = CURRENT_TIMESTAMP 
      WHERE id = $3
      RETURNING id`;

    const values = [status, modifiedBy, suiteId];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in updatePrioritySuiteStatus:', error);
    throw error;
  }
}

// Get requests with optional filters
async function getRequests(environment, filters = {}) {
  try {
    const pool = getDbPool(environment);
    let query = 'SELECT * FROM requests WHERE environment = $1';
    const values = [environment];
    
    let paramIndex = 2;
    
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      query += ` AND created_by = $${paramIndex}`;
      values.push(filters.createdBy);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database error in getRequests:', error);
    throw error;
  }
}

// Get all requests for an environment
async function getAllRequests(environment) {
  try {
    // All metadata is stored in DEV database, filter by environment field
    const pool = getDbPool('DEV');
    const query = 'SELECT * FROM requests WHERE environment = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [environment]);
    console.log(`Fetched ${result.rows.length} requests for environment: ${environment}`);
    return result.rows;
  } catch (error) {
    console.error(`Database error in getAllRequests for ${environment}:`, error);
    return []; // Return empty array to prevent UI errors
  }
}

// Get priority suites with optional filters
async function getPrioritySuites(environment, filters = {}) {
  try {
    const pool = getDbPool(environment);
    let query = 'SELECT * FROM priority_suites';
    const values = [];
    
    let paramIndex = 1;
    
    if (filters.status) {
      if (paramIndex === 1) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ` status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      if (paramIndex === 1) {
        query += ' WHERE';
      } else {
        query += ' AND';
      }
      query += ` created_by = $${paramIndex}`;
      values.push(filters.createdBy);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database error in getPrioritySuites:', error);
    throw error;
  }
}

// Get all priority suites
async function getAllPrioritySuites(environment) {
  try {
    const pool = getDbPool(environment);
    const query = 'SELECT * FROM priority_suites ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllPrioritySuites:', error);
    return []; // Return empty array to prevent UI errors
  }
}

// Save run history
async function saveRunHistory(environment, runData) {
  try {
    // All run history is stored in the DEV database.
    // The 'environment' parameter indicates which environment the run was for.
    const pool = getDbPool('DEV'); 
    console.log(`Saving run history for ${environment} environment to DEV database:`, runData);
    const query = `
      INSERT INTO run_history 
        (run_type, reference_id, environment, graphql_query, response_data, status, execution_time, created_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`;

    const values = [
      runData.runType,
      runData.referenceId,
      environment, // This is the environment the run was performed against
      runData.graphqlQuery,
      runData.responseData,
      runData.status,
      runData.executionTime,
      runData.createdBy
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in saveRunHistory:', error);
    throw error;
  }
}

// Get run history for a specific request or suite
async function getRunHistory(environment, runType, referenceId) {
  try {
    // All run history is stored in the DEV database.
    // Filter by the 'environment' column to get history for a specific target environment.
    const pool = getDbPool('DEV');
    const query = `
      SELECT * FROM run_history 
      WHERE run_type = $1 AND reference_id = $2 AND environment = $3
      ORDER BY created_at DESC`;
    
    const values = [runType, referenceId, environment];
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database error in getRunHistory:', error);
    throw error;
  }
}

// Get all run history with item names
async function getAllRunHistory(environment) {
  try {
    // All run history is stored in the DEV database.
    // Filter by the 'environment' column to get history for a specific target environment.
    const pool = getDbPool('DEV');
    const query = `
      SELECT 
        h.id, 
        h.run_type, 
        h.reference_id, 
        h.environment, 
        h.status, 
        h.execution_time, 
        h.created_at, 
        h.created_by,
        CASE 
          WHEN h.run_type = 'request' THEN r.name 
          WHEN h.run_type = 'suite' THEN ps.name 
          ELSE 'Unknown'
        END as item_name
      FROM run_history h
      LEFT JOIN requests r ON h.run_type = 'request' AND h.reference_id = r.id AND h.environment = r.environment
      LEFT JOIN priority_suites ps ON h.run_type = 'suite' AND h.reference_id = ps.id 
      WHERE h.environment = $1 -- Filter by the target environment of the run
      ORDER BY h.created_at DESC
      LIMIT 100`;
    
    const result = await pool.query(query, [environment]);
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllRunHistory:', error);
    throw error;
  }
}

// Save a production run
async function saveProdRun(data) {
  try {
    const pool = getDbPool('PROD');
    const query = `
      INSERT INTO prod_runs 
        (rule_name, context, mid, result, created_by)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING id`;

    const values = [
      data.ruleName,
      data.context || {},
      data.mid,
      data.result || {},
      data.createdBy
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in saveProdRun:', error);
    throw error;
  }
}

// Get production runs with optional filters
async function getProdRuns(filters = {}) {
  try {
    const pool = getDbPool('PROD');
    let query = 'SELECT * FROM prod_runs';
    const values = [];
    
    let whereAdded = false;
    let paramIndex = 1;
    
    if (filters.ruleName) {
      query += ' WHERE rule_name = $' + paramIndex;
      values.push(filters.ruleName);
      paramIndex++;
      whereAdded = true;
    }
    
    if (filters.mid) {
      if (whereAdded) {
        query += ' AND';
      } else {
        query += ' WHERE';
        whereAdded = true;
      }
      query += ' mid = $' + paramIndex;
      values.push(filters.mid);
      paramIndex++;
    }
    
    if (filters.fromDate) {
      if (whereAdded) {
        query += ' AND';
      } else {
        query += ' WHERE';
        whereAdded = true;
      }
      query += ' date >= $' + paramIndex;
      values.push(filters.fromDate);
      paramIndex++;
    }
    
    if (filters.toDate) {
      if (whereAdded) {
        query += ' AND';
      } else {
        query += ' WHERE';
      }
      query += ' date <= $' + paramIndex;
      values.push(filters.toDate);
      paramIndex++;
    }
    
    query += ' ORDER BY date DESC';
    
    if (filters.limit) {
      query += ' LIMIT $' + paramIndex;
      values.push(filters.limit);
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database error in getProdRuns:', error);
    throw error;
  }
}

module.exports = {
  getDbPool,
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
  getAllRunHistory,
  saveProdRun,
  getProdRuns
};

