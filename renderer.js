// renderer.js
// Entry point for Ruliad Navigator renderer process

const { initializeDatabase, getRequestsByEnv, getSuites } = require('./services/data');
const { atomSvgAnim, ruleSvgAnim } = require('./utils/svg');
const { renderTree, bindTreeEvents } = require('./components/tree');
const { showDetailsPanel } = require('./components/details');
const { dialog } = require('@electron/remote');

// Global state
let currentEnvironment;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    currentEnvironment = require('./config').defaultEnvironment;
    await initializeDatabase(currentEnvironment);
  } catch (e) {
    dialog.showErrorBox('Database Error', e.message);
    return;
  }

  // Load and render data
  const requestsByEnv = await getRequestsByEnv();
  renderTree('requests-tree', requestsByEnv, atomSvgAnim, ruleSvgAnim);

  const suites = await getSuites();
  renderTree('suites-tree', { 'Priority Suites': { 'All': suites } }, atomSvgAnim, ruleSvgAnim, 'suite');

  // Wire up expand/collapse and selection
  bindTreeEvents('requests-tree', (item, type) => showDetailsPanel(item, type));
  bindTreeEvents('suites-tree', (item, type) => showDetailsPanel(item, type));
});
