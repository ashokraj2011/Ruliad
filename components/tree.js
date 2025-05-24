// components/tree.js
// Renders a hierarchical tree and binds click & expand/collapse

// Global variable to store copied node data
let copiedNodeData = null;

// Add CSS styles for context menus if they don't exist
function ensureContextMenuStyles() {
    if (!document.getElementById('context-menu-styles')) {
        const style = document.createElement('style');
        style.id = 'context-menu-styles';
        style.textContent = `
            .context-menu {
                position: fixed;
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                min-width: 150px;
            }
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                user-select: none;
            }
            .context-menu-item:hover {
                background-color: #f0f0f0;
            }
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                border-radius: 5px;
                z-index: 1000;
                animation: fadeOut 3s forwards;
            }
            @keyframes fadeOut {
                0% { opacity: 1; }
                70% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * renderTree: Populate a container with a nested tree structure.
 * @param {string} containerId    – DOM element ID to render into
 * @param {Object} data           – { env: { ruleName: [items] } }
 * @param {string} atomHtml       – SVG markup for environment icon
 * @param {string} ruleHtml       – SVG markup for rule icon
 * @param {string} [leafType='request'] – data-type attribute for leaf nodes
 */
function renderTree(containerId, data, atomHtml, ruleHtml, leafType = 'request') {
    const container = document.getElementById(containerId);

    // Save any floating buttons before clearing the container
    const floatingButtons = container.querySelectorAll('.floating-add-button');
    const savedButtons = [];
    floatingButtons.forEach(button => {
        console.log('Saving floating button:', button.id, button.textContent);
        // Check if the button is a direct child of the container before removing it
        if (button.parentNode === container) {
            // Remove the button from the container but keep a reference to it
            container.removeChild(button);
        }
        savedButtons.push(button);
    });

    let html = '';

    // Add root node based on containerId
    const { folderSvgAnim, openFolderSvgAnim } = require('../utils/svg');
    if (containerId === 'api-calls-tree') {
        // Add API root node
        html += `<div class="tree-node">`;
        html += `  <div class="tree-header" data-expanded="true">${openFolderSvgAnim}<span>API</span></div>`;
        html += `  <div class="tree-children">`;
    } else if (containerId === 'requests-tree') {
        // Add Rules root node
        html += `<div class="tree-node">`;
        html += `  <div class="tree-header" data-expanded="true">${openFolderSvgAnim}<span>Rules</span></div>`;
        html += `  <div class="tree-children">`;
    } else if (containerId === 'suites-tree') {
        // Add Suites root node
        html += `<div class="tree-node">`;
        html += `  <div class="tree-header" data-expanded="true">${openFolderSvgAnim}<span>Suites</span></div>`;
        html += `  <div class="tree-children">`;
    }

    const { closedFolderSvgAnim, fileSvgAnim, atomSvgAnim, apiSvgAnim } = require('../utils/svg');

    for (const [env, rules] of Object.entries(data)) {
        html += `<div class="tree-node">`;
        html += `  <div class="tree-header" data-expanded="false">${closedFolderSvgAnim}<span>${env}</span></div>`;
        html += `  <div class="tree-children hidden">`;

        for (const [ruleName, items] of Object.entries(rules)) {
            html += `<div class="tree-node">`;
            html += `  <div class="tree-header" data-expanded="false" data-rule-name="${ruleName}" data-env="${env}">${closedFolderSvgAnim}<span>${ruleName}</span></div>`;
            html += `  <div class="tree-children hidden">`;

            // group by personaType if >1
            const byPersona = items.reduce((acc, it) => {
                const key = it.personaType || 'Default';
                (acc[key] = acc[key]||[]).push(it);
                return acc;
            }, {});
            if (Object.keys(byPersona).length > 1) {
                for (const [persona, personaItems] of Object.entries(byPersona)) {
                    html += `<div class="tree-node">`;
                    html += `  <div class="tree-header" data-expanded="false">${closedFolderSvgAnim}<span>${persona}</span></div>`;
                    html += `  <div class="tree-children hidden">`;
                    personaItems.forEach(i => html += leaf(i));
                    html += `  </div></div>`;
                }
            } else {
                items.forEach(i => html += leaf(i));
            }

            html += `  </div></div>`;
        }

        html += `  </div></div>`;
    }

    // Close root node divs if they were added
    if (containerId === 'api-calls-tree' || containerId === 'requests-tree') {
        html += `  </div></div>`;
    }

    container.innerHTML = html;

    // Re-add the floating buttons after rendering the tree
    savedButtons.forEach(button => {
        console.log('Re-adding floating button:', button.id, button.textContent);

        // Add a data attribute to track that this button was preserved
        button.setAttribute('data-preserved', 'true');

        container.appendChild(button);

        // Add a one-time event listener to log when the button is clicked
        // This won't interfere with existing event listeners
        button.addEventListener('click', function logClick() {
            console.log(`Preserved button ${button.id} clicked!`);
            // Remove this listener after it's fired once
            button.removeEventListener('click', logClick);
        }, { once: true });
    });

    // Log the number of floating buttons after re-adding them
    console.log('Number of floating buttons after re-adding:', container.querySelectorAll('.floating-add-button').length);

    function leaf(item) {
        const label = item.name || item.rule_name || item.id || '';
        // Store the full item data as a JSON string in a data attribute
        const itemData = JSON.stringify(item);

        // Use different icons based on leaf type
        let iconSvg;
        if (leafType === 'request') {
            // Use atom icon for rule leaf nodes
            iconSvg = atomSvgAnim;
        } else if (leafType === 'api_call') {
            // Use API/JSON icon for API leaf nodes
            iconSvg = apiSvgAnim;
        } else {
            // Use file icon for other leaf types (like suite)
            iconSvg = fileSvgAnim;
        }

        return `
      <div class="tree-item-leaf" data-type="${leafType}" data-id="${item.id}" data-item='${itemData.replace(/'/g, "&apos;")}'>
        ${iconSvg}<span>${label}</span>
      </div>`;
    }
}


/**
 * bindTreeEvents: Delegates clicks for expand/collapse arrows and leaf selection
 * @param {string} containerId
 * @param {Function} onLeafClick – (item:{id}, type) ⇒ void
 */
function bindTreeEvents(containerId, onLeafClick) {
    const cont = document.getElementById(containerId);
    if (!cont) return;

    cont.addEventListener('click', e => {
        // Remove selected class from all items
        cont.querySelectorAll('.tree-header.selected, .tree-item-leaf.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // 1) Leaf click
        const leaf = e.target.closest('.tree-item-leaf');
        if (leaf && cont.contains(leaf)) {
            // Add selected class to the clicked leaf
            leaf.classList.add('selected');

            // Parse the full item data from the data-item attribute
            let itemData;
            try {
                itemData = JSON.parse(leaf.dataset.item || '{}');
            } catch (err) {
                console.error('Error parsing item data:', err);
                itemData = { id: leaf.dataset.id };
            }
            onLeafClick(itemData, leaf.dataset.type);
            return;
        }
        // 2) Header click (expand/collapse)
        const hd = e.target.closest('.tree-header');
        if (hd && cont.contains(hd)) {
            // Add selected class to the clicked header
            hd.classList.add('selected');

            const kids = hd.nextElementSibling;
            const expanded = hd.getAttribute('data-expanded') === 'true';
            const newExpanded = !expanded;
            hd.setAttribute('data-expanded', newExpanded ? 'true' : 'false');
            kids.classList.toggle('hidden');

            // Toggle folder icon between open and closed
            const { openFolderSvgAnim, closedFolderSvgAnim } = require('../utils/svg');
            // Get the first child of the header (which should be the icon)
            const iconElement = hd.querySelector('svg');
            if (iconElement) {
                // Replace the icon with the appropriate folder icon
                if (newExpanded) {
                    // Replace with open folder icon
                    iconElement.outerHTML = openFolderSvgAnim;
                } else {
                    // Replace with closed folder icon
                    iconElement.outerHTML = closedFolderSvgAnim;
                }
            }
        }
    });

    // Add context menu for rule headers and leaf nodes
    cont.addEventListener('contextmenu', e => {
        // Check for environment headers first
        const envHeader = e.target.closest('.tree-header:not([data-rule-name])');
        if (envHeader && cont.contains(envHeader) && envHeader.nextElementSibling.classList.contains('tree-children')) {
            e.preventDefault();

            // Get environment name from the span inside the header
            const envName = envHeader.querySelector('span').textContent;

            // Create context menu for environment
            showEnvironmentContextMenu(e.clientX, e.clientY, {
                environment: envName
            });
            return;
        }

        // Check for rule headers next
        const ruleHeader = e.target.closest('.tree-header[data-rule-name]');
        if (ruleHeader && cont.contains(ruleHeader)) {
            e.preventDefault();

            // Get rule data
            const ruleName = ruleHeader.dataset.ruleName;
            const env = ruleHeader.dataset.env;

            // Create context menu
            showRuleContextMenu(e.clientX, e.clientY, {
                ruleName: ruleName,
                environment: env
            });
            return;
        }

        // Check for leaf nodes
        const leafNode = e.target.closest('.tree-item-leaf');
        if (leafNode && cont.contains(leafNode)) {
            e.preventDefault();

            // Get leaf data
            const id = leafNode.dataset.id;
            const type = leafNode.dataset.type;

            // Create context menu for leaf node
            showLeafContextMenu(e.clientX, e.clientY, {
                id: id,
                type: type
            });
        }
    });
}

/**
 * showRuleContextMenu: Displays a context menu for rules with options
 * @param {number} x - X position for the menu
 * @param {number} y - Y position for the menu
 * @param {Object} ruleData - Data about the rule
 */
function showRuleContextMenu(x, y, ruleData) {
    // Ensure context menu styles are added
    ensureContextMenuStyles();

    // Remove any existing context menus
    const existingMenu = document.getElementById('rule-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'rule-context-menu';
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.padding = '5px 0';

    // Add menu items
    let menuItems = [
        { label: 'Run', action: () => handleRunRule(ruleData) },
        { label: 'Edit', action: () => handleEditRule(ruleData) },
        { label: 'Delete', action: () => handleDeleteRule(ruleData) },
        { label: 'Show History', action: () => handleShowRuleHistory(ruleData) },
        { label: 'Analyze', action: () => handleAnalyzeRule(ruleData) },
        { label: 'Show Rule Definition', action: () => handleShowRuleDefinition(ruleData) }
    ];

    // Add paste option if there's copied data
    if (copiedNodeData) {
        menuItems.push({ label: 'Paste', action: () => handlePasteToRule(ruleData) });
    }

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;

        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });

        menu.appendChild(menuItem);
    });

    // Add the menu to the document
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Handler functions for context menu actions
function handleRunRule(ruleData) {
    // Get the environment first
    const environment = ruleData.environment || '';
    const ruleName = ruleData.ruleName || '';

    // Set the environment
    document.getElementById('run-env').value = environment;

    // Import the populateRuleNameDropdown function
    const { populateRuleNameDropdown } = require('../services/ruleMetadata');

    // Populate the rule name dropdown and select the rule
    const runRuleNameSelect = document.getElementById('run-rule-name');
    populateRuleNameDropdown(runRuleNameSelect, environment, ruleName);

    // Focus on the run panel
    const runPanel = document.getElementById('run-panel');
    if (runPanel) {
        runPanel.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleEditRule(ruleData) {
    // Open the request dialog for editing
    const reqDlg = document.getElementById('request-dialog');
    const reqForm = document.getElementById('request-form');

    if (reqDlg && reqForm) {
        reqForm.reset();

        // Get the environment first
        const environment = ruleData.environment || '';
        const ruleName = ruleData.ruleName || '';

        // Set the environment
        document.getElementById('request-env').value = environment;

        // Import the populateRuleNameDropdown function
        const { populateRuleNameDropdown } = require('../services/ruleMetadata');

        // Populate the rule name dropdown and select the rule
        const requestRuleNameSelect = document.getElementById('request-rule-name');
        populateRuleNameDropdown(requestRuleNameSelect, environment, ruleName);

        reqDlg.showModal();
    }
}

function handleDeleteRule(ruleData) {
    if (confirm(`Are you sure you want to delete rule "${ruleData.ruleName}"?`)) {
        // Here you would call a function to delete the rule from the database
        console.log(`Deleting rule: ${ruleData.ruleName} from environment: ${ruleData.environment}`);
        // After deletion, you would refresh the tree
        alert(`Rule "${ruleData.ruleName}" has been deleted.`);
    }
}

function handleShowRuleHistory(ruleData) {
    // Open history dialog or navigate to history panel
    const historyPanel = document.getElementById('history-panel');
    if (historyPanel) {
        historyPanel.scrollIntoView({ behavior: 'smooth' });
        // Here you would load and display the history for this specific rule
        console.log(`Showing history for rule: ${ruleData.ruleName}`);
    }
}

function handleAnalyzeRule(ruleData) {
    console.log(`Analyzing rule: ${ruleData.ruleName}`);

    // Get the Rule Analyzer dialog
    const ruleAnalyzerDialog = document.getElementById('rule-analyzer-dialog');
    if (!ruleAnalyzerDialog) {
        console.error('Rule Analyzer dialog not found');
        return;
    }

    // Get form elements
    const analyzerEnv = document.getElementById('analyzer-env');
    const analyzerRuleName = document.getElementById('analyzer-rule-name');
    const analyzerPersona = document.getElementById('analyzer-persona');
    const analyzerPersonaId = document.getElementById('analyzer-persona-id');
    const analyzerRunOption = document.getElementById('analyzer-run-option');

    if (!analyzerEnv || !analyzerRuleName || !analyzerPersona || !analyzerPersonaId || !analyzerRunOption) {
        console.error('Rule Analyzer form elements not found');
        return;
    }

    // Set form values
    analyzerEnv.value = ruleData.environment || '';

    // Import the populateRuleNameDropdown function
    const { populateRuleNameDropdown } = require('../services/ruleMetadata');

    // Populate the rule name dropdown and select the rule
    populateRuleNameDropdown(analyzerRuleName, analyzerEnv.value, ruleData.ruleName || '');

    // Set default values for other fields
    analyzerPersona.value = 'XID'; // Default to XID
    analyzerPersonaId.value = ''; // Empty by default
    analyzerRunOption.value = 'normal'; // Default to normal

    // Show the dialog
    ruleAnalyzerDialog.showModal();
}

/**
 * Renders a rule definition in a visually appealing way
 * @param {Object} ruleDefinition - The rule definition object
 * @param {HTMLElement} container - The container element to render the rule definition in
 */
function renderRuleDefinition(ruleDefinition, container) {
    // Clear the container
    container.innerHTML = '';

    // Create a function to recursively render rule terms
    function renderTerms(terms, parentOp, level = 0) {
        const termsList = document.createElement('ul');
        termsList.className = 'rule-terms';
        termsList.style.paddingLeft = level > 0 ? '20px' : '0';
        termsList.style.margin = '10px 0';
        termsList.style.listStyle = 'none';

        // Add the operator as a header if it's a nested term
        if (level > 0 && parentOp) {
            const opItem = document.createElement('li');
            opItem.className = 'rule-operator';

            // Create a more visually appealing operator badge
            const opBadge = document.createElement('div');
            opBadge.className = 'operator-badge';
            opBadge.textContent = parentOp.toUpperCase();
            opBadge.style.display = 'inline-block';
            opBadge.style.padding = '4px 10px';
            opBadge.style.borderRadius = '12px';
            opBadge.style.fontWeight = 'bold';
            opBadge.style.fontSize = '14px';
            opBadge.style.color = 'white';
            opBadge.style.marginBottom = '10px';

            // Different colors for different operators
            if (parentOp === 'and') {
                opBadge.style.backgroundColor = '#007896'; // Primary blue
                opBadge.style.boxShadow = '0 2px 4px rgba(0, 120, 150, 0.3)';
            } else {
                opBadge.style.backgroundColor = '#569a32'; // Secondary green
                opBadge.style.boxShadow = '0 2px 4px rgba(86, 154, 50, 0.3)';
            }

            opItem.appendChild(opBadge);
            termsList.appendChild(opItem);
        }

        // Render each term
        terms.forEach((term, index) => {
            const termItem = document.createElement('li');
            termItem.className = 'rule-term';
            termItem.style.marginBottom = '15px';
            termItem.style.padding = '12px';
            termItem.style.backgroundColor = 'white';
            termItem.style.border = '1px solid #ddd';
            termItem.style.borderRadius = '8px';
            termItem.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
            termItem.style.transition = 'all 0.2s ease';

            // Add hover effect
            termItem.onmouseover = function() {
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                this.style.borderColor = '#aaa';
            };
            termItem.onmouseout = function() {
                this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
                this.style.borderColor = '#ddd';
            };

            // Add term number badge
            const termNumber = document.createElement('div');
            termNumber.className = 'term-number';
            termNumber.textContent = `#${index + 1}`;
            termNumber.style.position = 'absolute';
            termNumber.style.top = '-10px';
            termNumber.style.right = '-10px';
            termNumber.style.backgroundColor = '#f0f0f0';
            termNumber.style.color = '#666';
            termNumber.style.borderRadius = '50%';
            termNumber.style.width = '24px';
            termNumber.style.height = '24px';
            termNumber.style.display = 'flex';
            termNumber.style.alignItems = 'center';
            termNumber.style.justifyContent = 'center';
            termNumber.style.fontSize = '12px';
            termNumber.style.fontWeight = 'bold';
            termNumber.style.border = '1px solid #ddd';

            // Make the term item position relative for absolute positioning of the badge
            termItem.style.position = 'relative';
            termItem.appendChild(termNumber);

            if (term.op) {
                // This is a nested operator term
                const nestedTermsHeader = document.createElement('div');
                nestedTermsHeader.className = 'nested-terms-header';
                nestedTermsHeader.textContent = 'Nested Condition Group';
                nestedTermsHeader.style.fontWeight = 'bold';
                nestedTermsHeader.style.marginBottom = '10px';
                nestedTermsHeader.style.padding = '5px 0';
                nestedTermsHeader.style.borderBottom = '1px solid #eee';
                nestedTermsHeader.style.color = '#333';
                termItem.appendChild(nestedTermsHeader);

                const nestedTerms = renderTerms(term.terms, term.op, level + 1);
                termItem.appendChild(nestedTerms);

                // Add a visual indicator for nested terms
                termItem.style.backgroundColor = '#f9f9f9';
                termItem.style.borderLeft = term.op === 'and' ? '4px solid #007896' : '4px solid #569a32';
            } else if (term.field) {
                // This is a field comparison term

                // Create a more structured layout for field terms
                const termContent = document.createElement('div');
                termContent.className = 'term-content';
                termContent.style.display = 'flex';
                termContent.style.flexDirection = 'column';
                termContent.style.gap = '8px';

                // Field name with icon
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'field-container';
                fieldContainer.style.display = 'flex';
                fieldContainer.style.alignItems = 'center';
                fieldContainer.style.gap = '8px';

                // Add field icon
                const fieldIcon = document.createElement('div');
                fieldIcon.className = 'field-icon';
                fieldIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#007896" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9V15M9 12H15" stroke="#007896" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                fieldContainer.appendChild(fieldIcon);

                // Field name
                const fieldName = document.createElement('div');
                fieldName.className = 'field-name';
                fieldName.textContent = `${term.field.namespace}.${term.field.name}`;
                fieldName.style.fontWeight = 'bold';
                fieldName.style.fontSize = '16px';
                fieldName.style.color = '#007896';
                fieldContainer.appendChild(fieldName);

                termContent.appendChild(fieldContainer);

                // Comparison with icon
                const comparisonContainer = document.createElement('div');
                comparisonContainer.className = 'comparison-container';
                comparisonContainer.style.display = 'flex';
                comparisonContainer.style.alignItems = 'center';
                comparisonContainer.style.gap = '8px';
                comparisonContainer.style.marginLeft = '24px';

                // Add comparison icon
                const comparisonIcon = document.createElement('div');
                comparisonIcon.className = 'comparison-icon';

                // Choose icon based on comparison type
                let iconSvg = '';
                if (term.comp.includes('equal')) {
                    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9H19M5 15H19" stroke="#569a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                } else if (term.comp.includes('greater')) {
                    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9L19 9M5 15L19 15" stroke="#569a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(30 12 12)"/></svg>';
                } else if (term.comp.includes('less')) {
                    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9L19 9M5 15L19 15" stroke="#569a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-30 12 12)"/></svg>';
                } else {
                    iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12L12 16L16 12M8 8L12 4L16 8" stroke="#569a32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                }

                comparisonIcon.innerHTML = iconSvg;
                comparisonContainer.appendChild(comparisonIcon);

                // Comparison text
                const comparison = document.createElement('div');
                comparison.className = 'comparison';
                comparison.textContent = term.comp;
                comparison.style.fontWeight = '500';
                comparison.style.color = '#333';
                comparisonContainer.appendChild(comparison);

                termContent.appendChild(comparisonContainer);

                // Value with icon
                const valueContainer = document.createElement('div');
                valueContainer.className = 'value-container';
                valueContainer.style.display = 'flex';
                valueContainer.style.alignItems = 'center';
                valueContainer.style.gap = '8px';
                valueContainer.style.marginLeft = '48px';

                // Add value icon
                const valueIcon = document.createElement('div');
                valueIcon.className = 'value-icon';
                valueIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#c41230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="#c41230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="#c41230" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                valueContainer.appendChild(valueIcon);

                // Value text
                const value = document.createElement('div');
                value.className = 'value';
                value.textContent = term.value;
                value.style.fontWeight = '500';
                value.style.color = '#c41230';
                value.style.fontSize = '15px';
                valueContainer.appendChild(value);

                termContent.appendChild(valueContainer);

                // Metadata section
                const metadataContainer = document.createElement('div');
                metadataContainer.className = 'metadata-container';
                metadataContainer.style.marginTop = '10px';
                metadataContainer.style.padding = '8px';
                metadataContainer.style.backgroundColor = '#f5f5f5';
                metadataContainer.style.borderRadius = '4px';
                metadataContainer.style.fontSize = '12px';
                metadataContainer.style.color = '#666';
                metadataContainer.style.display = 'flex';
                metadataContainer.style.gap = '12px';

                // Datasource
                const datasource = document.createElement('div');
                datasource.className = 'datasource';
                datasource.innerHTML = `<span style="font-weight: bold;">Datasource:</span> ${term.field.datasource}`;
                metadataContainer.appendChild(datasource);

                // Evaluation group
                const evalGroup = document.createElement('div');
                evalGroup.className = 'eval-group';
                evalGroup.innerHTML = `<span style="font-weight: bold;">Group:</span> ${term.field.evaluation_group}`;
                metadataContainer.appendChild(evalGroup);

                termContent.appendChild(metadataContainer);

                termItem.appendChild(termContent);
            }

            termsList.appendChild(termItem);
        });

        return termsList;
    }

    // Create the main container with a card-like appearance
    const mainContainer = document.createElement('div');
    mainContainer.className = 'rule-definition';
    mainContainer.style.backgroundColor = 'white';
    mainContainer.style.borderRadius = '12px';
    mainContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    mainContainer.style.overflow = 'hidden';
    mainContainer.style.margin = '10px';

    // Add a header with the rule operation
    const header = document.createElement('div');
    header.className = 'rule-header';
    header.style.padding = '15px 20px';
    header.style.backgroundColor = '#007896'; // Primary blue
    header.style.color = 'white';
    header.style.fontSize = '20px';
    header.style.fontWeight = 'bold';
    header.style.textAlign = 'center';
    header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    header.style.position = 'relative';
    header.style.overflow = 'hidden';

    // Add decorative elements to the header
    const headerDecor1 = document.createElement('div');
    headerDecor1.style.position = 'absolute';
    headerDecor1.style.top = '-20px';
    headerDecor1.style.left = '-20px';
    headerDecor1.style.width = '60px';
    headerDecor1.style.height = '60px';
    headerDecor1.style.borderRadius = '50%';
    headerDecor1.style.backgroundColor = 'rgba(255,255,255,0.1)';
    header.appendChild(headerDecor1);

    const headerDecor2 = document.createElement('div');
    headerDecor2.style.position = 'absolute';
    headerDecor2.style.bottom = '-15px';
    headerDecor2.style.right = '-15px';
    headerDecor2.style.width = '40px';
    headerDecor2.style.height = '40px';
    headerDecor2.style.borderRadius = '50%';
    headerDecor2.style.backgroundColor = 'rgba(255,255,255,0.1)';
    header.appendChild(headerDecor2);

    // Header content
    const headerContent = document.createElement('div');
    headerContent.style.position = 'relative';
    headerContent.style.zIndex = '1';

    // Add an icon for the operation
    const opIcon = document.createElement('span');
    opIcon.innerHTML = ruleDefinition.op.toLowerCase() === 'and' 
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 11h14v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    opIcon.style.marginRight = '10px';
    opIcon.style.verticalAlign = 'middle';
    headerContent.appendChild(opIcon);

    // Add the operation text
    const opText = document.createTextNode(`Rule Operation: ${ruleDefinition.op.toUpperCase()}`);
    headerContent.appendChild(opText);
    header.appendChild(headerContent);

    mainContainer.appendChild(header);

    // Add a description section
    const description = document.createElement('div');
    description.className = 'rule-description';
    description.style.padding = '15px 20px';
    description.style.backgroundColor = '#f8f8f8';
    description.style.borderBottom = '1px solid #eee';
    description.style.fontSize = '14px';
    description.style.color = '#666';

    // Description text based on operation
    if (ruleDefinition.op.toLowerCase() === 'and') {
        description.textContent = 'All conditions must be true for the rule to evaluate to true.';
    } else {
        description.textContent = 'At least one condition must be true for the rule to evaluate to true.';
    }

    mainContainer.appendChild(description);

    // Container for terms
    const termsWrapper = document.createElement('div');
    termsWrapper.className = 'terms-wrapper';
    termsWrapper.style.padding = '20px';

    // Render the terms
    const termsContainer = renderTerms(ruleDefinition.terms, ruleDefinition.op);
    termsWrapper.appendChild(termsContainer);

    mainContainer.appendChild(termsWrapper);

    // Add a footer with term count
    const footer = document.createElement('div');
    footer.className = 'rule-footer';
    footer.style.padding = '10px 20px';
    footer.style.backgroundColor = '#f8f8f8';
    footer.style.borderTop = '1px solid #eee';
    footer.style.fontSize = '13px';
    footer.style.color = '#666';
    footer.style.textAlign = 'right';

    // Count total terms including nested ones
    function countTerms(terms) {
        let count = 0;
        terms.forEach(term => {
            count++;
            if (term.op && term.terms) {
                count += countTerms(term.terms);
            }
        });
        return count;
    }

    const termCount = countTerms(ruleDefinition.terms);
    footer.textContent = `Total Conditions: ${termCount}`;

    mainContainer.appendChild(footer);

    // Add the rendered rule definition to the container
    container.appendChild(mainContainer);
}

