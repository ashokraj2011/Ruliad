// renderer.js
const { initializeDatabase, getRequestsByEnv, getSuites } = require('./services/data');
const { atomSvgAnim, ruleSvgAnim, apiSvgAnim, leafSvgAnim, dbSvgAnim } = require('./utils/svg');
const { renderTree, bindTreeEvents, adjustTreePanelSizes } = require('./components/tree');
const { showDetailsPanel }               = require('./components/details');
const { dialog }                         = require('@electron/remote');

// Loading indicator functions
function showLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.add('active');
  }
}

function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.classList.remove('active');
  }
}

// Make loading functions available globally
window.showLoading = showLoading;
window.hideLoading = hideLoading;

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Only handle keyboard shortcuts when no dialog is open
    const anyDialogOpen = document.querySelector('dialog[open]');
    if (anyDialogOpen) return;

    // Only handle keyboard shortcuts when no input is focused
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) return;

    // Alt+R: Add Request
    if (event.altKey && event.key === 'r') {
      event.preventDefault();
      const addRequestBtn = document.getElementById('add-request');
      if (addRequestBtn) addRequestBtn.click();
    }

    // Alt+A: Add API Call
    if (event.altKey && event.key === 'a') {
      event.preventDefault();
      const addApiCallBtn = document.getElementById('add-api-call');
      if (addApiCallBtn) addApiCallBtn.click();
    }

    // Alt+S: Add Priority Suite
    if (event.altKey && event.key === 's') {
      event.preventDefault();
      const addSuiteBtn = document.getElementById('add-suite');
      if (addSuiteBtn) addSuiteBtn.click();
    }

    // Alt+O: Open Settings
    if (event.altKey && event.key === 'o') {
      event.preventDefault();
      const openSettingsBtn = document.getElementById('open-settings');
      if (openSettingsBtn) openSettingsBtn.click();
    }

    // Alt+E: Execute Rule
    if (event.altKey && event.key === 'e') {
      event.preventDefault();
      const runButton = document.getElementById('run-button');
      if (runButton) runButton.click();
    }

    // Alt+Z: Analyze Rule
    if (event.altKey && event.key === 'z') {
      event.preventDefault();
      const analyzeButton = document.getElementById('analyze-button');
      if (analyzeButton) analyzeButton.click();
    }
  });
}

// Import dialogs.js ONLY from components folder
const { setupDialogListeners }           = require('./components/dialogs');
const { setupApiCallerPanel }            = require('./components/apiCaller'); // Added import for API Caller
const { setupRuleAnalyzer }              = require('./components/ruleAnalyzer'); // Import Rule Analyzer
const { setupTreeSearch }                = require('./components/treeSearch'); // Import Tree Search
const { populateRuleNameDropdown, preloadAllMetadata } = require('./services/ruleMetadata'); // Import ruleMetadata service
const { initMockApi, toggleMockApi }     = require('./services/mockApi'); // Import mock API service
const db = require('./db'); // Added for getAllApiCalls

let currentEnvironment;

// Set a flag to track if we've already setup dialogs
let dialogsInitialized = false;
const cancelReqBtn = document.getElementById('cancel-request');
if (cancelReqBtn) {
  cancelReqBtn.addEventListener('click', () => {
    const dlg = document.getElementById('request-dialog');
    if (dlg.open) dlg.close();
  });
}

const cancelSuiteBtn = document.getElementById('cancel-suite');
if (cancelSuiteBtn) {
  cancelSuiteBtn.addEventListener('click', () => {
    const dlg = document.getElementById('suite-dialog');
    if (dlg.open) dlg.close();
  });
}


const closeHistoryBtn = document.getElementById('close-history');
if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener('click', () => {
    const dlg = document.getElementById('history-dialog');
    if (dlg.open) dlg.close();
  });
}

const closeRuleDefinitionBtn = document.getElementById('close-rule-definition');
if (closeRuleDefinitionBtn) {
  closeRuleDefinitionBtn.addEventListener('click', () => {
    const dlg = document.getElementById('rule-definition-dialog');
    if (dlg.open) dlg.close();
  });
}

const closeAnalysisBtn = document.getElementById('close-analysis');
if (closeAnalysisBtn) {
  closeAnalysisBtn.addEventListener('click', () => {
    const dlg = document.getElementById('rule-analysis-dialog');
    if (dlg.open) dlg.close();
  });
}

