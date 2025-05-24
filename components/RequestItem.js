// RequestItem.js - Component for displaying individual requests in the tree view

/**
 * Creates a request item element for the requests tree
 * @param {Object} req - The request object
 * @param {Function} executeRequest - Function to execute the request
 * @param {Function} showRunHistory - Function to show run history
 * @param {Function} toggleRequestStatus - Function to toggle request status
 * @returns {HTMLElement} - The request item DOM element
 */
function createRequestItem(req, executeRequest, showRunHistory, toggleRequestStatus) {
  const requestItem = document.createElement('div');
  requestItem.className = 'tree-item-leaf';
  requestItem.textContent = req.name;
  
  // Status indicator
  const statusIndicator = document.createElement('span');
  statusIndicator.className = `status-indicator ${req.status}`;
  statusIndicator.title = `Status: ${req.status}`;
  statusIndicator.textContent = req.status === 'active' ? '●' : '○';
  
  // Execute button
  const executeBtn = document.createElement('button');
  executeBtn.textContent = '▶️';
  executeBtn.className = 'tree-action';
  executeBtn.title = 'Execute Request';
  executeBtn.onclick = (e) => {
    e.stopPropagation();
    executeRequest(req.id, req);
  };
  
  // History button
  const historyBtn = document.createElement('button');
  historyBtn.textContent = '📋';
  historyBtn.className = 'tree-action';
  historyBtn.title = 'View Run History';
  historyBtn.onclick = (e) => {
    e.stopPropagation();
    showRunHistory('request', req.id, req.name);
  };
  
  // Status toggle button
  const statusBtn = document.createElement('button');
  statusBtn.textContent = req.status === 'active' ? '⏸️' : '▶️';
  statusBtn.className = 'tree-action';
  statusBtn.title = req.status === 'active' ? 'Deactivate' : 'Activate';
  statusBtn.onclick = (e) => {
    e.stopPropagation();
    toggleRequestStatus(req.id, req.status);
  };
  
  requestItem.prepend(statusIndicator);
  requestItem.prepend(executeBtn);
  requestItem.appendChild(historyBtn);
  requestItem.appendChild(statusBtn);
  
  return requestItem;
}

module.exports = { createRequestItem };