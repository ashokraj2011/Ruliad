// components/treeSearch.js

/**
 * Sets up the tree search functionality
 */
function setupTreeSearch() {
    // Get DOM elements
    const searchInput = document.getElementById('tree-search-input');
    const searchButton = document.getElementById('tree-search-button');
    
    // Get all tree containers
    const treesContainers = [
        document.getElementById('requests-tree'),
        document.getElementById('api-calls-tree'),
        document.getElementById('suites-tree')
    ].filter(Boolean); // Filter out any null elements
    
    if (!searchInput || !searchButton || treesContainers.length === 0) {
        console.warn('Tree search elements not found. Skipping setup.');
        return;
    }
    
    /**
     * Performs a search across all tree nodes
     * @param {string} searchText - The text to search for
     */
    function searchTrees(searchText) {
        if (!searchText || searchText.trim() === '') {
            // If search text is empty, show all nodes and remove highlights
            resetSearch();
            return;
        }
        
        const searchTermLower = searchText.toLowerCase();
        
        // Process each tree container
        treesContainers.forEach(treeContainer => {
            // Get all tree nodes in this container
            const treeNodes = treeContainer.querySelectorAll('.tree-node');
            
            // Track if any node in this tree matches the search
            let anyNodeMatches = false;
            
            // Process each tree node
            treeNodes.forEach(node => {
                // Check if this node or any of its children match the search
                const nodeMatches = searchNode(node, searchTermLower);
                
                if (nodeMatches) {
                    anyNodeMatches = true;
                }
            });
            
            // If no nodes match in this tree, you might want to show a message
            if (!anyNodeMatches) {
                // Optional: Add a "no results" message to this tree
                // For now, we'll just leave the tree empty
            }
        });
    }
    
    /**
     * Searches a single node and its children for the search term
     * @param {HTMLElement} node - The node to search
     * @param {string} searchTermLower - The lowercase search term
     * @returns {boolean} - Whether this node or any of its children match the search
     */
    function searchNode(node, searchTermLower) {
        // Get all text content in this node (headers and leaf nodes)
        const headers = node.querySelectorAll('.tree-header > span');
        const leafNodes = node.querySelectorAll('.tree-item-leaf > span');
        
        // Check if any header matches
        let headerMatches = false;
        headers.forEach(header => {
            const text = header.textContent.toLowerCase();
            if (text.includes(searchTermLower)) {
                // Highlight the matching text
                highlightText(header, searchTermLower);
                headerMatches = true;
                
                // Expand this node if it's collapsed
                const treeHeader = header.closest('.tree-header');
                if (treeHeader && treeHeader.getAttribute('data-expanded') === 'false') {
                    // Expand the node
                    treeHeader.setAttribute('data-expanded', 'true');
                    const treeChildren = treeHeader.nextElementSibling;
                    if (treeChildren && treeChildren.classList.contains('tree-children')) {
                        treeChildren.classList.remove('hidden');
                    }
                }
            } else {
                // Remove any existing highlights
                removeHighlight(header);
            }
        });
        
        // Check if any leaf node matches
        let leafMatches = false;
        leafNodes.forEach(leaf => {
            const text = leaf.textContent.toLowerCase();
            if (text.includes(searchTermLower)) {
                // Highlight the matching text
                highlightText(leaf, searchTermLower);
                leafMatches = true;
                
                // Make sure all parent nodes are expanded
                let parent = leaf.closest('.tree-children');
                while (parent) {
                    const parentHeader = parent.previousElementSibling;
                    if (parentHeader && parentHeader.classList.contains('tree-header')) {
                        parentHeader.setAttribute('data-expanded', 'true');
                        parent.classList.remove('hidden');
                    }
                    parent = parent.parentElement.closest('.tree-children');
                }
            } else {
                // Remove any existing highlights
                removeHighlight(leaf);
            }
        });
        
        // Check if any child nodes match
        const childNodes = node.querySelectorAll(':scope > .tree-children > .tree-node');
        let childrenMatch = false;
        childNodes.forEach(childNode => {
            if (searchNode(childNode, searchTermLower)) {
                childrenMatch = true;
            }
        });
        
        // If this node or any of its children match, show this node
        const nodeMatches = headerMatches || leafMatches || childrenMatch;
        
        // Show or hide this node based on the search results
        if (nodeMatches) {
            node.classList.remove('search-hidden');
            
            // If this is a child node, make sure its parent is expanded
            const parentTreeChildren = node.closest('.tree-children');
            if (parentTreeChildren) {
                parentTreeChildren.classList.remove('hidden');
                const parentHeader = parentTreeChildren.previousElementSibling;
                if (parentHeader && parentHeader.classList.contains('tree-header')) {
                    parentHeader.setAttribute('data-expanded', 'true');
                }
            }
        } else {
            // Only hide top-level nodes that don't match
            // Child nodes that don't match should still be visible if their parent matches
            if (!node.closest('.tree-children')) {
                node.classList.add('search-hidden');
            }
        }
        
        return nodeMatches;
    }
    
    /**
     * Highlights the matching text within an element
     * @param {HTMLElement} element - The element containing the text
     * @param {string} searchTerm - The search term to highlight
     */
    function highlightText(element, searchTerm) {
        const text = element.textContent;
        const lowerText = text.toLowerCase();
        
        // If the text doesn't contain the search term, do nothing
        if (!lowerText.includes(searchTerm)) {
            return;
        }
        
        // Create a new HTML content with highlighted search term
        let newHtml = '';
        let lastIndex = 0;
        
        // Find all occurrences of the search term
        let index = lowerText.indexOf(searchTerm);
        while (index !== -1) {
            // Add the text before the match
            newHtml += text.substring(lastIndex, index);
            
            // Add the highlighted match
            newHtml += `<span class="search-highlight">${text.substring(index, index + searchTerm.length)}</span>`;
            
            // Update the last index
            lastIndex = index + searchTerm.length;
            
            // Find the next occurrence
            index = lowerText.indexOf(searchTerm, lastIndex);
        }
        
        // Add any remaining text
        newHtml += text.substring(lastIndex);
        
        // Update the element's HTML
        element.innerHTML = newHtml;
    }
    
    /**
     * Removes highlighting from an element
     * @param {HTMLElement} element - The element to remove highlighting from
     */
    function removeHighlight(element) {
        // If the element has no children, it doesn't have highlights
        if (element.children.length === 0) {
            return;
        }
        
        // Get the original text content
        const text = element.textContent;
        
        // Reset the element's HTML to just the text
        element.textContent = text;
    }
    
    /**
     * Resets the search, showing all nodes and removing highlights
     */
    function resetSearch() {
        // Show all nodes
        treesContainers.forEach(treeContainer => {
            const treeNodes = treeContainer.querySelectorAll('.tree-node');
            treeNodes.forEach(node => {
                node.classList.remove('search-hidden');
            });
            
            // Remove all highlights
            const textElements = treeContainer.querySelectorAll('.tree-header > span, .tree-item-leaf > span');
            textElements.forEach(element => {
                removeHighlight(element);
            });
        });
    }
    
    // Add event listener for search button click
    searchButton.addEventListener('click', () => {
        const searchText = searchInput.value;
        searchTrees(searchText);
    });
    
    // Add event listener for Enter key in search input
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            const searchText = searchInput.value;
            searchTrees(searchText);
        } else if (event.key === 'Escape') {
            // Clear search on Escape key
            searchInput.value = '';
            resetSearch();
        }
    });
    
    // Add event listener for input changes (for live search)
    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value;
        if (searchText.trim() === '') {
            // If search input is cleared, reset the search
            resetSearch();
        }
        // Uncomment the following line for live search (as you type)
        // searchTrees(searchText);
    });
}

module.exports = { setupTreeSearch };