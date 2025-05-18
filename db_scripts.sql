-- Create table for storing requests
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    persona_type VARCHAR(100) NOT NULL,
    persona_id VARCHAR(100) NOT NULL,
    json_context JSONB DEFAULT '{}', -- Added JSON context field
    status VARCHAR(50) DEFAULT 'active', -- New status column with default value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100) NOT NULL
);

-- Add environment column to requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'environment'
    ) THEN
        ALTER TABLE requests ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'DEV';
    END IF;
END $$;

-- Create table for storing priority suites
CREATE TABLE IF NOT EXISTS priority_suites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL, -- Added environment column
    csv_file_path TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- New status column with default value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100) NOT NULL
);

-- Add environment column to priority_suites table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'priority_suites' AND column_name = 'environment'
    ) THEN
        ALTER TABLE priority_suites ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'DEV';
    END IF;
END $$;

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

-- Add environment column to run_history table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'run_history' AND column_name = 'environment'
    ) THEN
        ALTER TABLE run_history ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'DEV';
    END IF;
END $$;

-- Create table for storing production runs
CREATE TABLE IF NOT EXISTS prod_runs (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rule_name VARCHAR(255) NOT NULL,
    context JSONB,
    mid VARCHAR(100) NOT NULL,
    result JSONB,
    environment VARCHAR(50) NOT NULL, -- Added environment column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL
);

-- Add environment column to prod_runs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'prod_runs' AND column_name = 'environment'
    ) THEN
        ALTER TABLE prod_runs ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'DEV';
    END IF;
END $$;

-- Create table for storing generic API calls
CREATE TABLE IF NOT EXISTS api_calls (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'GET',
    headers JSONB DEFAULT '{}',
    body TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by VARCHAR(100) NOT NULL
);

-- Add environment column to api_calls table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'api_calls' AND column_name = 'environment'
    ) THEN
        ALTER TABLE api_calls ADD COLUMN environment VARCHAR(50) NOT NULL DEFAULT 'DEV';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_environment ON requests(environment);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status); -- New index for status
CREATE INDEX IF NOT EXISTS idx_priority_suites_environment ON priority_suites(environment); -- New index for environment
CREATE INDEX IF NOT EXISTS idx_priority_suites_created_by ON priority_suites(created_by);
CREATE INDEX IF NOT EXISTS idx_priority_suites_status ON priority_suites(status); -- New index for status
CREATE INDEX IF NOT EXISTS idx_run_history_run_type ON run_history(run_type);
CREATE INDEX IF NOT EXISTS idx_run_history_reference_id ON run_history(reference_id);
CREATE INDEX IF NOT EXISTS idx_run_history_environment ON run_history(environment);
CREATE INDEX IF NOT EXISTS idx_run_history_created_by ON run_history(created_by);
CREATE INDEX IF NOT EXISTS idx_prod_runs_date ON prod_runs(date);
CREATE INDEX IF NOT EXISTS idx_prod_runs_rule_name ON prod_runs(rule_name);
CREATE INDEX IF NOT EXISTS idx_prod_runs_mid ON prod_runs(mid);
CREATE INDEX IF NOT EXISTS idx_prod_runs_environment ON prod_runs(environment);
CREATE INDEX IF NOT EXISTS idx_api_calls_environment ON api_calls(environment);
CREATE INDEX IF NOT EXISTS idx_api_calls_created_by ON api_calls(created_by);
CREATE INDEX IF NOT EXISTS idx_api_calls_status ON api_calls(status);