function handleShowRuleDefinition(ruleData) {
    console.log(`Showing rule definition for: ${ruleData.ruleName}`);

    // Get the dialog and content container
    const ruleDefDialog = document.getElementById('rule-definition-dialog');
    const ruleDefContainer = document.getElementById('rule-definition-container');

    if (!ruleDefDialog || !ruleDefContainer) {
        console.error('Rule definition dialog elements not found');
        return;
    }

    // Show loading message
    ruleDefContainer.innerHTML = '<div class="loading">Loading rule definition...</div>';
    ruleDefDialog.showModal();

    // Import the fetchRuleDefinition function
    const { fetchRuleDefinition } = require('../services/ruleMetadata');

    // Fetch the rule definition from the metadata API
    fetchRuleDefinition(ruleData.environment, ruleData.ruleName)
        .then(ruleDefinition => {
            // Render the rule definition in a visually appealing way
            renderRuleDefinition(ruleDefinition, ruleDefContainer);
        })
        .catch(error => {
            // Display error message
            ruleDefContainer.innerHTML = `<div class="error">Error fetching rule definition: ${error.message}</div>`;
            console.error('Error fetching rule definition:', error);
        });

    // Note: Close button event listener is now handled in renderer.js
}

/**
 * showLeafContextMenu: Displays a context menu for leaf nodes with options
 * @param {number} x - X position for the menu
 * @param {number} y - Y position for the menu
 * @param {Object} leafData - Data about the leaf node
 */
