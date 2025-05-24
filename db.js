const { Pool } = require('pg');
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { isUsingMockApi } = require('./services/mockApi');
const mockDb = require('./services/mockDb');

// Database connection pools for each environment
const dbPools = {};

// Initialize DB connection for the specified environment
function getDbPool(environment) {
  // Always use DEV if the requested environment doesn't exist in config
  const safeEnvironment = config.environments[environment] ? environment : 'DEV';

  console.log(`Getting DB pool for ${environment} environment (safe: ${safeEnvironment})`);

  try {
    if (!dbPools[safeEnvironment]) {
      console.log(`Creating new DB pool for ${safeEnvironment} environment`);
      const envConfig = config.environments[safeEnvironment].db;
      console.log(`DB config for ${safeEnvironment}:`, {
        user: envConfig.user,
        host: envConfig.host,
        database: envConfig.database,
        port: envConfig.port,
        // Not logging password for security reasons
      });

      dbPools[safeEnvironment] = new Pool({
        user: envConfig.user,
        host: envConfig.host,
        database: envConfig.database,
        password: envConfig.password,
        port: envConfig.port,
      });

      console.log(`Created new DB pool for ${safeEnvironment} environment`);

      // Test the connection
      dbPools[safeEnvironment].query('SELECT NOW()', (err, res) => {
        if (err) {
          console.error(`Error testing connection to ${safeEnvironment} database:`, err);
        } else {
          console.log(`Successfully connected to ${safeEnvironment} database, server time:`, res.rows[0].now);
        }
      });
    } else {
      console.log(`Using existing DB pool for ${safeEnvironment} environment`);
    }
    return dbPools[safeEnvironment];
  } catch (error) {
    console.error(`Error creating DB pool for ${safeEnvironment} environment:`, error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}

// Initialize the database (create tables if they don't exist)
async function initializeDatabase(environment) {
  console.log(`Initializing database for environment: ${environment}`);

  try {
    // All metadata tables are created in the DEV database
    console.log(`Getting database pool for DEV environment...`);
    const pool = getDbPool('DEV');

    console.log(`Checking if database connection is working...`);
    try {
      const testResult = await pool.query('SELECT NOW() as current_time');
      console.log(`Database connection test successful. Server time: ${testResult.rows[0].current_time}`);
    } catch (testError) {
      console.error(`Database connection test failed:`, testError);
      console.error(`This indicates a problem with the database connection that needs to be fixed.`);
      return false;
    }

    console.log(`Reading SQL scripts for database initialization...`);

    // Read the SQL scripts
    const sqlScriptPath = path.join(__dirname, 'db_scripts.sql');
    console.log(`SQL script path: ${sqlScriptPath}`);

    if (!fs.existsSync(sqlScriptPath)) {
      console.error(`SQL script file not found at: ${sqlScriptPath}`);
      return false;
    }

    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
    console.log(`SQL script loaded, length: ${sqlScript.length} characters`);

    // Execute the script
    console.log(`Executing SQL script on DEV database...`);
    await pool.query(sqlScript);
    console.log('Database tables created or verified successfully in DEV database');

    // Verify tables were created by checking if they exist
    console.log(`Verifying database tables...`);
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('requests', 'priority_suites', 'run_history', 'prod_runs', 'api_calls')
    `;

    const tableResult = await pool.query(tableCheckQuery);
    console.log(`Found ${tableResult.rows.length} tables in database:`);
    tableResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });

    if (tableResult.rows.length < 5) {
      console.warn(`Some tables may be missing. Expected 5 tables, found ${tableResult.rows.length}.`);
    }

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Save a request to the database
async function saveRequest(environment, request) {
  // Don't use mock implementation for requests, as per issue description:
  // "All Add request and Priority suites should be wired up with DEV DB tables as done earlier. Dont connect these two to mock data services"

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
  // Don't use mock implementation for priority suites, as per issue description:
  // "All Add request and Priority suites should be wired up with DEV DB tables as done earlier. Dont connect these two to mock data services"

  try {
    // All metadata is stored in DEV environment database, 
    // but we track which environment the suite is for
    const pool = getDbPool('DEV');
    console.log(`Saving priority suite metadata for ${environment} environment to DEV database:`, suite);

    const query = `
      INSERT INTO priority_suites 
        (name, environment, csv_file_path, status, created_by, last_modified_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING id`;

    const values = [
      suite.name,
      environment, // Store the environment as metadata
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
    // All priority suites are stored in DEV database
    const pool = getDbPool('DEV');
    console.log(`Updating priority suite status in DEV database for suite ID: ${suiteId}`);
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
    // All metadata is stored in DEV database, filter by environment field
    const pool = getDbPool('DEV');
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
    console.log(`Fetched ${result.rows.length} requests for environment: ${environment} with filters`);
    return result.rows;
  } catch (error) {
    console.error('Database error in getRequests:', error);
    throw error;
  }
}

// Get all requests for an environment
async function getAllRequests(environment) {
  console.log(`getAllRequests: Starting to fetch requests for environment: ${environment}`);

  // Don't use mock implementation for requests, as per issue description:
  // "All Add request and Priority suites should be wired up with DEV DB tables as done earlier. Dont connect these two to mock data services"

  try {
    // All metadata is stored in DEV database, filter by environment field
    console.log(`getAllRequests: Getting DEV database pool...`);
    const pool = getDbPool('DEV');

    // First check if the requests table exists
    try {
      console.log(`getAllRequests: Checking if requests table exists...`);
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'requests'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error(`getAllRequests: The requests table does not exist in the database!`);
        return [];
      }
      console.log(`getAllRequests: Requests table exists, proceeding with query.`);
    } catch (tableError) {
      console.error(`getAllRequests: Error checking if requests table exists:`, tableError);
      return [];
    }

    // Now execute the actual query
    console.log(`getAllRequests: Executing query to fetch requests for environment: ${environment}`);
    const query = 'SELECT * FROM requests WHERE environment = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [environment]);
    console.log(`getAllRequests: Fetched ${result.rows.length} requests for environment: ${environment}`);

    // Log the first few requests for debugging
    if (result.rows.length > 0) {
      console.log(`getAllRequests: First request:`, {
        id: result.rows[0].id,
        name: result.rows[0].name,
        rule_name: result.rows[0].rule_name,
        environment: result.rows[0].environment
      });
    } else {
      console.log(`getAllRequests: No requests found for environment: ${environment}`);
    }

    return result.rows;
  } catch (error) {
    console.error(`Database error in getAllRequests for ${environment}:`, error);
    console.error(`Error details:`, error.message);
    if (error.stack) {
      console.error(`Stack trace:`, error.stack);
    }
    return []; // Return empty array to prevent UI errors
  }
}

// Get priority suites with optional filters
async function getPrioritySuites(environment, filters = {}) {
  try {
    // All metadata is stored in DEV database, filter by environment field
    const pool = getDbPool('DEV');
    let query = 'SELECT * FROM priority_suites WHERE environment = $1';
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
    console.log(`Fetched ${result.rows.length} priority suites for environment: ${environment} with filters`);
    return result.rows;
  } catch (error) {
    console.error(`Database error in getPrioritySuites for ${environment}:`, error);
    throw error;
  }
}

// Get all priority suites
async function getAllPrioritySuites(environment) {
  console.log(`getAllPrioritySuites: Starting to fetch priority suites for environment: ${environment}`);

  // Don't use mock implementation for priority suites, as per issue description:
  // "All Add request and Priority suites should be wired up with DEV DB tables as done earlier. Dont connect these two to mock data services"

  try {
    // All metadata is stored in DEV database, filter by environment field
    console.log(`getAllPrioritySuites: Getting DEV database pool...`);
    const pool = getDbPool('DEV');

    // First check if the priority_suites table exists
    try {
      console.log(`getAllPrioritySuites: Checking if priority_suites table exists...`);
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'priority_suites'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error(`getAllPrioritySuites: The priority_suites table does not exist in the database!`);
        return [];
      }
      console.log(`getAllPrioritySuites: Priority suites table exists, proceeding with query.`);
    } catch (tableError) {
      console.error(`getAllPrioritySuites: Error checking if priority_suites table exists:`, tableError);
      return [];
    }

    // Now execute the actual query
    console.log(`getAllPrioritySuites: Executing query to fetch priority suites for environment: ${environment}`);
    const query = 'SELECT * FROM priority_suites WHERE environment = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [environment]);
    console.log(`getAllPrioritySuites: Fetched ${result.rows.length} priority suites for environment: ${environment}`);

    // Log the first few suites for debugging
    if (result.rows.length > 0) {
      console.log(`getAllPrioritySuites: First suite:`, {
        id: result.rows[0].id,
        name: result.rows[0].name,
        environment: result.rows[0].environment
      });
    } else {
      console.log(`getAllPrioritySuites: No priority suites found for environment: ${environment}`);
    }

    return result.rows;
  } catch (error) {
    console.error(`Database error in getAllPrioritySuites for ${environment}:`, error);
    console.error(`Error details:`, error.message);
    if (error.stack) {
      console.error(`Stack trace:`, error.stack);
    }
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

// Save a generic API call configuration
async function saveApiCall(environment, apiCallData) {
  // Use mock implementation if mock API is enabled
  if (isUsingMockApi()) {
    console.log(`saveApiCall: Using mock implementation for environment: ${environment}`);
    return mockDb.saveApiCall(environment, apiCallData);
  }

  try {
    // Store all API call configurations in the DEV database,
    // but track the target environment for the call.
    const pool = getDbPool('DEV');
    console.log(`Saving API call config for ${environment} environment to DEV database:`, apiCallData);

    const query = `
      INSERT INTO api_calls
        (name, environment, url, method, headers, body, status, created_by, last_modified_by)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`;

    const values = [
      apiCallData.name,
      apiCallData.environment, // Target environment for the API call
      apiCallData.url,
      apiCallData.method,
      apiCallData.headers || {},
      apiCallData.body,
      apiCallData.status || 'active',
      apiCallData.createdBy,
      apiCallData.createdBy
    ];

    const result = await pool.query(query, values);
    console.log('Database result (saveApiCall):', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in saveApiCall:', error);
    throw error;
  }
}

// Get all API call configurations for a specific target environment
async function getAllApiCalls(environment) {
  console.log(`getAllApiCalls: Starting to fetch API calls for environment: ${environment}`);

  // Use mock implementation if mock API is enabled
  if (isUsingMockApi()) {
    console.log(`getAllApiCalls: Using mock implementation for environment: ${environment}`);
    return mockDb.getAllApiCalls(environment);
  }

  try {
    // All configurations are stored in DEV, filter by the 'environment' field
    console.log(`getAllApiCalls: Getting DEV database pool...`);
    const pool = getDbPool('DEV');

    // First check if the api_calls table exists
    try {
      console.log(`getAllApiCalls: Checking if api_calls table exists...`);
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'api_calls'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        console.error(`getAllApiCalls: The api_calls table does not exist in the database!`);
        return [];
      }
      console.log(`getAllApiCalls: API calls table exists, proceeding with query.`);
    } catch (tableError) {
      console.error(`getAllApiCalls: Error checking if api_calls table exists:`, tableError);
      return [];
    }

    // Now execute the actual query
    console.log(`getAllApiCalls: Executing query to fetch API calls for environment: ${environment}`);
    const query = 'SELECT * FROM api_calls WHERE environment = $1 ORDER BY name ASC';
    const result = await pool.query(query, [environment]);
    console.log(`getAllApiCalls: Fetched ${result.rows.length} API calls for environment: ${environment}`);

    // Log the first few API calls for debugging
    if (result.rows.length > 0) {
      console.log(`getAllApiCalls: First API call:`, {
        id: result.rows[0].id,
        name: result.rows[0].name,
        url: result.rows[0].url,
        method: result.rows[0].method,
        environment: result.rows[0].environment
      });
    } else {
      console.log(`getAllApiCalls: No API calls found for environment: ${environment}`);
    }

    return result.rows;
  } catch (error) {
    console.error(`Database error in getAllApiCalls for ${environment}:`, error);
    console.error(`Error details:`, error.message);
    if (error.stack) {
      console.error(`Stack trace:`, error.stack);
    }
    return []; // Return empty array to prevent UI errors
  }
}

// Update API call status - operates on DEV database
async function updateApiCallStatus(apiCallId, status, modifiedBy) {
  try {
    const pool = getDbPool('DEV');
    const query = `
      UPDATE api_calls
      SET status = $1,
          last_modified_by = $2,
          last_modified_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id`;

    const values = [status, modifiedBy, apiCallId];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in updateApiCallStatus:', error);
    throw error;
  }
}

// Save a production run
async function saveProdRun(environment, data) {
  try {
    // All metadata is stored in DEV environment database, 
    // but we track which environment the run is for
    const pool = getDbPool('DEV');
    console.log(`Saving production run metadata for ${environment} environment to DEV database:`, data);

    const query = `
      INSERT INTO prod_runs 
        (rule_name, context, xid, result, environment, created_by)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING id`;

    const values = [
      data.ruleName,
      data.context || {},
      data.xid,
      data.result || {},
      environment, // Store the environment as metadata
      data.createdBy
    ];

    const result = await pool.query(query, values);
    console.log('Database result (saveProdRun):', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Database error in saveProdRun:', error);
    throw error;
  }
}

// Get production runs with optional filters
async function getProdRuns(environment, filters = {}) {
  try {
    // All metadata is stored in DEV environment database, 
    // filter by environment field
    const pool = getDbPool('DEV');
    console.log(`Fetching production runs for ${environment} environment from DEV database`);

    // Always filter by environment
    let query = 'SELECT * FROM prod_runs WHERE environment = $1';
    const values = [environment];
    let paramIndex = 2;

    if (filters.ruleName) {
      query += ' AND rule_name = $' + paramIndex;
      values.push(filters.ruleName);
      paramIndex++;
    }

    if (filters.xid) {
      query += ' AND xid = $' + paramIndex;
      values.push(filters.xid);
      paramIndex++;
    }

    if (filters.fromDate) {
      query += ' AND date >= $' + paramIndex;
      values.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      query += ' AND date <= $' + paramIndex;
      values.push(filters.toDate);
      paramIndex++;
    }

    query += ' ORDER BY date DESC';

    if (filters.limit) {
      query += ' LIMIT $' + paramIndex;
      values.push(filters.limit);
    }

    const result = await pool.query(query, values);
    console.log(`Fetched ${result.rows.length} production runs for environment: ${environment}`);
    return result.rows;
  } catch (error) {
    console.error(`Database error in getProdRuns for ${environment}:`, error);
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
  saveApiCall,        // Added new function
  getAllApiCalls,     // Added new function
  updateApiCallStatus, // Added new function
  saveProdRun,
  getProdRuns
};