const cancelSettingsBtn = document.getElementById('cancel-settings');
if (cancelSettingsBtn) {
  cancelSettingsBtn.addEventListener('click', () => {
    const dlg = document.getElementById('settings-dialog');
    if (dlg.open) dlg.close();
  });
}
// Function to populate all rule name dropdowns based on the current environment
async function populateAllRuleNameDropdowns(environment) {
  console.log(`Populating all rule name dropdowns for environment: ${environment}`);

  // Get all rule name select elements
  const requestRuleNameSelect = document.getElementById('request-rule-name');
  const analyzerRuleNameSelect = document.getElementById('analyzer-rule-name');
  const runRuleNameSelect = document.getElementById('run-rule-name');

  // Populate each dropdown
  if (requestRuleNameSelect) {
    await populateRuleNameDropdown(requestRuleNameSelect, environment);
  }

  if (analyzerRuleNameSelect) {
    await populateRuleNameDropdown(analyzerRuleNameSelect, environment);
  }

  if (runRuleNameSelect) {
    await populateRuleNameDropdown(runRuleNameSelect, environment);
  }
}

// Function to set up environment change listeners
function setupEnvironmentChangeListeners() {
  // Get all environment select elements
  const requestEnvSelect = document.getElementById('request-env');
  const analyzerEnvSelect = document.getElementById('analyzer-env');
  const runEnvSelect = document.getElementById('run-env');

  // Add change event listeners to each select element
  if (requestEnvSelect) {
    requestEnvSelect.addEventListener('change', (event) => {
      const environment = event.target.value;
      const ruleNameSelect = document.getElementById('request-rule-name');
      if (ruleNameSelect) {
        populateRuleNameDropdown(ruleNameSelect, environment);
      }
    });
  }

  if (analyzerEnvSelect) {
    analyzerEnvSelect.addEventListener('change', (event) => {
      const environment = event.target.value;
      const ruleNameSelect = document.getElementById('analyzer-rule-name');
      if (ruleNameSelect) {
        populateRuleNameDropdown(ruleNameSelect, environment);
      }
    });
  }

  if (runEnvSelect) {
    runEnvSelect.addEventListener('change', (event) => {
      const environment = event.target.value;
      const ruleNameSelect = document.getElementById('run-rule-name');
      if (ruleNameSelect) {
        populateRuleNameDropdown(ruleNameSelect, environment);
      }
    });
  }
}

// Function to set up main tabs
function setupMainTabs() {
  const tabs = document.querySelectorAll('.main-tabs .tab');
  const tabContents = document.querySelectorAll('.main-tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Get the tab's data-tab attribute
      const tabId = tab.getAttribute('data-tab');

      // Remove active class from all tabs and tab contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to the clicked tab and corresponding tab content
      tab.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // Set up logout button
  setupLogoutButton();

  console.log('Main tabs setup complete.');
}

// Function to set up logout button
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout-button');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      // Clear user data from localStorage
      localStorage.removeItem('loggedInUser');

      // Redirect to login page
      window.location.href = 'login.html';

      // Show a message (optional)
      alert('You have been logged out');
    });
  }

  console.log('Logout button setup complete.');
}

// Function to set up view toggle and collapse all functionality
function setupViewControls() {
  console.log('Setting up view controls...');

  // Status filtering removed as per requirement

  // Set up drag and drop for panels
  setupPanelDragAndDrop();

  console.log('View controls setup complete.');
}

