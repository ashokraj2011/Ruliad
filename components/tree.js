

// components/tree.js
// Renders a hierarchical tree and binds click & expand/collapse

/**
 * renderTree: Populate a container with a nested tree structure.
 * @param {string} containerId - DOM element ID
 * @param {Object} data - { groupName: { subName: [items] } }
 * @param {string} atomHtml, ruleHtml - SVG snippets for headers
 * @param {string} [leafType='request'] - data-type attribute
 */
function renderTree(containerId, data, atomHtml, ruleHtml, leafType = 'request') {
    const container = document.getElementById(containerId);
    let html = '';
    for (const [group, subs] of Object.entries(data)) {
        html += `<div class="tree-node">`;
        html += `<div class="tree-header" data-expanded="false">${atomHtml}<span>${group}</span></div>`;
        html += `<div class="tree-children hidden">`;
        for (const [sub, items] of Object.entries(subs)) {
            html += `<div class="tree-node">`;
            html += `<div class="tree-header" data-expanded="false">${ruleHtml}<span>${sub}</span></div>`;
            html += `<div class="tree-children hidden">`;
            items.forEach(item => {
                html += `<div class="tree-item-leaf" data-type="${leafType}" data-id="${item.id}">` +
                    `<span>${item.name || item.rule_name || ''}</span></div>`;
            });
            html += `</div></div>`;
        }
        html += `</div></div>`;
    }
    container.innerHTML = html;
}
/**
 * bindTreeEvents: Delegates clicks for expand/collapse and leaf selection
 * @param {string} containerId
 * @param {Function} onLeafClick(item, type)
 */
function bindTreeEvents(containerId, onLeafClick) {
    const cont = document.getElementById(containerId);
    cont.addEventListener('click', e => {
        const leaf = e.target.closest('.tree-item-leaf');
        if (leaf && cont.contains(leaf)) {
            onLeafClick({ id: leaf.dataset.id }, leaf.dataset.type);
            return;
        }
        const header = e.target.closest('.tree-header');
        if (header && cont.contains(header)) {
            const next = header.nextElementSibling;
            next.classList.toggle('hidden');
        }
    });
}

module.exports = { renderTree, bindTreeEvents };