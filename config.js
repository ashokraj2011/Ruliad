const fs = require('fs');
const path = require('path');
// Load config from JSON file
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

module.exports = config;
