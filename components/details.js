// components/details.js
// Shows details panel with Run & History actions

/**
 * showDetailsPanel: Insert JSON + Run/History buttons into #details
 */
function showDetailsPanel(item, type) {
    const detailsEl = document.getElementById('details');
    detailsEl.innerHTML = `
    <pre>${JSON.stringify(item, null, 2)}</pre>
    <div style="margin-top:12px;">
      <button id="btn-run" class="control">▶️ Run</button>
      <button id="btn-history" class="control">📜 History</button>
    </div>
    <div id="action-result" style="margin-top:16px;"></div>
  `;
    document.getElementById('btn-run').addEventListener('click', () => {
        const res = { status: 'ok', timestamp: new Date().toISOString(), type, id: item.id };
        document.getElementById('action-result').innerHTML = `<pre>${JSON.stringify(res, null, 2)}</pre>`;
    });
    document.getElementById('btn-history').addEventListener('click', async () => {
        const hist = await require('../db').getRunHistory(require('../config').defaultEnvironment, type, item.id);
        document.getElementById('action-result').innerHTML = `<pre>${JSON.stringify(hist, null, 2)}</pre>`;
    });
}

module.exports = { showDetailsPanel };
