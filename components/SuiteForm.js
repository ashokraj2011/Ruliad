// SuiteForm.js - Component for the suite dialog form

/**
 * Initializes the suite form component
 * @param {HTMLElement} suiteDialog - The suite dialog element
 * @param {HTMLElement} suiteForm - The suite form element
 * @param {Function} savePrioritySuite - Function to save the priority suite
 * @param {Function} loadPrioritySuites - Function to reload the suites list
 * @param {string} currentEnvironment - The current environment
 * @param {string} loggedInUser - The currently logged in user
 * @param {Object} dialog - The Electron dialog module
 */
function initSuiteForm(suiteDialog, suiteForm, savePrioritySuite, loadPrioritySuites, currentEnvironment, loggedInUser, dialog) {
  // Add Suite button
  document.getElementById('add-suite').addEventListener('click', () => {
    suiteDialog.showModal();
  });
  
  // Cancel Suite button
  document.getElementById('cancel-suite').addEventListener('click', () => {
    suiteDialog.close();
  });
  
  // Browse for CSV file
  document.getElementById('browse-suite').addEventListener('click', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      document.getElementById('suite-file').value = result.filePaths[0];
    }
  });
  
  // Handle suite form submission
  suiteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather fields
    const newSuite = {
      name: document.getElementById('suite-name').value.trim(),
      csvFilePath: document.getElementById('suite-file').value,
      status: 'active', // Set default status for new suites
      createdBy: loggedInUser
    };
    
    // Save to database
    try {
      await savePrioritySuite(currentEnvironment, newSuite);
      console.log('Priority suite saved successfully');
      suiteDialog.close();
      loadPrioritySuites(); // Refresh the list
    } catch (error) {
      console.error('Error saving priority suite:', error);
      alert('Failed to save priority suite: ' + error.message);
    }
  });
}

module.exports = { initSuiteForm };