// Function to set up drag and drop for panels
function setupPanelDragAndDrop() {
  console.log('Setting up panel drag and drop...');

  const panels = document.querySelectorAll('.panel');
  const mainContainer = document.getElementById('main');

  if (!panels.length || !mainContainer) {
    console.error('Panels or main container not found');
    return;
  }

  // Load panel positions from localStorage if available
  loadPanelPositions();

  panels.forEach(panel => {
    const panelHeader = panel.querySelector('h2');

    if (!panelHeader) return;

    // Make panel draggable
    panelHeader.addEventListener('mousedown', startDrag);
    panelHeader.addEventListener('touchstart', (e) => {
      // Prevent default behavior to avoid scrolling
      e.preventDefault();

      // Convert touch event to mouse-like event
      const touch = e.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      };
      startDrag(mouseEvent);
    }, { passive: false });

    function startDrag(e) {
      console.log('Starting drag operation');

      // Only handle left mouse button for mouse events
      if (e.button !== undefined && e.button !== 0) return;

      e.preventDefault();

      const panelRect = panel.getBoundingClientRect();
      const mainRect = mainContainer.getBoundingClientRect();

      // Calculate offset of mouse/touch position relative to panel
      const offsetX = e.clientX - panelRect.left;
      const offsetY = e.clientY - panelRect.top;

      // Add dragging class to panel
      panel.classList.add('dragging');

      // Create placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'panel-placeholder';
      placeholder.style.width = `${panelRect.width}px`;
      placeholder.style.height = `${panelRect.height}px`;
      placeholder.style.gridColumn = panel.style.gridColumn || '';
      placeholder.style.gridRow = panel.style.gridRow || '';

      // Store original position
      const originalPosition = Array.from(mainContainer.children).indexOf(panel);

      // Insert placeholder
      mainContainer.insertBefore(placeholder, panel);

      // Set panel to absolute position for dragging
      panel.style.position = 'absolute';
      panel.style.zIndex = '1000';
      panel.style.width = `${panelRect.width}px`;
      panel.style.height = `${panelRect.height}px`;

      // Position panel at current position
      positionPanel(e.clientX - offsetX, e.clientY - offsetY);

      // Mouse/touch move handler
      function onMove(e) {
        // Prevent default behavior for touch events to avoid scrolling
        if (e.touches) {
          e.preventDefault();
          console.log('Touch move event detected');
        } else {
          console.log('Mouse move event detected');
        }

        // Get clientX/Y from mouse or touch event
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        console.log(`Moving panel to position: (${clientX - offsetX}, ${clientY - offsetY})`);

        positionPanel(clientX - offsetX, clientY - offsetY);

        // Find closest panel or placeholder
        const targetPanel = findClosestPanel(clientX, clientY);

        if (targetPanel) {
          console.log(`Found target panel: ${targetPanel.id || 'unnamed panel'}`);

          if (targetPanel !== panel && targetPanel !== placeholder) {
            console.log('Target panel is valid for swapping');

            // Only swap with actual panels, not placeholders
            if (targetPanel.classList.contains('panel')) {
              console.log('Swapping panels');

              // Get the current position of the target panel
              const targetIndex = Array.from(mainContainer.children).indexOf(targetPanel);
              console.log(`Target panel is at index ${targetIndex}`);

              // Swap the panels - move the target panel to the placeholder's position
              mainContainer.insertBefore(targetPanel, placeholder);
              console.log('Panels swapped successfully');
            } else {
              console.log('Target is not a panel, skipping swap');
            }
          } else {
            console.log('Target panel is the dragged panel or placeholder, skipping swap');
          }
        } else {
          console.log('No target panel found');
        }
      }

      // Mouse/touch end handler
      function onEnd() {
        console.log('Ending drag operation');

        // Remove event listeners
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);

        console.log('Event listeners removed');

        // Remove dragging class
        panel.classList.remove('dragging');

        // Reset panel position to normal flow
        panel.style.position = '';
        panel.style.top = '';
        panel.style.left = '';
        panel.style.zIndex = '';
        panel.style.width = '';
        panel.style.height = '';

        // Handle the placeholder and panel positioning
        if (placeholder.parentNode) {
          console.log('Finalizing panel swap');

          // Get the current position of the placeholder in the grid
          const placeholderIndex = Array.from(mainContainer.children).indexOf(placeholder);
          console.log(`Placeholder is at index ${placeholderIndex}`);

          // If the panel is not already in the DOM (it was removed for absolute positioning)
          // we need to add it back at the placeholder's position
          if (!panel.parentNode || panel.parentNode !== mainContainer) {
            console.log('Panel is not in the main container, inserting at placeholder position');
            mainContainer.insertBefore(panel, placeholder);
            console.log('Panel inserted at placeholder position');
          } else {
            console.log('Panel is already in the main container, preserving its position');
          }

          // Remove the placeholder
          placeholder.parentNode.removeChild(placeholder);
          console.log('Placeholder removed, panel swap preserved');
        } else {
          console.log('Warning: Placeholder has no parent node');
        }

        // Save panel positions
        savePanelPositions();

        console.log('Panel swap completed successfully');

        // Log the final positions of all panels for debugging
        const finalPanels = document.querySelectorAll('.panel');
        console.log(`Final panel arrangement: ${finalPanels.length} panels`);
        finalPanels.forEach((p, i) => {
          console.log(`Panel ${p.id || 'unnamed'} is at index ${i}`);
        });
      }

      // Position panel at specified coordinates
      function positionPanel(x, y) {
        // Keep panel within main container bounds
        const maxX = mainRect.right - panelRect.width;
        const maxY = mainRect.bottom - panelRect.height;

        const boundedX = Math.max(mainRect.left, Math.min(x, maxX));
        const boundedY = Math.max(mainRect.top, Math.min(y, maxY));

        panel.style.left = `${boundedX}px`;
        panel.style.top = `${boundedY}px`;
      }

      // Find closest panel to specified coordinates
      function findClosestPanel(x, y) {
        console.log(`Finding closest panel to coordinates: (${x}, ${y})`);

        let closestDistance = Infinity;
        let closestPanel = null;

        // Only consider actual panels, not the placeholder
        const allPanels = [...document.querySelectorAll('.panel')];
        console.log(`Found ${allPanels.length} panels to consider`);

        allPanels.forEach(p => {
          if (p === panel) {
            console.log(`Skipping panel being dragged: ${p.id || 'unnamed panel'}`);
            return; // Skip the panel being dragged
          }

          const rect = p.getBoundingClientRect();

          // Check if the point (x, y) is inside the panel
          const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

          if (isInside) {
            console.log(`Point is inside panel ${p.id || 'unnamed panel'}`);
            // If the point is inside the panel, set it as the closest with distance 0
            closestPanel = p;
            closestDistance = 0;
            console.log(`Panel ${p.id || 'unnamed panel'} is directly under the cursor`);
            return; // Exit the loop early
          }

          // If not inside, calculate distance to center
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const distance = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );

          console.log(`Panel ${p.id || 'unnamed panel'} distance: ${distance}, width threshold: ${rect.width}`);

          // Only consider panels that are close enough (within a threshold)
          if (distance < closestDistance && distance < rect.width) {
            closestDistance = distance;
            closestPanel = p;
            console.log(`New closest panel: ${p.id || 'unnamed panel'} with distance ${distance}`);
          }
        });

        return closestPanel;
      }

      // Add event listeners for both mouse and touch events
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
    }
  });

  console.log('Panel drag and drop setup complete.');
}

