// components/details.js

function showDetailsPanel(item, type) {
    const det = document.getElementById('details');

    // Format JSON with syntax highlighting
    const jsonString = JSON.stringify(item, null, 2);
    det.innerHTML = formatJsonWithSyntaxHighlighting(jsonString);

    // also populate the run form
    const runEnvSelect = document.getElementById('run-env');
    const environment = item.environment || runEnvSelect.value;

    // Set environment first
    runEnvSelect.value = environment;

    // Set other form fields
    document.getElementById('run-persona').value = item.personaType || 'MID';
    document.getElementById('run-persona-id').value = item.personaId || '';
    document.getElementById('run-json-context').value = JSON.stringify(item.jsonContext || {}, null, 2);

    // Set rule name using the populateRuleNameDropdown function
    const runRuleNameSelect = document.getElementById('run-rule-name');
    const ruleName = item.ruleName || item.name || '';

    // Import the populateRuleNameDropdown function
    const { populateRuleNameDropdown } = require('../services/ruleMetadata');

    // Populate the dropdown and select the rule name
    populateRuleNameDropdown(runRuleNameSelect, environment, ruleName);
}

/**
 * Format JSON string with syntax highlighting
 * @param {string} jsonString - The JSON string to format
 * @returns {string} - HTML with syntax highlighting
 */
function formatJsonWithSyntaxHighlighting(jsonString) {
    // Replace special characters to prevent XSS
    const escapeHtml = (str) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Add syntax highlighting with regex
    return escapeHtml(jsonString)
        // Keys
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span><span class="json-colon">:</span>')
        // String values
        .replace(/"([^"]*)"/g, '<span class="json-string">"$1"</span>')
        // Numbers
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
        // Booleans
        .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
        // Null
        .replace(/\bnull\b/g, '<span class="json-null">null</span>')
        // Brackets and braces
        .replace(/[{}\[\]]/g, '<span class="json-bracket">$&</span>')
        // Commas
        .replace(/,/g, '<span class="json-comma">,</span>');
}

module.exports = { showDetailsPanel };
