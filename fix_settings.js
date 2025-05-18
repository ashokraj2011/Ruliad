// fix_settings.js
// This script forcibly cleans up any problematic dialog state
// Include this at the BEGINNING of renderer.js

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Get all dialogs
  const dialogs = document.querySelectorAll('dialog');

  // Force close all dialogs
  dialogs.forEach(dlg => {
    try {
      if (dlg.open) {
        console.log('Forcing close of dialog:', dlg.id);
        dlg.close();
      }
    } catch (e) {
      console.error('Error closing dialog:', e);
    }
  });

  // Apply fix to all dialog close buttons to ensure they work
  setTimeout(() => {
    // Settings dialog specific fix
    const settingsDialog = document.getElementById('settings-dialog');
    const cancelSettings = document.getElementById('cancel-settings');

    if (settingsDialog && cancelSettings) {
      // Replace the original event listener
      cancelSettings.onclick = () => {
        console.log('Forced close of settings dialog');
        try {
          settingsDialog.close();
        } catch (e) {
          console.error('Error closing settings dialog:', e);
          // Fallback - hide with CSS if close() fails
          settingsDialog.style.display = 'none';
        }
        return false;
      };
    }

    // General fix for all dialogs
    document.querySelectorAll('dialog').forEach(dlg => {
      // Override showModal to ensure it works
      const originalShowModal = dlg.showModal;
      dlg.showModal = function() {
        try {
          return originalShowModal.apply(this, arguments);
        } catch (e) {
          console.error('showModal failed, using show() instead:', e);
          this.show();
        }
      };
    });
  }, 500);

  console.log('Dialog fix script loaded and executed');
});