// Function to save panel positions to localStorage
function savePanelPositions() {
  const panels = document.querySelectorAll('.panel');
  const positions = {};

  panels.forEach(panel => {
    const id = panel.id;
    if (id) {
      const index = Array.from(panel.parentNode.children).indexOf(panel);
      positions[id] = index;
    }
  });

  localStorage.setItem('panelPositions', JSON.stringify(positions));
  console.log('Panel positions saved:', positions);
}

// Function to load panel positions from localStorage
function loadPanelPositions() {
  const savedPositions = localStorage.getItem('panelPositions');
  if (!savedPositions) return;

  try {
    const positions = JSON.parse(savedPositions);
    const mainContainer = document.getElementById('main');

    // Sort panels based on saved positions
    const panelsArray = Array.from(mainContainer.children);

    // Sort the array based on saved positions
    panelsArray.sort((a, b) => {
      const aPos = positions[a.id] !== undefined ? positions[a.id] : 999;
      const bPos = positions[b.id] !== undefined ? positions[b.id] : 999;
      return aPos - bPos;
    });

    // Reappend panels in the sorted order
    panelsArray.forEach(panel => {
      mainContainer.appendChild(panel);
    });

    console.log('Panel positions loaded:', positions);
  } catch (error) {
    console.error('Error loading panel positions:', error);
  }
}

// Function to set up Rule Search functionality
function setupRuleSearch() {
  console.log('Setting up Rule Search functionality...');

  const searchInput = document.getElementById('rule-search-input');
  const searchButton = document.getElementById('rule-search-button');
  const searchResults = document.getElementById('search-results');
  const filters = document.querySelectorAll('.search-filters .filter');

  // Set up search button click event
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      performSearch(searchInput.value);
    });
  }


  // Set up search input enter key event
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(searchInput.value);
      }
    });
  }

  // Set up filter click events
  if (filters) {
    filters.forEach(filter => {
      filter.addEventListener('click', () => {
        // Remove active class from all filters
        filters.forEach(f => f.classList.remove('active'));
        // Add active class to clicked filter
        filter.classList.add('active');
        // If there are search results, filter them
        if (searchInput.value) {
          performSearch(searchInput.value);
        }
      });
    });
  }

  // Function to perform search
  function performSearch(query) {
    if (!query.trim()) {
      searchResults.innerHTML = '<div class="no-results">Please enter a search term</div>';
      return;
    }

    console.log(`Performing search for: ${query}`);

    // Get active filter
    const activeFilter = document.querySelector('.search-filters .filter.active');
    const filterType = activeFilter ? activeFilter.textContent : 'All';

    // Mock search results
    const mockResults = [
      { title: 'Rule 1: Customer Eligibility', description: 'Determines if a customer is eligible for a specific product based on criteria.', type: 'Active Rules' },
      { title: 'Rule 2: Transaction Validation', description: 'Validates transaction details against business rules.', type: 'Active Rules' },
      { title: 'Rule 3: Risk Assessment', description: 'Assesses risk level for a given transaction or customer.', type: 'My Rules' },
      { title: 'Rule 4: Legacy Pricing Model', description: 'Old pricing model calculation, replaced by Rule 7.', type: 'Deprecated Rules' },
      { title: 'Rule 5: Compliance Check', description: 'Ensures transaction complies with regulatory requirements.', type: 'Active Rules' }
    ];

    // Filter results based on active filter
    const filteredResults = filterType === 'All' 
      ? mockResults 
      : mockResults.filter(result => result.type === filterType);

    // Filter results based on query
    const queryResults = filteredResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) || 
      result.description.toLowerCase().includes(query.toLowerCase())
    );

    // Display results
    if (queryResults.length === 0) {
      searchResults.innerHTML = `<div class="no-results">No results found for "${query}"</div>`;
    } else {
      searchResults.innerHTML = queryResults.map(result => `
        <div class="search-result">
          <h3>${result.title}</h3>
          <p>${result.description}</p>
          <div class="result-type">${result.type}</div>
        </div>
      `).join('');
    }
  }


  console.log('Rule Search functionality setup complete.');
}