function showLeafContextMenu(x, y, leafData) {
    // Ensure context menu styles are added
    ensureContextMenuStyles();

    // Remove any existing context menus
    const existingMenu = document.getElementById('leaf-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'leaf-context-menu';
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.padding = '5px 0';

    // Add menu items based on the leaf type
    let menuItems = [];

    if (leafData.type === 'request') {
        menuItems = [
            { label: 'Run', action: () => handleRunLeaf(leafData) },
            { label: 'Edit', action: () => handleEditLeaf(leafData) },
            { label: 'Delete', action: () => handleDeleteLeaf(leafData) },
            { label: 'Show History', action: () => handleShowLeafHistory(leafData) },
            { label: 'Analyze', action: () => handleAnalyzeLeaf(leafData) },
            { label: 'Copy', action: () => handleCopyLeaf(leafData) }
        ];
    } else if (leafData.type === 'suite') {
        menuItems = [
            { label: 'Run Suite', action: () => handleRunSuite(leafData) },
            { label: 'Edit Suite', action: () => handleEditSuite(leafData) },
            { label: 'Delete Suite', action: () => handleDeleteSuite(leafData) },
            { label: 'Copy', action: () => handleCopyLeaf(leafData) }
        ];
    } else if (leafData.type === 'api_call') {
        menuItems = [
            { label: 'Send Request', action: () => handleSendApiRequest(leafData) },
            { label: 'Edit Request', action: () => handleEditApiRequest(leafData) },
            { label: 'Delete Request', action: () => handleDeleteApiRequest(leafData) },
            { label: 'Copy', action: () => handleCopyLeaf(leafData) }
        ];
    }

    // Add paste option if there's copied data
    if (copiedNodeData) {
        menuItems.push({ label: 'Paste', action: () => handlePasteLeaf(leafData) });
    }

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;

        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });

        menu.appendChild(menuItem);
    });

    // Add the menu to the document
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Handler functions for leaf node context menu actions
function handleRunLeaf(leafData) {
    // Simulate clicking on the leaf node to populate the run form
    const onLeafClick = require('./details').showDetailsPanel;
    onLeafClick({ id: leafData.id }, leafData.type);

    // Focus on the run panel
    const runPanel = document.getElementById('run-panel');
    if (runPanel) {
        runPanel.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleEditLeaf(leafData) {
    // Open the request dialog for editing
    const reqDlg = document.getElementById('request-dialog');
    const reqForm = document.getElementById('request-form');

    if (reqDlg && reqForm) {
        reqForm.reset();

        // Get the full data for the leaf node
        const leafElement = document.querySelector(`.tree-item-leaf[data-id="${leafData.id}"]`);
        if (!leafElement) {
            console.error(`Leaf element with ID ${leafData.id} not found`);
            reqDlg.showModal();
            return;
        }

        let itemData;
        try {
            itemData = JSON.parse(leafElement.dataset.item || '{}');
        } catch (err) {
            console.error('Error parsing item data:', err);
            reqDlg.showModal();
            return;
        }

        // Populate form fields with data from the leaf node
        document.getElementById('request-name').value = itemData.name || '';
        document.getElementById('request-env').value = itemData.environment || 'DEV';
        document.getElementById('request-persona').value = itemData.personaType || 'XID';
        document.getElementById('request-persona-id').value = itemData.personaId || '';
        document.getElementById('request-json-context').value = JSON.stringify(itemData.jsonContext || {}, null, 2);
        document.getElementById('request-status').value = itemData.status || 'active';

        // Import the populateRuleNameDropdown function
        const { populateRuleNameDropdown } = require('../services/ruleMetadata');

        // Populate the rule name dropdown and select the rule
        const requestRuleNameSelect = document.getElementById('request-rule-name');
        populateRuleNameDropdown(requestRuleNameSelect, itemData.environment || 'DEV', itemData.ruleName || '');

        reqDlg.showModal();
    }
}

function handleDeleteLeaf(leafData) {
    if (confirm(`Are you sure you want to delete this request?`)) {
        console.log(`Deleting request with ID: ${leafData.id}`);
        // After deletion, you would refresh the tree
        alert(`Request has been deleted.`);
    }
}

function handleShowLeafHistory(leafData) {
    // Open history panel
    const historyPanel = document.getElementById('history-panel');
    if (historyPanel) {
        historyPanel.scrollIntoView({ behavior: 'smooth' });
        console.log(`Showing history for request ID: ${leafData.id}`);
    }
}

function handleAnalyzeLeaf(leafData) {
    console.log(`Analyzing request with ID: ${leafData.id}`);

    // Get the full data for the leaf node
    const leafElement = document.querySelector(`.tree-item-leaf[data-id="${leafData.id}"]`);
    if (!leafElement) {
        console.error(`Leaf element with ID ${leafData.id} not found`);
        return;
    }

    let itemData;
    try {
        itemData = JSON.parse(leafElement.dataset.item || '{}');
    } catch (err) {
        console.error('Error parsing item data:', err);
        return;
    }

    // Get the Rule Analysis Results dialog
    const ruleAnalysisDialog = document.getElementById('rule-analysis-dialog');
    if (!ruleAnalysisDialog) {
        console.error('Rule Analysis Results dialog not found');
        return;
    }

    // Get values from the item data
    const environment = itemData.environment || '';
    const ruleName = itemData.ruleName || '';
    const personaType = itemData.personaType || 'XID';
    const personaId = itemData.personaId || '';
    const jsonContext = itemData.jsonContext ? JSON.stringify(itemData.jsonContext) : '{}';

    // Show loading indicator
    if (window.showLoading) {
        window.showLoading();
    }

    // Execute the rule and populate the analysis dialog
    executeRuleAndShowAnalysis(environment, ruleName, personaType, personaId, jsonContext, ruleAnalysisDialog);
}

function handleRunSuite(leafData) {
    console.log(`Running suite with ID: ${leafData.id}`);
    alert(`Running suite is not implemented yet.`);
}

/**
 * Execute a rule and show the analysis results in the dialog
 * @param {string} environment - The environment to execute the rule in
 * @param {string} ruleName - The name of the rule to execute
 * @param {string} personaType - The persona type (XID, KID, etc.)
 * @param {string} personaId - The persona ID
 * @param {string} jsonContext - The JSON context as a string
 * @param {HTMLElement} ruleAnalysisDialog - The rule analysis dialog element
 */
async function executeRuleAndShowAnalysis(environment, ruleName, personaType, personaId, jsonContext, ruleAnalysisDialog) {
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
        const config = require('../config');
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
        if (window.hideLoading) {
            window.hideLoading();
        }
    }
}

function handleEditSuite(leafData) {
    console.log(`Editing suite with ID: ${leafData.id}`);
    // Open the suite dialog for editing
    const suiteDlg = document.getElementById('suite-dialog');
    const suiteForm = document.getElementById('suite-form');

    if (suiteDlg && suiteForm) {
        suiteForm.reset();

        // Get the full data for the leaf node
        const leafElement = document.querySelector(`.tree-item-leaf[data-id="${leafData.id}"]`);
        if (!leafElement) {
            console.error(`Leaf element with ID ${leafData.id} not found`);
            suiteDlg.showModal();
            return;
        }

        let itemData;
        try {
            itemData = JSON.parse(leafElement.dataset.item || '{}');
        } catch (err) {
            console.error('Error parsing item data:', err);
            suiteDlg.showModal();
            return;
        }

        // Populate form fields with data from the leaf node
        document.getElementById('suite-name').value = itemData.name || '';

        // Note: The suite file field is read-only and typically populated via a file browser
        // We can't directly set it, but we can display the current file name if available
        const suiteFile = document.getElementById('suite-file');
        if (suiteFile && itemData.filePath) {
            suiteFile.value = itemData.filePath;
        }

        suiteDlg.showModal();
    }
}

function handleDeleteSuite(leafData) {
    if (confirm(`Are you sure you want to delete this suite?`)) {
        console.log(`Deleting suite with ID: ${leafData.id}`);
        // After deletion, you would refresh the tree
        alert(`Suite has been deleted.`);
    }
}

function handleSendApiRequest(leafData) {
    // Simulate clicking on the API call to populate the API caller panel
    const onLeafClick = require('./details').showDetailsPanel;
    onLeafClick({ id: leafData.id }, leafData.type);

    // Focus on the API caller panel
    const apiCallerPanel = document.getElementById('api-caller-panel');
    if (apiCallerPanel) {
        apiCallerPanel.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleEditApiRequest(leafData) {
    console.log(`Editing API request with ID: ${leafData.id}`);
    // Open the API call dialog for editing
    const apiCallDialog = document.getElementById('api-call-dialog');
    const apiCallForm = document.getElementById('api-call-form');

    if (apiCallDialog && apiCallForm) {
        apiCallForm.reset();

        // Get the full data for the leaf node
        const leafElement = document.querySelector(`.tree-item-leaf[data-id="${leafData.id}"]`);
        if (!leafElement) {
            console.error(`Leaf element with ID ${leafData.id} not found`);
            apiCallDialog.showModal();
            return;
        }

        let itemData;
        try {
            itemData = JSON.parse(leafElement.dataset.item || '{}');
        } catch (err) {
            console.error('Error parsing item data:', err);
            apiCallDialog.showModal();
            return;
        }

        // Populate form fields with data from the leaf node
        document.getElementById('api-call-name').value = itemData.name || '';
        document.getElementById('api-call-env').value = itemData.environment || 'DEV';
        document.getElementById('api-call-url').value = itemData.url || '';
        document.getElementById('api-call-method').value = itemData.method || 'GET';
        document.getElementById('api-call-body').value = itemData.body || '';
        document.getElementById('api-call-status').value = itemData.status || 'active';

        // Clear existing headers
        const apiCallHeadersTableBody = document.querySelector('#api-call-headers-table tbody');
        if (apiCallHeadersTableBody) {
            apiCallHeadersTableBody.innerHTML = '';

            // Add headers from the item data
            const headers = itemData.headers || {};
            for (const [key, value] of Object.entries(headers)) {
                const row = apiCallHeadersTableBody.insertRow();
                row.innerHTML = `
                    <td><input type="text" placeholder="Key" class="api-call-header-key control" value="${key}" /></td>
                    <td><input type="text" placeholder="Value" class="api-call-header-value control" value="${value}" /></td>
                    <td><button type="button" class="remove-header-btn control">✖</button></td>
                `;
                row.querySelector('.remove-header-btn').addEventListener('click', () => {
                    row.remove();
                });
            }

            // Add one empty row for adding new headers
            const emptyRow = apiCallHeadersTableBody.insertRow();
            emptyRow.innerHTML = `
                <td><input type="text" placeholder="Key" class="api-call-header-key control" /></td>
                <td><input type="text" placeholder="Value" class="api-call-header-value control" /></td>
                <td><button type="button" class="remove-header-btn control">✖</button></td>
            `;
            emptyRow.querySelector('.remove-header-btn').addEventListener('click', () => {
                emptyRow.remove();
            });
        }

        apiCallDialog.showModal();
    }
}

function handleDeleteApiRequest(leafData) {
    if (confirm(`Are you sure you want to delete this API request?`)) {
        console.log(`Deleting API request with ID: ${leafData.id}`);
        // After deletion, you would refresh the tree
        alert(`API request has been deleted.`);
    }
}

// Handler function for copying a leaf node
function handleCopyLeaf(leafData) {
    // Get the full node data from the leaf element
    const leafElement = document.querySelector(`.tree-item-leaf[data-id="${leafData.id}"]`);
    if (!leafElement) {
        console.error(`Leaf element with ID ${leafData.id} not found`);
        return;
    }

    let itemData;
    try {
        itemData = JSON.parse(leafElement.dataset.item || '{}');
    } catch (err) {
        console.error('Error parsing item data:', err);
        return;
    }

    // Store the leaf data and its type for later use
    copiedNodeData = {
        id: leafData.id,
        type: leafData.type,
        sourceEnv: itemData.environment || require('../config').defaultEnvironment,
        // Store the full item data for direct access
        fullData: itemData
    };

    console.log(`Copied ${leafData.type} with ID: ${leafData.id} from environment: ${copiedNodeData.sourceEnv}`);

    // Ensure styles are added
    ensureContextMenuStyles();

    // Show a notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = `${leafData.type.charAt(0).toUpperCase() + leafData.type.slice(1)} copied to clipboard`;

    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handler function for pasting a leaf node
async function handlePasteLeaf(targetLeafData) {
    if (!copiedNodeData) return;

    try {
        const db = require('../db');
        const config = require('../config');

        // Determine the target environment from the UI or target leaf data
        const targetLeafElement = document.querySelector(`.tree-item-leaf[data-id="${targetLeafData.id}"]`);
        let targetEnv = config.defaultEnvironment;

        if (targetLeafElement) {
            try {
                const targetItemData = JSON.parse(targetLeafElement.dataset.item || '{}');
                targetEnv = targetItemData.environment || targetEnv;
            } catch (err) {
                console.error('Error parsing target item data:', err);
            }
        }

        console.log(`Pasting ${copiedNodeData.type} with ID: ${copiedNodeData.id} from ${copiedNodeData.sourceEnv} to ${targetEnv}`);
        console.log('Copied node data:', JSON.stringify(copiedNodeData));

        // Use the stored full item data instead of fetching from database
        const originalData = copiedNodeData.fullData;
        let newData;

        if (originalData) {
            console.log('Using stored original data:', originalData);

            if (copiedNodeData.type === 'request') {
                // Create a new request with the same data but for the target environment
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    ruleName: originalData.ruleName || 'default', // Ensure ruleName is set
                    personaType: originalData.personaType || 'MID', // Ensure personaType is set
                    personaId: originalData.personaId || 'default', // Ensure personaId is set
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new request
                const result = await db.saveRequest(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Request copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'suite') {
                // Create a new suite with the same data
                newData = {
                    ...originalData,
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new suite
                const result = await db.savePrioritySuite(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Suite copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'api_call') {
                // Create a new API call with the same data but for the target environment
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new API call
                const result = await db.saveApiCall(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`API call copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            }
        } else {
            console.error(`Could not find the original ${copiedNodeData.type} data.`);
            alert(`Could not find the original ${copiedNodeData.type} data.`);
        }
    } catch (error) {
        console.error('Error pasting node:', error);
        alert(`Error pasting node: ${error.message}`);
    }
}

/**
 * showEnvironmentContextMenu: Displays a context menu for environment headers with options
 * @param {number} x - X position for the menu
 * @param {number} y - Y position for the menu
 * @param {Object} envData - Data about the environment
 */
function showEnvironmentContextMenu(x, y, envData) {
    // Ensure context menu styles are added
    ensureContextMenuStyles();

    // Remove any existing context menus
    const existingMenu = document.getElementById('env-context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.id = 'env-context-menu';
    menu.className = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.padding = '5px 0';

    // Add menu items
    let menuItems = [
        { label: 'Refresh', action: () => handleRefreshEnvironment(envData) }
    ];

    // Add paste option if there's copied data
    if (copiedNodeData) {
        menuItems.push({ label: 'Paste', action: () => handlePasteToEnvironment(envData) });
    }

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;

        menuItem.addEventListener('click', () => {
            item.action();
            menu.remove();
        });

        menu.appendChild(menuItem);
    });

    // Add the menu to the document
    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Handler function for refreshing an environment
function handleRefreshEnvironment(envData) {
    console.log(`Refreshing environment: ${envData.environment}`);
    window.dispatchEvent(new CustomEvent('refresh-trees'));
}

    // Handler function for pasting a leaf node directly into an environment
async function handlePasteToEnvironment(envData) {
    if (!copiedNodeData) return;

    try {
        const db = require('../db');
        const config = require('../config');

        // Use the environment data as the target environment
        const targetEnv = envData.environment;

        console.log(`Pasting ${copiedNodeData.type} with ID: ${copiedNodeData.id} from ${copiedNodeData.sourceEnv} to environment ${targetEnv}`);
        console.log('Copied node data:', JSON.stringify(copiedNodeData));

        // Use the stored full item data instead of fetching from database
        const originalData = copiedNodeData.fullData;
        let newData;

        if (originalData) {
            console.log('Using stored original data:', originalData);

            if (copiedNodeData.type === 'request') {
                // Create a new request with the same data but for the target environment
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    ruleName: originalData.ruleName || 'default', // Ensure ruleName is set
                    personaType: originalData.personaType || 'MID', // Ensure personaType is set
                    personaId: originalData.personaId || 'default', // Ensure personaId is set
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new request
                const result = await db.saveRequest(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Request copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'suite') {
                // Create a new suite with the same data
                newData = {
                    ...originalData,
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new suite
                const result = await db.savePrioritySuite(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Suite copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'api_call') {
                // Create a new API call with the same data but for the target environment
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new API call
                const result = await db.saveApiCall(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`API call copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            }
        } else {
            console.error(`Could not find the original ${copiedNodeData.type} data.`);
            alert(`Could not find the original ${copiedNodeData.type} data.`);
        }
    } catch (error) {
        console.error('Error pasting node to environment:', error);
        alert(`Error pasting node to environment: ${error.message}`);
    }
}

// Handler function for pasting a leaf node directly into a rule
async function handlePasteToRule(ruleData) {
    if (!copiedNodeData) return;

    try {
        const db = require('../db');
        const config = require('../config');

        // Use the rule's environment as the target environment
        const targetEnv = ruleData.environment;
        const ruleName = ruleData.ruleName;

        console.log(`Pasting ${copiedNodeData.type} with ID: ${copiedNodeData.id} from ${copiedNodeData.sourceEnv} to rule ${ruleName} in ${targetEnv}`);
        console.log('Copied node data:', JSON.stringify(copiedNodeData));

        // Use the stored full item data instead of fetching from database
        const originalData = copiedNodeData.fullData;
        let newData;

        if (originalData) {
            console.log('Using stored original data:', originalData);

            if (copiedNodeData.type === 'request') {
                // Create a new request with the same data but for the target environment and rule
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    ruleName: ruleName, // Set the rule name to the target rule
                    personaType: originalData.personaType || 'MID', // Ensure personaType is set
                    personaId: originalData.personaId || 'default', // Ensure personaId is set
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new request
                const result = await db.saveRequest(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Request copied successfully to rule ${ruleName} in ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'suite') {
                // Suites don't have a rule association, so just copy to the environment
                // Create a new suite with the same data
                newData = {
                    ...originalData,
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new suite
                const result = await db.savePrioritySuite(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`Suite copied successfully to ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            } else if (copiedNodeData.type === 'api_call') {
                // Create a new API call with the same data but for the target environment
                newData = {
                    ...originalData,
                    environment: targetEnv,
                    ruleName: ruleName, // Set the rule name if applicable
                    name: `${originalData.name} (Copy)`,
                    createdBy: localStorage.getItem('loggedInUser') || 'admin'
                };
                delete newData.id; // Remove the ID so a new one is generated

                // Save the new API call
                const result = await db.saveApiCall(targetEnv, newData);
                console.log('Paste result:', result);

                // Show success notification
                alert(`API call copied successfully to rule ${ruleName} in ${targetEnv} environment`);

                // Refresh the tree
                window.dispatchEvent(new CustomEvent('refresh-trees'));
            }
        } else {
            console.error(`Could not find the original ${copiedNodeData.type} data.`);
            alert(`Could not find the original ${copiedNodeData.type} data.`);
        }
    } catch (error) {
        console.error('Error pasting node to rule:', error);
        alert(`Error pasting node to rule: ${error.message}`);
    }
}

/**
 * adjustTreePanelSizes: Dynamically adjust the size of tree panels based on their content
 * This ensures that panels with more content get more space, while keeping the total area the same
 */
function adjustTreePanelSizes() {
    console.log('Adjusting tree panel sizes based on content...');

    // Get all tree panels
    const treePanels = document.querySelectorAll('#sidebar > div.tree');
    if (treePanels.length === 0) {
        console.log('No tree panels found');
        return;
    }

    // Calculate the total content height of all panels
    let totalContentHeight = 0;
    const contentHeights = [];

    treePanels.forEach(panel => {
        // Get the scroll height of the panel (total content height)
        const contentHeight = panel.scrollHeight;
        contentHeights.push(contentHeight);
        totalContentHeight += contentHeight;
        console.log(`Panel ${panel.id} content height: ${contentHeight}px`);
    });

    // Calculate the available height for all panels
    const sidebar = document.getElementById('sidebar');
    const sidebarHeight = sidebar.clientHeight;
    const otherElementsHeight = Array.from(sidebar.children)
        .filter(el => !el.classList.contains('tree') && el.tagName !== 'HR')
        .reduce((total, el) => total + el.offsetHeight, 0);
    const hrHeight = Array.from(sidebar.querySelectorAll('hr'))
        .reduce((total, hr) => total + hr.offsetHeight, 0);
    const availableHeight = sidebarHeight - otherElementsHeight - hrHeight;

    console.log(`Sidebar height: ${sidebarHeight}px`);
    console.log(`Other elements height: ${otherElementsHeight}px`);
    console.log(`HR elements height: ${hrHeight}px`);
    console.log(`Available height for tree panels: ${availableHeight}px`);

    // Distribute the available height proportionally based on content
    treePanels.forEach((panel, index) => {
        const proportion = contentHeights[index] / totalContentHeight;
        const height = Math.max(100, Math.floor(availableHeight * proportion));
        panel.style.height = `${height}px`;
        panel.style.flexGrow = proportion.toFixed(2);
        console.log(`Setting panel ${panel.id} height to ${height}px (proportion: ${proportion.toFixed(2)})`);
    });

    console.log('Tree panel sizes adjusted');
}

module.exports = { renderTree, bindTreeEvents, adjustTreePanelSizes };
