// components/index.js - Entry point for all components

const { createRequestItem } = require('./RequestItem');
const { createSuiteItem } = require('./SuiteItem');
const { initRequestForm } = require('./RequestForm');
const { initSuiteForm } = require('./SuiteForm');

/**
 * Initializes all UI components
 * @param {Object} params - Parameters for component initialization
 * @param {HTMLElement} params.requestDialog - The request dialog element
 * @param {HTMLElement} params.requestForm - The request form element
 * @param {HTMLElement} params.suiteDialog - The suite dialog element
 * @param {HTMLElement} params.suiteForm - The suite form element
 * @param {HTMLElement} params.detailsElement - The details element for displaying content
 * @param {Function} params.executeRequest - Function to execute a request
 * @param {Function} params.executePrioritySuite - Function to execute a priority suite
 * @param {Function} params.showRunHistory - Function to show run history
 * @param {Function} params.toggleRequestStatus - Function to toggle request status
 * @param {Function} params.toggleSuiteStatus - Function to toggle suite status
 * @param {Function} params.saveRequest - Function to save a request
 * @param {Function} params.savePrioritySuite - Function to save a priority suite
 * @param {Function} params.loadRequests - Function to load requests
 * @param {Function} params.loadPrioritySuites - Function to load priority suites
 * @param {string} params.currentEnvironment - The current environment
 * @param {string} params.loggedInUser - The currently logged in user
 * @param {Object} params.dialog - The Electron dialog module
 */
function initComponents(params) {
  // Initialize forms
  initRequestForm(
    params.requestDialog,
    params.requestForm,
    params.saveRequest,
    params.loadRequests,
    params.loggedInUser
  );
  
  initSuiteForm(
    params.suiteDialog,
    params.suiteForm,
    params.savePrioritySuite,
    params.loadPrioritySuites,
    params.currentEnvironment,
    params.loggedInUser,
    params.dialog
  );
}

/**
 * Displays requests in the UI
 * @param {Array} requests - Array of request objects
 * @param {HTMLElement} requestsTree - The requests tree element
 * @param {Function} executeRequest - Function to execute a request
 * @param {Function} showRunHistory - Function to show run history
 * @param {Function} toggleRequestStatus - Function to toggle request status
 * @param {HTMLElement} detailsElement - The details element for displaying content
 */
function displayRequests(requests, requestsTree, executeRequest, showRunHistory, toggleRequestStatus, detailsElement) {
  requestsTree.innerHTML = '';

  if (requests.length === 0) {
    requestsTree.innerHTML = '<div class="tree-item-leaf">No requests available</div>';
    return;
  }

  requests.forEach(req => {
    const requestItem = createRequestItem(req, executeRequest, showRunHistory, toggleRequestStatus);
    
    requestItem.addEventListener('click', () => {
      detailsElement.textContent = JSON.stringify(req, null, 2);
    });
    
    requestsTree.appendChild(requestItem);
  });
}

/**
 * Displays priority suites in the UI
 * @param {Array} suites - Array of suite objects
 * @param {HTMLElement} suitesTree - The suites tree element
 * @param {Function} executePrioritySuite - Function to execute a priority suite
 * @param {Function} showRunHistory - Function to show run history
 * @param {Function} toggleSuiteStatus - Function to toggle suite status
 * @param {HTMLElement} detailsElement - The details element for displaying content
 */
function displayPrioritySuites(suites, suitesTree, executePrioritySuite, showRunHistory, toggleSuiteStatus, detailsElement) {
  suitesTree.innerHTML = '';

  if (suites.length === 0) {
    suitesTree.innerHTML = '<div class="tree-item-leaf">No priority suites available</div>';
    return;
  }

  suites.forEach(suite => {
    const suiteItem = createSuiteItem(suite, executePrioritySuite, showRunHistory, toggleSuiteStatus);
    
    suiteItem.addEventListener('click', () => {
      detailsElement.textContent = JSON.stringify(suite, null, 2);
    });
    
    suitesTree.appendChild(suiteItem);
  });
}

module.exports = {
  initComponents,
  displayRequests,
  displayPrioritySuites,
  createRequestItem,
  createSuiteItem,
  initRequestForm,
  initSuiteForm
};