// Function to set up Rule Research functionality
function setupRuleResearch() {
  console.log('Setting up Rule Research functionality...');

  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-message');
  const chatMessages = document.getElementById('chat-messages');

  // Set up send button click event
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      sendMessage();
    });
  }

  // Set up chat input enter key event (Shift+Enter for new line)
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default to avoid new line
        sendMessage();
      }
    });

    // Auto-resize textarea as user types
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });
  }

  // Function to send a message
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Simulate assistant response after a short delay
    setTimeout(() => {
      const responses = [
        "I've found several rules related to your query. The most relevant one is Rule 123: Customer Eligibility, which determines if a customer is eligible for specific products based on their profile and history.",
        "Based on your question, I'd recommend looking at the Transaction Validation rule set, particularly Rule 456 which handles the validation logic you're asking about.",
        "There are 3 rules that match your criteria. Would you like me to explain each one in detail or provide a summary comparison?",
        "The rule you're asking about was deprecated last month. The current rule that handles this functionality is Rule 789: Enhanced Risk Assessment.",
        "I don't have specific information about that rule. Could you provide more details or context about what you're looking for?"
      ];

      // Pick a random response
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'assistant');
    }, 1000);
  }

  // Function to add a message to the chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    messageDiv.textContent = text;

    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  console.log('Rule Research functionality setup complete.');
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get environment but don't initialize database yet
    currentEnvironment = require('./config').defaultEnvironment;
    console.log(`Renderer: Starting application with default environment: ${currentEnvironment}`);

    // IMPORTANT: Only set up dialogs once, and do it before any errors might occur
    if (!dialogsInitialized) {
      console.log(`Renderer: Setting up dialog listeners, API caller panel, Rule Analyzer, and Tree Search...`);
      setupDialogListeners();
      setupApiCallerPanel(); // Initialize the API Caller panel
      setupRuleAnalyzer(); // Initialize the Rule Analyzer
      setupTreeSearch(); // Initialize the Tree Search functionality
      setupMainTabs(); // Initialize the main tabs
      setupKeyboardShortcuts(); // Initialize keyboard shortcuts
      setupViewControls(); // Initialize view controls

      // Initialize Rule Search and Rule Research functionality
      setupRuleSearch();
      setupRuleResearch();

      // Initialize mock API service
      console.log(`Renderer: Initializing mock API service...`);
      initMockApi();
      console.log(`Renderer: Mock API service initialized.`);

      // Preload metadata for all environments
      console.log(`Renderer: Preloading metadata for all environments...`);
      await preloadAllMetadata();
      console.log(`Renderer: Metadata preloading complete.`);

      // Set up environment change listeners
      setupEnvironmentChangeListeners();

      // Populate all rule name dropdowns with the current environment
      await populateAllRuleNameDropdowns(currentEnvironment);

      dialogsInitialized = true;
      console.log(`Renderer: Dialog listeners, API caller panel, Rule Analyzer, Tree Search, and main tabs setup complete.`);
    }

    // Then try database initialization, but don't throw errors that would
    // break the UI rendering
    let dbInitialized = false;
    try {
      console.log(`Renderer: Initializing database for environment: ${currentEnvironment}...`);
      dbInitialized = await initializeDatabase(currentEnvironment);
      console.log(`Renderer: Database initialization ${dbInitialized ? 'succeeded' : 'failed'}.`);

      if (!dbInitialized) {
        console.error(`Renderer: Database initialization failed but didn't throw an error.`);
        setTimeout(() => {
          dialog.showErrorBox('Database Initialization Error',
            'Could not initialize database. Please check your settings and try again.');
        }, 1000);
      }
    } catch (dbErr) {
      console.error('Renderer: Database connection error:', dbErr);
      // Show error message but don't open settings
      setTimeout(() => {
        dialog.showErrorBox('Database Error',
          'Could not connect to database. Please check your settings and try again.\n\n' +
          dbErr.message);
      }, 1000);
    }

    // Continue with UI setup, but only load data if database was initialized successfully
    try {
      if (dbInitialized) {
        console.log(`Renderer: Database initialized successfully, loading data...`);

        console.log(`Renderer: Loading requests for all environments...`);
        const requestsByEnv = await getRequestsByEnv();
        console.log(`Renderer: Rendering requests tree...`);
        renderTree('requests-tree', requestsByEnv, atomSvgAnim, ruleSvgAnim, 'request');

        console.log(`Renderer: Loading priority suites...`);
        const suites = await getSuites();
        console.log(`Renderer: Rendering suites tree with ${suites.length} suites...`);
        renderTree('suites-tree',
            { 'Priority Suites': { 'All': suites } },
            dbSvgAnim, leafSvgAnim, 'suite'
        );

        // Load and render API Calls tree
        console.log(`Renderer: Loading and rendering API calls...`);
        await loadAndRenderApiCalls();
        console.log(`Renderer: Data loading and rendering complete.`);
      } else {
        console.log(`Renderer: Database not initialized, rendering empty trees...`);
        // Render empty trees if database initialization failed
        renderTree('requests-tree', {}, atomSvgAnim, ruleSvgAnim, 'request');
        renderTree('suites-tree', { 'Priority Suites': { 'All': [] } }, dbSvgAnim, leafSvgAnim, 'suite');
        renderTree('api-calls-tree', {}, atomSvgAnim, apiSvgAnim, 'api_call');
      }

      // bind clicks → details panel
      console.log(`Renderer: Binding tree events for all trees...`);
      bindTreeEvents('requests-tree', (item,type) => showDetailsPanel(item,type));
      bindTreeEvents('suites-tree',  (item,type) => showDetailsPanel(item,type));
      bindTreeEvents('api-calls-tree', (item, type) => {
        // When an API call is clicked, populate the API Caller panel
        if (type === 'api_call') {
            console.log(`Renderer: API call clicked, populating API Caller panel...`);
            document.getElementById('api-url').value = item.url || '';
            document.getElementById('api-method').value = item.method || 'GET';
            document.getElementById('api-request-body').value = item.body || '';

            // Populate headers
            const headersTableBody = document.querySelector('#api-headers-table tbody');
            headersTableBody.innerHTML = ''; // Clear existing headers
            const headers = item.headers || {};
            for (const [key, value] of Object.entries(headers)) {
                const row = headersTableBody.insertRow();
                row.innerHTML = `
                    <td><input type="text" placeholder="Key" class="api-header-key control" value="${key}" /></td>
                    <td><input type="text" placeholder="Value" class="api-header-value control" value="${value}" /></td>
                    <td><button type="button" class="remove-header-btn control">✖</button></td>
                `;
                row.querySelector('.remove-header-btn').addEventListener('click', () => row.remove());
            }
            // Add one empty row if no headers or for adding new ones
            const emptyRow = headersTableBody.insertRow();
            emptyRow.innerHTML = `
                <td><input type="text" placeholder="Key" class="api-header-key control" /></td>
                <td><input type="text" placeholder="Value" class="api-header-value control" /></td>
                <td><button type="button" class="remove-header-btn control">✖</button></td>
            `;
            emptyRow.querySelector('.remove-header-btn').addEventListener('click', () => emptyRow.remove());

            // Populate query parameters
            const paramsTableBody = document.querySelector('#api-params-table tbody');
            paramsTableBody.innerHTML = ''; // Clear existing params
            const queryParams = item.queryParams || {};
            for (const [key, value] of Object.entries(queryParams)) {
                const row = paramsTableBody.insertRow();
                row.innerHTML = `
                    <td><input type="text" placeholder="Key" class="api-param-key control" value="${key}" /></td>
                    <td><input type="text" placeholder="Value" class="api-param-value control" value="${value}" /></td>
                    <td><button type="button" class="remove-param-btn control">✖</button></td>
                `;
                row.querySelector('.remove-param-btn').addEventListener('click', () => row.remove());
            }
            // Add one empty row if no params or for adding new ones
            const emptyParamRow = paramsTableBody.insertRow();
            emptyParamRow.innerHTML = `
                <td><input type="text" placeholder="Key" class="api-param-key control" /></td>
                <td><input type="text" placeholder="Value" class="api-param-value control" /></td>
                <td><button type="button" class="remove-param-btn control">✖</button></td>
            `;
            emptyParamRow.querySelector('.remove-param-btn').addEventListener('click', () => emptyParamRow.remove());

            // Populate authentication
            const auth = item.auth || { type: 'none' };
            document.getElementById('auth-type').value = auth.type || 'none';

            // Hide all auth fields first
            document.getElementById('basic-auth-fields').classList.add('hidden');
            document.getElementById('bearer-auth-fields').classList.add('hidden');
            document.getElementById('api-key-fields').classList.add('hidden');

            // Show and populate the appropriate auth fields based on type
            switch (auth.type) {
                case 'basic':
                    document.getElementById('basic-auth-fields').classList.remove('hidden');
                    document.getElementById('basic-auth-username').value = auth.username || '';
                    document.getElementById('basic-auth-password').value = auth.password || '';
                    break;
                case 'bearer':
                    document.getElementById('bearer-auth-fields').classList.remove('hidden');
                    document.getElementById('bearer-token').value = auth.token || '';
                    break;
                case 'api-key':
                    document.getElementById('api-key-fields').classList.remove('hidden');
                    document.getElementById('api-key-name').value = auth.keyName || '';
                    document.getElementById('api-key-value').value = auth.keyValue || '';
                    document.getElementById('api-key-location').value = auth.keyLocation || 'header';
                    break;
            }

            console.log(`Renderer: API Caller panel populated successfully.`);
        }
        // Also show raw details in the details panel
        showDetailsPanel(item, type);
      });
      console.log(`Renderer: Tree events binding complete.`);
    } catch (dataErr) {
      console.error('Renderer: Error loading data:', dataErr);
      console.error('Renderer: Error details:', dataErr.message);
      if (dataErr.stack) {
        console.error('Renderer: Stack trace:', dataErr.stack);
      }
      // Just log errors, don't disrupt the UI
    }

    // Setup run button
    document.getElementById('run-button').addEventListener('click', () => {
      const payload = {
        ruleName: document.getElementById('run-rule-name').value,
        environment: document.getElementById('run-env').value,
        personaType: document.getElementById('run-persona').value,
        personaId: document.getElementById('run-persona-id').value,
        jsonContext: JSON.parse(document.getElementById('run-json-context').value || '{}'),
      };
      // mock a result & append to history
      const res = { ...payload, status:'ok', ts:new Date().toISOString() };
      const li = document.createElement('div');
      li.className = 'history-item';
      li.textContent = JSON.stringify(res, null,2);
      document.getElementById('history-list').prepend(li);
    });

    // Setup analyze button
    document.getElementById('analyze-button').addEventListener('click', async () => {
      // Get the Rule Analysis Results dialog
      const ruleAnalysisDialog = document.getElementById('rule-analysis-dialog');
      if (!ruleAnalysisDialog) {
        console.error('Rule Analysis Results dialog not found');
        return;
      }

      // Get values from Run Rules panel
      const environment = document.getElementById('run-env').value;
      const ruleName = document.getElementById('run-rule-name').value;
      const personaType = document.getElementById('run-persona').value;
      const personaId = document.getElementById('run-persona-id').value;
      const jsonContext = document.getElementById('run-json-context').value;

      // Show loading indicator
      showLoading();

      try {
        // Create payload for rule execution
        const payload = {
          ruleName,
          environment,
          personaType,
          personaId,
          jsonContext: JSON.parse(jsonContext || '{}')
        };

        // Get API URL from config based on environment
        const config = require('./config');
        const envConfig = config.environments[environment];
        const apiUrl = `${envConfig.apis.ruleEngine}/execute`;

        // Execute the rule
        console.log('Executing rule with payload:', payload);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        // Parse response
        const result = await response.json();
        console.log('Rule execution result:', result);

        // Populate the rule analysis dialog
        document.getElementById('analysis-rule-result').value = JSON.stringify(result.result || {}, null, 2);
        document.getElementById('analysis-evaluation-data').value = JSON.stringify(result.evaluationData || {}, null, 2);
        document.getElementById('analysis-explanation').value = JSON.stringify(result.explanation || {}, null, 2);

        // Set up the expandable history panel
        const historyPanelHeader = document.getElementById('history-panel-header');
        const historyPanelContent = document.getElementById('history-panel-content');
        const historyLoading = document.getElementById('history-loading');
        const historyItems = document.getElementById('history-items');

        // Remove any existing event listeners by cloning and replacing the element
        const newHistoryPanelHeader = historyPanelHeader.cloneNode(true);
        historyPanelHeader.parentNode.replaceChild(newHistoryPanelHeader, historyPanelHeader);

        // Add click event to the history panel header
        newHistoryPanelHeader.addEventListener('click', async () => {
          // Toggle the expanded class on the header
          newHistoryPanelHeader.classList.toggle('expanded');

          // Toggle the display of the content
          if (historyPanelContent.style.display === 'none') {
            historyPanelContent.style.display = 'block';

            // Show loading spinner
            historyLoading.style.display = 'block';
            historyItems.innerHTML = '';

            try {
              // Fetch history data
              const historyUrl = `${envConfig.apis.ruleEngine}/history/${ruleName}/${personaId}`;
              console.log('Fetching history data from:', historyUrl);

              const historyResponse = await fetch(historyUrl);
              const historyData = await historyResponse.json();
              console.log('History data:', historyData);

              // Hide loading spinner
              historyLoading.style.display = 'none';

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
                  historyItems.appendChild(historyItem);
                });
              } else {
                historyItems.textContent = 'No history found for this rule and persona ID.';
              }
            } catch (error) {
              console.error('Error fetching history data:', error);
              historyLoading.style.display = 'none';
              historyItems.textContent = `Error fetching history: ${error.message}`;
            }
          } else {
            historyPanelContent.style.display = 'none';
          }
        });

        // Show the dialog
        ruleAnalysisDialog.showModal();
      } catch (error) {
        console.error('Error executing rule:', error);
        alert(`Error executing rule: ${error.message}`);
      } finally {
        // Hide loading indicator
        hideLoading();
      }
    });
  } catch (e) {
    console.error('Critical error during app initialization:', e);
    // Show error but don't open settings
    setTimeout(() => {
      dialog.showErrorBox('Initialization Error', e.message);
    }, 1000);
  }
});

