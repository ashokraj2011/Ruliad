// components/ruleAnalyzer.js

/**
 * Sets up the Rule Analyzer functionality
 */
function setupRuleAnalyzer() {
    // Get DOM elements
    const ruleAnalyzerBtn = document.getElementById('rule-analyzer');
    const ruleAnalyzerDialog = document.getElementById('rule-analyzer-dialog');
    const closeAnalyzerBtn = document.getElementById('close-analyzer');
    const analyzerRunBtn = document.getElementById('analyzer-run-btn');
    const analyzerAnalyzeBtn = document.getElementById('analyzer-analyze-btn');
    const analyzerHistoryBtn = document.getElementById('analyzer-history-btn');
    const analyzerOutput = document.getElementById('analyzer-output');

    // Analysis dialog elements
    const ruleAnalysisDialog = document.getElementById('rule-analysis-dialog');
    const closeAnalysisBtn = document.getElementById('close-analysis');
    const analysisTabs = document.getElementById('analysis-tabs');
    const analysisRuleDefinition = document.getElementById('analysis-rule-definition');
    const analysisEvaluationData = document.getElementById('analysis-evaluation-data');
    const analysisSummary = document.getElementById('analysis-summary');

    // History dialog elements
    const ruleHistoryDialog = document.getElementById('rule-history-dialog');
    const closeRuleHistoryBtn = document.getElementById('close-rule-history');
    const ruleHistoryContent = document.getElementById('rule-history-content');

    // Form elements
    const analyzerRuleName = document.getElementById('analyzer-rule-name');
    const analyzerEnv = document.getElementById('analyzer-env');
    const analyzerPersona = document.getElementById('analyzer-persona');
    const analyzerPersonaId = document.getElementById('analyzer-persona-id');
    const analyzerRunOption = document.getElementById('analyzer-run-option');

    // Store the last run result
    let lastRunResult = null;

    // Check if elements exist
    if (!ruleAnalyzerBtn || !ruleAnalyzerDialog) {
        console.warn('Rule Analyzer elements not found. Skipping setup.');
        return;
    }

    // Open Rule Analyzer dialog when button is clicked
    ruleAnalyzerBtn.addEventListener('click', () => {
        // Import the populateRuleNameDropdown function
        const { populateRuleNameDropdown } = require('../services/ruleMetadata');

        // Populate the rule name dropdown with the current environment
        const environment = analyzerEnv.value;
        populateRuleNameDropdown(analyzerRuleName, environment);

        ruleAnalyzerDialog.showModal();
    });

    // Add event listener for environment change to update rule name dropdown
    analyzerEnv.addEventListener('change', (event) => {
        // Import the populateRuleNameDropdown function
        const { populateRuleNameDropdown } = require('../services/ruleMetadata');

        // Populate the rule name dropdown with the selected environment
        const environment = event.target.value;
        populateRuleNameDropdown(analyzerRuleName, environment);
    });

    // Close Rule Analyzer dialog when close button is clicked
    closeAnalyzerBtn.addEventListener('click', () => {
        ruleAnalyzerDialog.close();
    });

    // Close Analysis dialog when close button is clicked
    closeAnalysisBtn.addEventListener('click', () => {
        ruleAnalysisDialog.close();
    });

    // Close History dialog when close button is clicked
    closeRuleHistoryBtn.addEventListener('click', () => {
        ruleHistoryDialog.close();
    });

    // Setup tabs functionality for analysis dialog
    function setupAnalysisTabs() {
        // Check if analysisTabs exists before trying to access it
        if (!analysisTabs) {
            console.warn('Analysis tabs element not found. Skipping tab setup.');
            return;
        }
        const tabs = analysisTabs.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');

                // Hide all tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });

                // Show the corresponding tab content
                const tabId = tab.getAttribute('data-tab');
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    // Run button click handler
    analyzerRunBtn.addEventListener('click', async () => {
        // Validate form
        if (!analyzerRuleName.value || !analyzerPersonaId.value) {
            alert('Please fill in all required fields');
            return;
        }

        // Disable run button and show loading message
        analyzerRunBtn.disabled = true;
        analyzerOutput.textContent = 'Running rule...';

        try {
            // Get form values
            const ruleName = analyzerRuleName.value;
            const environment = analyzerEnv.value;
            const personaType = analyzerPersona.value;
            const personaId = analyzerPersonaId.value;
            const runOption = analyzerRunOption.value;

            // Create payload
            const payload = {
                ruleName,
                environment,
                personaType,
                personaId,
                runOption
            };

            // Get API URL from config based on environment
            const config = require('../config');
            const envConfig = config.environments[environment];
            const apiUrl = `${envConfig.apis.ruleEngine}/execute`;

            // Make API call
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Parse response
            const result = await response.json();

            // Store result for analyze button
            lastRunResult = result;

            // Format and display result
            analyzerOutput.textContent = JSON.stringify(result, null, 2);

            // Enable analyze button
            analyzerAnalyzeBtn.disabled = false;

        } catch (error) {
            // Display error
            analyzerOutput.textContent = `Error: ${error.message}`;
            console.error('Rule execution error:', error);

            // Disable analyze button
            analyzerAnalyzeBtn.disabled = true;
            lastRunResult = null;
        } finally {
            // Re-enable run button
            analyzerRunBtn.disabled = false;
        }
    });

    // Analyze button click handler
    analyzerAnalyzeBtn.addEventListener('click', async () => {
        if (!lastRunResult) {
            alert('Please run the rule first');
            return;
        }

        try {
            // Get form values
            const ruleName = analyzerRuleName.value;
            const environment = analyzerEnv.value;

            // Get API URL from config based on environment
            const config = require('../config');
            const envConfig = config.environments[environment];
            const apiUrl = `${envConfig.apis.ruleMetadata}/rule/${ruleName}`;

            // Make API call to get rule definition
            const response = await fetch(apiUrl);
            const ruleDefinition = await response.json();

            // Display rule definition
            analysisRuleDefinition.textContent = JSON.stringify(ruleDefinition, null, 2);

            // Display evaluation data (from last run result)
            analysisEvaluationData.textContent = JSON.stringify(lastRunResult.evaluationData || {}, null, 2);

            // Create and display summary
            const summary = {
                ruleName: ruleName,
                environment: environment,
                personaType: analyzerPersona.value,
                personaId: analyzerPersonaId.value,
                runOption: analyzerRunOption.value,
                executionTime: lastRunResult.executionTime || 'N/A',
                result: lastRunResult.result || 'N/A',
                status: lastRunResult.status || 'N/A'
            };

            analysisSummary.textContent = JSON.stringify(summary, null, 2);

            // Show analysis dialog
            ruleAnalysisDialog.showModal();

        } catch (error) {
            alert(`Error analyzing rule: ${error.message}`);
            console.error('Rule analysis error:', error);
        }
    });

    // History button click handler
    analyzerHistoryBtn.addEventListener('click', async () => {
        // Validate form
        if (!analyzerRuleName.value || !analyzerPersonaId.value) {
            alert('Please fill in Rule Name and Persona ID');
            return;
        }

        try {
            // Get form values
            const ruleName = analyzerRuleName.value;
            const environment = analyzerEnv.value;
            const personaId = analyzerPersonaId.value;

            // Get API URL from config based on environment
            const config = require('../config');
            const envConfig = config.environments[environment];
            const apiUrl = `${envConfig.apis.ruleEngine}/history/${ruleName}/${personaId}`;

            // Make API call
            const response = await fetch(apiUrl);
            const historyData = await response.json();

            // Clear previous history
            ruleHistoryContent.innerHTML = '';

            // Display history items
            if (historyData && historyData.length > 0) {
                historyData.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="history-item-header">
                            <span class="timestamp">${new Date(item.timestamp).toLocaleString()}</span>
                            <span class="status ${item.status === 'success' ? 'success' : 'error'}">${item.status}</span>
                        </div>
                        <pre>${JSON.stringify(item.result, null, 2)}</pre>
                    `;
                    ruleHistoryContent.appendChild(historyItem);
                });
            } else {
                ruleHistoryContent.textContent = 'No history found for this rule and persona ID.';
            }

            // Show history dialog
            ruleHistoryDialog.showModal();

        } catch (error) {
            alert(`Error fetching history: ${error.message}`);
            console.error('Rule history error:', error);
        }
    });

    // Initialize tabs
    setupAnalysisTabs();
}

module.exports = { setupRuleAnalyzer };
