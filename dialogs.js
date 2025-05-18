// renderer.js
// Core logic for Ruliad Navigator: loading trees, dialogs, context menus, search/filter, and side-panel actions

const config = require('./config');
const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');
const { dialog } = remote;
const fs = require('fs');
const db = require('./db');
const {
    setupDelegatedTreeListeners,
    setupContextMenuListeners,
    filterTrees,
    loadRequests,
    loadPrioritySuites,
    callAdhocRequest,
    saveAdhocRequest
} = require('./dialogs'); // dialog logic moved to dialogs.js

// Tokens
let nonProdToken = null;
let prodToken = null;

window.addEventListener('DOMContentLoaded', async () => {
    // Initialize DB
    try {
        await db.initializeDatabase(config.defaultEnvironment);
    } catch (err) {
        console.error('DB init error:', err);
        dialog.showErrorBox('Database Error', err.message);
    }

    // Load trees
    await loadRequests();
    await loadPrioritySuites();

    // Search/filter
    const searchInput = document.getElementById('tree-search');
    if (searchInput) {
        searchInput.addEventListener('input', e => filterTrees(e.target.value));
    }

    // Expand/Collapse and Context Menu on trees
    setupDelegatedTreeListeners();
    setupContextMenuListeners();

    // Dialogs (add-request, add-suite, adhoc, settings)
    require('./dialogs').setupDialogListeners();

    // Side-panel buttons
    document.getElementById('refresh-token')?.addEventListener('click', async () => {
        try {
            // Show loading indicator if available
            if (typeof window.showLoading === 'function') {
                window.showLoading();
            }

            // Refresh both tokens in parallel
            const [nonProdResponse, prodResponse] = await Promise.all([
                fetch(config.tokenRefresh.nonProd, { method: 'POST' }),
                fetch(config.tokenRefresh.prod, { method: 'POST' })
            ]);

            // Get the token values
            nonProdToken = await nonProdResponse.text();
            prodToken = await prodResponse.text();

            // Hide loading indicator if available
            if (typeof window.hideLoading === 'function') {
                window.hideLoading();
            }

            // Show success notification
            alert('All tokens refreshed successfully');
        } catch (err) {
            // Hide loading indicator if available
            if (typeof window.hideLoading === 'function') {
                window.hideLoading();
            }

            dialog.showErrorBox('Token Error', err.message);
        }
    });

    document.getElementById('adhoc-request')?.addEventListener('click', () => {
        document.getElementById('adhoc-dialog').showModal();
    });

    document.getElementById('call-adhoc')?.addEventListener('click', callAdhocRequest);
    document.getElementById('save-adhoc')?.addEventListener('click', saveAdhocRequest);
    document.getElementById('close-adhoc')?.addEventListener('click', () => {
        document.getElementById('adhoc-dialog').close();
    });

    document.getElementById('open-settings')?.addEventListener('click', () => {
        // Pre-fill settings fields from config
        const cfg = Object.assign({}, config);
        document.getElementById('settings-env').value = cfg.defaultEnvironment;
        document.getElementById('db-host').value = cfg.environments[cfg.defaultEnvironment].db.host;
        document.getElementById('db-port').value = cfg.environments[cfg.defaultEnvironment].db.port;
        document.getElementById('db-user').value = cfg.environments[cfg.defaultEnvironment].db.user;
        document.getElementById('db-password').value = cfg.environments[cfg.defaultEnvironment].db.password;
        document.getElementById('db-name').value = cfg.environments[cfg.defaultEnvironment].db.database;
        document.getElementById('api-ruleengine').value = cfg.environments[cfg.defaultEnvironment].apis.ruleEngine;
        document.getElementById('api-rulemetadata').value = cfg.environments[cfg.defaultEnvironment].apis.ruleMetadata;
        document.getElementById('api-graphql').value = cfg.environments[cfg.defaultEnvironment].apis.graphql;
        document.getElementById('token-nonprod').value = cfg.tokenRefresh.nonProd;
        document.getElementById('token-prod').value = cfg.tokenRefresh.prod;
        document.getElementById('settings-dialog').showModal();
    });

    document.getElementById('cancel-settings')?.addEventListener('click', () => {
        document.getElementById('settings-dialog').close();
    });

    document.getElementById('settings-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        // collect and save config
        const newCfg = Object.assign({}, config);
        newCfg.defaultEnvironment = document.getElementById('settings-env').value;
        const env = newCfg.defaultEnvironment;
        newCfg.environments[env].db.host = document.getElementById('db-host').value;
        newCfg.environments[env].db.port = +document.getElementById('db-port').value;
        newCfg.environments[env].db.user = document.getElementById('db-user').value;
        newCfg.environments[env].db.password = document.getElementById('db-password').value;
        newCfg.environments[env].db.database = document.getElementById('db-name').value;
        newCfg.environments[env].apis.ruleEngine = document.getElementById('api-ruleengine').value;
        newCfg.environments[env].apis.ruleMetadata = document.getElementById('api-rulemetadata').value;
        newCfg.environments[env].apis.graphql = document.getElementById('api-graphql').value;
        newCfg.tokenRefresh.nonProd = document.getElementById('token-nonprod').value;
        newCfg.tokenRefresh.prod = document.getElementById('token-prod').value;
        try {
            await ipcRenderer.invoke('save-config', newCfg);
            alert('Settings saved');
            document.getElementById('settings-dialog').close();
        } catch (err) {
            dialog.showErrorBox('Save Error', err.message);
        }
    });
});