// Function to load and render API calls into their tree
async function loadAndRenderApiCalls() {
    console.log(`loadAndRenderApiCalls: Starting to load and render API calls...`);
    try {
        const envs = Object.keys(require('./config').environments);
        console.log(`loadAndRenderApiCalls: Found ${envs.length} environments:`, envs);

        const apiCallsByEnv = {};
        for (const env of envs) {
            console.log(`loadAndRenderApiCalls: Loading API calls for environment: ${env}`);
            try {
                const calls = await db.getAllApiCalls(env);
                console.log(`loadAndRenderApiCalls: Loaded ${calls.length} API calls for environment: ${env}`);

                // Group by a top-level category if needed, or directly list calls
                // For now, let's group them under a generic "Saved API Calls" category per environment
                if (calls.length > 0) {
                    apiCallsByEnv[env] = { 'Saved API Calls': calls };
                    console.log(`loadAndRenderApiCalls: Added ${calls.length} API calls to tree for environment: ${env}`);
                } else {
                    console.log(`loadAndRenderApiCalls: No API calls found for environment: ${env}, skipping`);
                }
            } catch (envError) {
                console.error(`loadAndRenderApiCalls: Error loading API calls for environment ${env}:`, envError);
                console.error(`loadAndRenderApiCalls: Error details:`, envError.message);
                // Continue with other environments even if one fails
            }
        }

        console.log(`loadAndRenderApiCalls: Rendering API calls tree with data for ${Object.keys(apiCallsByEnv).length} environments`);
        renderTree('api-calls-tree', apiCallsByEnv, atomSvgAnim, apiSvgAnim, 'api_call');
        console.log(`loadAndRenderApiCalls: API calls tree rendered successfully`);
        return true;
    } catch (error) {
        console.error('loadAndRenderApiCalls: Error loading and rendering API calls:', error);
        console.error('loadAndRenderApiCalls: Error details:', error.message);
        if (error.stack) {
            console.error('loadAndRenderApiCalls: Stack trace:', error.stack);
        }

        // Render an empty tree to prevent UI errors
        console.log(`loadAndRenderApiCalls: Rendering empty API calls tree due to error`);
        renderTree('api-calls-tree', {}, atomSvgAnim, apiSvgAnim, 'api_call');
        return false;
    }
}

// Make loadAndRenderApiCalls globally available for refresh after saving API calls
window.loadAndRenderApiCalls = loadAndRenderApiCalls;

// Function to refresh all trees
async function refreshAllTrees() {
    console.log('Refreshing all trees...');
    try {
        // Refresh requests tree
        console.log('Refreshing requests tree...');
        const requestsByEnv = await getRequestsByEnv();
        renderTree('requests-tree', requestsByEnv, atomSvgAnim, ruleSvgAnim, 'request');

        // Refresh suites tree
        console.log('Refreshing suites tree...');
        const suites = await getSuites();
        renderTree('suites-tree', { 'Priority Suites': { 'All': suites } }, dbSvgAnim, leafSvgAnim, 'suite');

        // Refresh API calls tree
        console.log('Refreshing API calls tree...');
        await loadAndRenderApiCalls();

        console.log('All trees refreshed successfully');
    } catch (error) {
        console.error('Error refreshing trees:', error);
    }
}

// Add event listener for refresh-trees event
window.addEventListener('refresh-trees', refreshAllTrees);
