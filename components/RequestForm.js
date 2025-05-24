// RequestForm.js - Component for the request dialog form

/**
 * Initializes the request form component
 * @param {HTMLElement} requestDialog - The request dialog element
 * @param {HTMLElement} requestForm - The request form element
 * @param {Function} saveRequest - Function to save the request
 * @param {Function} loadRequests - Function to reload the requests list
 * @param {string} loggedInUser - The currently logged in user
 */
function initRequestForm(requestDialog, requestForm, saveRequest, loadRequests, loggedInUser) {
  // Add Request button
  document.getElementById('add-request').addEventListener('click', () => {
    requestDialog.showModal();
  });
  
  // Cancel Request button
  document.getElementById('cancel-request').addEventListener('click', () => {
    requestDialog.close();
  });
  
  // Handle request form submission
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather fields
    const newReq = {
      name: document.getElementById('request-name').value.trim(),
      environment: document.getElementById('request-env').value.trim(),
      ruleName: document.getElementById('request-rule-name').value.trim(),
      personaType: document.getElementById('request-persona').value.trim(),
      personaId: document.getElementById('request-persona-id').value.trim(),
      status: 'active', // Set default status for new requests
      createdBy: loggedInUser
    };
    
    // Save to database
    try {
      await saveRequest(newReq.environment, newReq);
      console.log('Request saved successfully');
      requestDialog.close();
      loadRequests(); // Refresh the list
    } catch (error) {
      console.error('Error saving request:', error);
      alert('Failed to save request: ' + error.message);
    }
  });
}

module.exports = { initRequestForm };