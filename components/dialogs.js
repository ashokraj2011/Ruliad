// components/dialogs.js
// Handles all <dialog> show/close logic for Add Request,
// Priority Suite and Settings.

// Disable the Conway Game of Life integration that's causing issues
// const { attachGameOfLifeToDialog } = require('../utils/conway');

function setupDialogListeners() {
    //
    // —— Add Request Dialog ——
    //
    const addReqBtn   = document.getElementById('add-request');
    const reqDlg      = document.getElementById('request-dialog');
    const reqForm     = document.getElementById('request-form');
    const cancelReq   = document.getElementById('cancel-request');

    if (addReqBtn && reqDlg && reqForm && cancelReq) {
        addReqBtn.addEventListener('click', () => {
            if (reqDlg.open) reqDlg.close();
            reqForm.reset();
            document.getElementById('request-env').value        = 'DEV';
            document.getElementById('request-persona').value    = 'XID';
            document.getElementById('request-persona-id').value = '';
            document.getElementById('request-status').value     = 'active';

            // // Remove Game of Life code that's causing issues
            // const existingGame = reqDlg.querySelector('.dialog-game-container');
            // if (existingGame) existingGame.remove();
            // attachGameOfLifeToDialog(reqDlg, getComputedStyle(document.documentElement).getPropertyValue('--accent'));

            reqDlg.showModal();
        });
        cancelReq.addEventListener('click', () => reqDlg.close());

        // Add submit event listener for the request form
        reqForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('request-name').value;
            const environment = document.getElementById('request-env').value;
            const ruleName = document.getElementById('request-rule-name').value;
            const personaType = document.getElementById('request-persona').value;
            const personaId = document.getElementById('request-persona-id').value;
            const status = document.getElementById('request-status').value;

            // Parse JSON context or use empty object if invalid
            let jsonContext = {};
            try {
                const jsonContextStr = document.getElementById('request-json-context').value;
                if (jsonContextStr && jsonContextStr.trim() !== '') {
                    jsonContext = JSON.parse(jsonContextStr);
                }
            } catch (err) {
                console.error('Error parsing JSON context:', err);
                require('@electron/remote').dialog.showErrorBox('JSON Error', 'Invalid JSON in context field. Please check the format.');
                return;
            }

            const requestData = {
                name,
                environment,
                ruleName,
                personaType,
                personaId,
                jsonContext,
                status,
                createdBy: localStorage.getItem('loggedInUser') || 'admin',
            };

            try {
                console.log('Saving request:', requestData);
                // Show loading indicator
                if (typeof window.showLoading === 'function') {
                    window.showLoading();
                }

                await require('../db').saveRequest(environment, requestData);
                reqDlg.close();

                // Refresh the requests tree
                if (typeof window.refreshAllTrees === 'function') {
                    window.refreshAllTrees();
                } else {
                    // Dispatch an event that the renderer can listen for
                    window.dispatchEvent(new CustomEvent('refresh-trees'));
                }

                console.log('Request saved successfully');

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = 'Request saved successfully';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            } catch (err) {
                console.error('Error saving request:', err);
                require('@electron/remote').dialog.showErrorBox('Save Error', err.message);
            } finally {
                // Hide loading indicator
                if (typeof window.hideLoading === 'function') {
                    window.hideLoading();
                }
            }
        });
    }


    //
    // —— Priority Suite Dialog ——
    //
    const addSuiteBtn  = document.getElementById('add-suite');
    const suiteDlg     = document.getElementById('suite-dialog');
    const suiteForm    = document.getElementById('suite-form');
    const cancelSuite  = document.getElementById('cancel-suite');
    const browseBtn    = document.getElementById('browse-suite');
    const suiteFile    = document.getElementById('suite-file');

    if (addSuiteBtn && suiteDlg && suiteForm && cancelSuite && browseBtn && suiteFile) {
        addSuiteBtn.addEventListener('click', () => {
            if (suiteDlg.open) suiteDlg.close();
            suiteForm.reset();
            suiteFile.value = '';

            // // Remove Game of Life code that's causing issues
            // const existingGame = suiteDlg.querySelector('.dialog-game-container');
            // if (existingGame) existingGame.remove();
            // attachGameOfLifeToDialog(suiteDlg, getComputedStyle(document.documentElement).getPropertyValue('--accent'));

            suiteDlg.showModal();
        });
        cancelSuite.addEventListener('click', () => suiteDlg.close());

        browseBtn.addEventListener('click', async () => {
            const { canceled, filePaths } = await require('@electron/remote')
                .dialog.showOpenDialog({ properties:['openFile'], filters:[{ name:'CSV', extensions:['csv'] }] });
            if (!canceled) suiteFile.value = filePaths[0];
        });

        suiteForm.addEventListener('submit', async e => {
            e.preventDefault();
            const fs = require('fs');
            const entries = fs.readFileSync(suiteFile.value, 'utf8')
                .trim().split('\n').slice(1).map(line => {
                    const [rule_name, xid, expected] = line.split(',');
                    return { rule_name, xid, expected_result: expected==='true', json_context:{} };
                });
            try {
                // Show loading indicator
                if (typeof window.showLoading === 'function') {
                    window.showLoading();
                }

                await require('../db').savePrioritySuite(
                    require('../config').defaultEnvironment,
                    { name: document.getElementById('suite-name').value.trim(), entries }
                );
                suiteDlg.close();

                // Refresh the suites tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = 'Priority Suite saved successfully';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            } catch (err) {
                console.error('Error saving Priority Suite:', err);
                require('@electron/remote')
                    .dialog.showErrorBox('Error Saving Suite', err.message);
            } finally {
                // Hide loading indicator
                if (typeof window.hideLoading === 'function') {
                    window.hideLoading();
                }
            }
        });
    }

    //
    // —— Settings Dialog ——
    //
    const openSettings   = document.getElementById('open-settings');
    const settingsDlg    = document.getElementById('settings-dialog');
    const settingsForm   = document.getElementById('settings-form');
    const cancelSettings = document.getElementById('cancel-settings');

    if (openSettings && settingsDlg && settingsForm && cancelSettings) {
        openSettings.addEventListener('click', () => {
            if (settingsDlg.open) settingsDlg.close();
            settingsForm.reset();

            // Load current config values
            const config = require('../config');

            // Set default environment
            document.getElementById('settings-env').value = config.defaultEnvironment;

            // Get the current environment config
            const envConfig = config.environments[config.defaultEnvironment];

            // Populate DB settings
            document.getElementById('db-host').value = envConfig.db.host;
            document.getElementById('db-port').value = envConfig.db.port;
            document.getElementById('db-user').value = envConfig.db.user;
            document.getElementById('db-password').value = envConfig.db.password;
            document.getElementById('db-name').value = envConfig.db.database;

            // Populate API endpoints
            document.getElementById('api-ruleengine').value = envConfig.apis.ruleEngine;
            document.getElementById('api-rulemetadata').value = envConfig.apis.ruleMetadata;
            document.getElementById('api-graphql').value = envConfig.apis.graphql;

            // Populate token refresh URLs
            document.getElementById('token-nonprod').value = config.tokenRefresh.nonProd;
            document.getElementById('token-prod').value = config.tokenRefresh.prod;

            // // Remove Game of Life code that's causing issues
            // const existingGame = settingsDlg.querySelector('.dialog-game-container');
            // if (existingGame) existingGame.remove();
            // attachGameOfLifeToDialog(settingsDlg, getComputedStyle(document.documentElement).getPropertyValue('--accent'));

            settingsDlg.showModal();
        });

        cancelSettings.addEventListener('click', () => settingsDlg.close());

        settingsForm.addEventListener('submit', async e => {
            e.preventDefault();

            // Create new config object with updated values
            const newEnv = document.getElementById('settings-env').value;
            const newConfig = {
                defaultEnvironment: newEnv,
                environments: {},
                tokenRefresh: {
                    nonProd: document.getElementById('token-nonprod').value.trim(),
                    prod: document.getElementById('token-prod').value.trim()
                }
            };

            // Copy existing environments and update selected one
            const currentConfig = require('../config');
            for (const env of Object.keys(currentConfig.environments)) {
                newConfig.environments[env] = JSON.parse(JSON.stringify(currentConfig.environments[env]));
            }

            // Update DB settings for the selected environment
            newConfig.environments[newEnv].db = {
                host: document.getElementById('db-host').value.trim(),
                port: parseInt(document.getElementById('db-port').value, 10),
                user: document.getElementById('db-user').value.trim(),
                password: document.getElementById('db-password').value,
                database: document.getElementById('db-name').value.trim()
            };

            // Update API endpoints for the selected environment
            newConfig.environments[newEnv].apis = {
                ruleEngine: document.getElementById('api-ruleengine').value.trim(),
                ruleMetadata: document.getElementById('api-rulemetadata').value.trim(),
                graphql: document.getElementById('api-graphql').value.trim()
            };

            try {
                // Save the configuration using IPC
                await require('@electron/remote').ipcRenderer.invoke('save-config', newConfig);
                settingsDlg.close();
                alert('Settings saved. Restart the application to apply changes.');
            } catch (err) {
                require('@electron/remote').dialog.showErrorBox('Save Settings Error', err.message);
            }
        });
    }

    //
    // —— Rule Definition Dialog ——
    //
    const ruleDefDialog = document.getElementById('rule-definition-dialog');
    const closeRuleDefBtn = document.getElementById('close-rule-definition');

    if (ruleDefDialog && closeRuleDefBtn) {
        closeRuleDefBtn.addEventListener('click', () => {
            if (ruleDefDialog.open) ruleDefDialog.close();
        });
    }

    //
    // —— API Call Dialog ——
    //
    const addApiCallBtn = document.getElementById('add-api-call');
    const apiCallDialog = document.getElementById('api-call-dialog');
    const apiCallForm = document.getElementById('api-call-form');
    const cancelApiCallBtn = document.getElementById('cancel-api-call-dialog');
    const apiCallHeadersTableBody = document.querySelector('#api-call-headers-table tbody');
    const addApiCallHeaderBtn = document.getElementById('add-api-call-header-btn');

    if (addApiCallBtn && apiCallDialog && apiCallForm && cancelApiCallBtn && apiCallHeadersTableBody && addApiCallHeaderBtn) {
        const addApiHeaderRow = (key = '', value = '') => {
            const row = apiCallHeadersTableBody.insertRow();
            row.innerHTML = `
                <td><input type="text" placeholder="Key" class="api-call-header-key control" value="${key}" /></td>
                <td><input type="text" placeholder="Value" class="api-call-header-value control" value="${value}" /></td>
                <td><button type="button" class="remove-header-btn control">✖</button></td>
            `;
            row.querySelector('.remove-header-btn').addEventListener('click', () => {
                row.remove();
            });
        };

        addApiCallBtn.addEventListener('click', () => {
            if (apiCallDialog.open) apiCallDialog.close();
            apiCallForm.reset();
            apiCallHeadersTableBody.innerHTML = ''; // Clear existing headers
            addApiHeaderRow(); // Add one empty header row
            document.getElementById('api-call-env').value = require('../config').defaultEnvironment;
            document.getElementById('api-call-method').value = 'GET';
            document.getElementById('api-call-status').value = 'active';
            apiCallDialog.showModal();
        });

        cancelApiCallBtn.addEventListener('click', () => apiCallDialog.close());
        addApiCallHeaderBtn.addEventListener('click', () => addApiHeaderRow());

        apiCallForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('api-call-name').value;
            const environment = document.getElementById('api-call-env').value;
            const url = document.getElementById('api-call-url').value;
            const method = document.getElementById('api-call-method').value;
            const status = document.getElementById('api-call-status').value;
            const body = document.getElementById('api-call-body').value;
            const headers = {};
            apiCallHeadersTableBody.querySelectorAll('tr').forEach(row => {
                const keyInput = row.querySelector('.api-call-header-key');
                const valueInput = row.querySelector('.api-call-header-value');
                if (keyInput && valueInput) {
                    const key = keyInput.value.trim();
                    if (key) {
                        headers[key] = valueInput.value.trim();
                    }
                }
            });

            const apiCallData = {
                name,
                environment,
                url,
                method,
                headers,
                body,
                status,
                createdBy: localStorage.getItem('loggedInUser') || 'admin',
            };

            try {
                // Show loading indicator
                if (typeof window.showLoading === 'function') {
                    window.showLoading();
                }

                await require('../db').saveApiCall(environment, apiCallData);
                apiCallDialog.close();

                // Refresh the API Calls tree
                if (typeof loadAndRenderApiCalls === 'function') {
                    loadAndRenderApiCalls();
                } else {
                    window.dispatchEvent(new CustomEvent('refresh-trees'));
                }

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = 'API Call saved successfully';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
            } catch (err) {
                console.error('Error saving API Call:', err);
                require('@electron/remote').dialog.showErrorBox('Save Error', err.message);
            } finally {
                // Hide loading indicator
                if (typeof window.hideLoading === 'function') {
                    window.hideLoading();
                }
            }
        });
    }

}

module.exports = { setupDialogListeners };
