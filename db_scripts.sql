-- Create table for storing requests
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    persona_type VARCHAR(100) NOT NULL,
    persona_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- New status column with default value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100) NOT NULL
);

-- Create table for storing priority suites
CREATE TABLE IF NOT EXISTS priority_suites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    csv_file_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- New status column with default value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100) NOT NULL
);

-- Create table for storing run history
CREATE TABLE IF NOT EXISTS run_history (
    id SERIAL PRIMARY KEY,
    run_type VARCHAR(20) NOT NULL, -- 'request' or 'suite'
    reference_id INTEGER NOT NULL, -- ID of request or suite
    environment VARCHAR(50) NOT NULL,
    graphql_query TEXT NOT NULL,
    response_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failure', 'partial'
    execution_time INTEGER, -- in milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_requests_environment ON requests(environment);
CREATE INDEX idx_requests_created_by ON requests(created_by);
CREATE INDEX idx_requests_status ON requests(status); -- New index for status
CREATE INDEX idx_priority_suites_created_by ON priority_suites(created_by);
CREATE INDEX idx_priority_suites_status ON priority_suites(status); -- New index for status
CREATE INDEX idx_run_history_run_type ON run_history(run_type);
CREATE INDEX idx_run_history_reference_id ON run_history(reference_id);
CREATE INDEX idx_run_history_environment ON run_history(environment);
CREATE INDEX idx_run_history_created_by ON run_history(created_by);

