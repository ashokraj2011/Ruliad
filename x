
// utils/svg.js
// Exports SVG markup for animated icons

const atomSvgAnim = `
<svg class="atom-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="6" fill="var(--accent)"/>
  <ellipse cx="32" cy="32" rx="20" ry="6" stroke="var(--accent)" fill="none" stroke-width="2" transform="rotate(0 32 32)"/>
  <ellipse cx="32" cy="32" rx="20" ry="6" stroke="var(--accent)" fill="none" stroke-width="2" transform="rotate(60 32 32)"/>
  <ellipse cx="32" cy="32" rx="20" ry="6" stroke="var(--accent)" fill="none" stroke-width="2" transform="rotate(120 32 32)"/>
</svg>`;

const ruleSvgAnim = `
<svg class="rule-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <path fill="var(--accent)" d="M32 24a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm28 8l-6-2.4a20 20 0 0 0-3.6-8.4l3.6-6.4-7.2-7.2-6.4 3.6a20 20 0 0 0-8.4-3.6L40 4H24l2.4 6.4a20 20 0 0 0-8.4 3.6l-6.4-3.6-7.2 7.2 3.6 6.4a20 20 0 0 0-3.6 8.4L4 32v8l6.4 2.4a20 20 0 0 0 3.6 8.4l-3.6 6.4 7.2 7.2 6.4-3.6a20 20 0 0 0 8.4 3.6L24 60h16l-2.4-6.4a20 20 0 0 0 8.4-3.6l6.4 3.6 7.2-7.2-3.6-6.4a20 20 0 0 0 3.6-8.4L60 40z"/>
</svg>`;

module.exports = { atomSvgAnim, ruleSvgAnim };


// components/tree.js
// Renders a hierarchical tree and binds events

/**
 * renderTree: Given a container ID and data map, generate the HTML tree.
 * @param {string} containerId - DOM id of tree container
 * @param {Object} data - { groupName: { subgroupName: [items], ... }, ... }
 * @param {string} atomHtml, ruleHtml - SVG snippets
 * @param {string} [leafType='request']
 */
function renderTree(containerId, data, atomHtml, ruleHtml, leafType='request') {
    const container = document.getElementById(containerId);
    let html = '';
    for (const [group, submap] of Object.entries(data)) {
        html += `<div class="tree-node">`;
        html += `<div class="tree-header" data-expanded="false">${atomHtml}<span>${group}</span></div>`;
        html += `<div class="tree-children hidden">`;
        for (const [sub, list] of Object.entries(submap)) {
            html += `<div class="tree-node">`;
            html += `<div class="tree-header" data-expanded="false">${ruleHtml}<span>${sub}</span></div>`;
            html += `<div class="tree-children hidden">`;
            list.forEach(item => {
                html += `<div class="tree-item-leaf" data-type="${leafType}" data-id="${item.id}">` +
                    `<span>${item.name || item.rule_name || 'item'}</span></div>`;
            });
            html += `</div></div>`;
        }
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

/**
 * bindTreeEvents: Delegates expand/collapse and leaf selection callback
 */
function bindTreeEvents(containerId, onLeafClick) {
    const cont = document.getElementById(containerId);
    cont.addEventListener('click', e => {
        const leaf = e.target.closest('.tree-item-leaf');
        if (leaf) {
            const type = leaf.dataset.type;
            const id = leaf.dataset.id;
            onLeafClick({ id }, type);
            return;
        }
        const hd = e.target.closest('.tree-header');
        if (hd) hd.nextElementSibling.classList.toggle('hidden');
    });
}

module.exports = { renderTree, bindTreeEvents };


// components/details.js
// Renders the details panel for a selected item

/**
 * showDetailsPanel: display item JSON plus Run and History buttons
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
        const res = { status:'ok', ts:new Date().toISOString(), type, id:item.id };
        document.getElementById('action-result').innerHTML = `<pre>${JSON.stringify(res,null,2)}</pre>`;
    });
    document.getElementById('btn-history').addEventListener('click', async () => {
        const hist = await require('../db').getRunHistory(require('../config').defaultEnvironment, type, item.id);
        document.getElementById('action-result').innerHTML = `<pre>${JSON.stringify(hist,null,2)}</pre>`;
    });
}

module.exports = { showDetailsPanel };
