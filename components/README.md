# Components Directory

This directory contains reusable UI components for the Ruliad Navigator application.

## Component Files

- **RequestItem.js**: Component for displaying individual requests in the tree view
- **SuiteItem.js**: Component for displaying individual priority suites in the tree view
- **RequestForm.js**: Component for handling the request dialog form
- **SuiteForm.js**: Component for handling the suite dialog form
- **index.js**: Entry point for all components, providing a unified API

## Usage

Import the components in your JavaScript files:

```javascript
const components = require('./components');
```

### Displaying Requests

```javascript
components.displayRequests(
  requests,                // Array of request objects
  requestsTreeElement,     // DOM element to render requests in
  executeRequestFunction,  // Function to execute a request
  showRunHistoryFunction,  // Function to show run history
  toggleStatusFunction,    // Function to toggle request status
  detailsElement           // DOM element to display details in
);
```

### Displaying Priority Suites

```javascript
components.displayPrioritySuites(
  suites,                   // Array of suite objects
  suitesTreeElement,        // DOM element to render suites in
  executeSuiteFunction,     // Function to execute a suite
  showRunHistoryFunction,   // Function to show run history
  toggleStatusFunction,     // Function to toggle suite status
  detailsElement            // DOM element to display details in
);
```

### Initializing Forms

```javascript
components.initRequestForm(
  requestDialog,           // Request dialog DOM element
  requestForm,             // Request form DOM element
  saveRequestFunction,     // Function to save a request
  loadRequestsFunction,    // Function to load requests
  loggedInUser             // Currently logged in user
);

components.initSuiteForm(
  suiteDialog,             // Suite dialog DOM element
  suiteForm,               // Suite form DOM element
  saveSuiteFunction,       // Function to save a suite
  loadSuitesFunction,      // Function to load suites
  currentEnvironment,      // Current environment
  loggedInUser,            // Currently logged in user
  dialogModule             // Electron dialog module
);
```