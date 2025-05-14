
const config = {
  environments: {
    DEV: {
      db: {
        host: 'localhost',
        port: 5432,
        user: 'dev_user',
        password: 'dev_password',
        database: 'dev_db',
      },
      apis: {
        ruleEngine: 'https://dev.example.com/rule-engine',
        ruleMetadata: 'https://dev.example.com/rule-metadata',
        graphql: 'https://dev.example.com/graphql',
      },
    },
    UAT: {
      db: {
        host: 'uat-db.example.com',
        port: 5432,
        user: 'uat_user',
        password: 'uat_password',
        database: 'uat_db',
      },
      apis: {
        ruleEngine: 'https://uat.example.com/rule-engine',
        ruleMetadata: 'https://uat.example.com/rule-metadata',
        graphql: 'https://uat.example.com/graphql',
      },
    },
    PRE_PROD: {
      db: {
        host: 'preprod-db.example.com',
        port: 5432,
        user: 'preprod_user',
        password: 'preprod_password',
        database: 'preprod_db',
      },
      apis: {
        ruleEngine: 'https://preprod.example.com/rule-engine',
        ruleMetadata: 'https://preprod.example.com/rule-metadata',
        graphql: 'https://preprod.example.com/graphql',
      },
    },
    PROD: {
      db: {
        host: 'prod-db.example.com',
        port: 5432,
        user: 'prod_user',
        password: 'prod_password',
        database: 'prod_db',
      },
      apis: {
        ruleEngine: 'https://prod.example.com/rule-engine',
        ruleMetadata: 'https://prod.example.com/rule-metadata',
        graphql: 'https://prod.example.com/graphql',
      },
    },
    LOCAL: {
      db: {
        host: 'localhost',
        port: 5432,
        user: 'local_user',
        password: 'local_password',
        database: 'local_db',
      },
      apis: {
        ruleEngine: 'http://localhost:3000/rule-engine',
        ruleMetadata: 'http://localhost:3000/rule-metadata',
        graphql: 'http://localhost:3000/graphql',
      },
    },
  },
  defaultEnvironment: 'DEV', // Set the default environment
};

module.exports = config;
