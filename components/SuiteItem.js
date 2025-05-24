// SuiteItem.js - Component for displaying individual priority suites in the tree view

/**
 * Creates a suite item element for the suites tree
 * @param {Object} suite - The suite object
 * @param {Function} executePrioritySuite - Function to execute the suite
 * @param {Function} showRunHistory - Function to show run history
 * @param {Function} toggleSuiteStatus - Function to toggle suite status
 * @returns {HTMLElement} - The suite item DOM element
 */
function createSuiteItem(suite, executePrioritySuite, showRunHistory, toggleSuiteStatus) {
  const suiteItem = document.createElement('div');
  suiteItem.className = 'tree-item-leaf';
  suiteItem.textContent = suite.name;
  
  // Status indicator
  const statusIndicator = document.createElement('span');
  statusIndicator.className = `status-indicator ${suite.status}`;
  statusIndicator.title = `Status: ${suite.status}`;
  statusIndicator.textContent = suite.status === 'active' ? '●' : '○';
  
  // Execute button
  const executeBtn = document.createElement('button');
  executeBtn.textContent = '▶️';
  executeBtn.className = 'tree-action';
  executeBtn.title = 'Execute Suite';
  executeBtn.onclick = (e) => {
    e.stopPropagation();
    executePrioritySuite(suite.id, suite);
  };
  
  // History button
  const historyBtn = document.createElement('button');
  historyBtn.textContent = '📋';
  historyBtn.className = 'tree-action';
  historyBtn.title = 'View Run History';
  historyBtn.onclick = (e) => {
    e.stopPropagation();
    showRunHistory('suite', suite.id, suite.name);
  };
  
  // Status toggle button
  const statusBtn = document.createElement('button');
  statusBtn.textContent = suite.status === 'active' ? '⏸️' : '▶️';
  statusBtn.className = 'tree-action';
  statusBtn.title = suite.status === 'active' ? 'Deactivate' : 'Activate';
  statusBtn.onclick = (e) => {
    e.stopPropagation();
    toggleSuiteStatus(suite.id, suite.status);
  };
  
  suiteItem.prepend(statusIndicator);
  suiteItem.prepend(executeBtn);
  suiteItem.appendChild(historyBtn);
  suiteItem.appendChild(statusBtn);
  
  return suiteItem;
}

module.exports = { createSuiteItem };