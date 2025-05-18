// utils/svg.js
// Exports SVG markup for animated icons

const atomSvgAnim = `
<svg class="atom-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Atom symbol -->
  <ellipse class="icon-stroke" cx="32" cy="32" rx="24" ry="12" stroke-width="2" fill="none" transform="rotate(60 32 32)"/>
  <ellipse class="icon-stroke" cx="32" cy="32" rx="24" ry="12" stroke-width="2" fill="none" transform="rotate(-60 32 32)"/>
  <ellipse class="icon-stroke" cx="32" cy="32" rx="24" ry="12" stroke-width="2" fill="none"/>
  <circle class="icon-fill" cx="32" cy="32" r="6"/>
</svg>`;

const ruleSvgAnim = `
<svg class="rule-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Document with code lines -->
  <path class="icon-fill" d="M44 4H20c-2.2 0-4 1.8-4 4v48c0 2.2 1.8 4 4 4h24c2.2 0 4-1.8 4-4V8c0-2.2-1.8-4-4-4z"/>
  <path class="icon-stroke" d="M24 16h16M24 24h12M24 32h16M24 40h8" stroke-width="2" stroke-linecap="round"/>
  <path class="icon-stroke" d="M44 4v12h12" stroke-width="2" fill="none"/>
  <path class="icon-fill" d="M44 4l12 12-12 0z"/>
</svg>`;

// New icon for API calls
const apiSvgAnim = `
<svg class="api-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- API/JSON icon with curly braces {} -->
  <rect class="icon-fill" x="8" y="12" width="48" height="40" rx="4" ry="4"/>
  <path class="icon-stroke" d="M24 22c-3 0-5 2-5 5s2 5 5 5c-3 0-5 2-5 5s2 5 5 5" stroke-width="3" stroke-linecap="round"/>
  <path class="icon-stroke" d="M40 22c3 0 5 2 5 5s-2 5-5 5c3 0 5 2 5 5s-2 5-5 5" stroke-width="3" stroke-linecap="round"/>
</svg>`;

// New icon for leaf nodes (individual items)
const leafSvgAnim = `
<svg class="leaf-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Document with data -->
  <path class="icon-fill" d="M40 4H16c-2.2 0-4 1.8-4 4v48c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16L40 4z"/>
  <path class="icon-stroke" d="M40 4v12h12" stroke-width="2" fill="none"/>
  <circle class="icon-stroke" cx="24" cy="32" r="4" stroke-width="2"/>
  <circle class="icon-stroke" cx="40" cy="32" r="4" stroke-width="2"/>
  <path class="icon-stroke" d="M24 40h16" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// New icon for folder (used for directories)
const folderSvgAnim = `
<svg class="folder-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Folder icon -->
  <path class="icon-fill" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z"/>
  <path class="icon-stroke" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z" stroke-width="2" fill="none"/>
</svg>`;

// New icon for closed folder
const closedFolderSvgAnim = `
<svg class="folder-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Closed Folder icon -->
  <path class="icon-fill" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z"/>
  <path class="icon-stroke" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z" stroke-width="2" fill="none"/>
</svg>`;

// New icon for open folder
const openFolderSvgAnim = `
<svg class="folder-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Open Folder icon -->
  <path class="icon-fill" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z"/>
  <path class="icon-fill" d="M4 20h56l-8 28H12z"/>
  <path class="icon-stroke" d="M8 12h16l4 4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4z" stroke-width="2" fill="none"/>
  <path class="icon-stroke" d="M4 20h56l-8 28H12z" stroke-width="2" fill="none"/>
</svg>`;

// New icon for file
const fileSvgAnim = `
<svg class="file-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- File icon -->
  <path class="icon-fill" d="M40 4H16c-2.2 0-4 1.8-4 4v48c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16L40 4z"/>
  <path class="icon-stroke" d="M40 4H16c-2.2 0-4 1.8-4 4v48c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16L40 4z" stroke-width="2" fill="none"/>
  <path class="icon-stroke" d="M40 4v12h12" stroke-width="2" fill="none"/>
  <path class="icon-stroke" d="M24 24h16M24 32h16M24 40h16" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// New icon for database/settings
const dbSvgAnim = `
<svg class="db-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Database icon -->
  <path class="icon-fill" d="M16 12h32v8c0 4.4-7.2 8-16 8s-16-3.6-16-8v-8z"/>
  <path class="icon-fill" d="M16 20v12c0 4.4 7.2 8 16 8s16-3.6 16-8V20"/>
  <path class="icon-fill" d="M16 32v12c0 4.4 7.2 8 16 8s16-3.6 16-8V32"/>
  <path class="icon-stroke" d="M16 12h32v8c0 4.4-7.2 8-16 8s-16-3.6-16-8v-8z" stroke-width="2" fill="none"/>
  <path class="icon-stroke" d="M16 20v12c0 4.4 7.2 8 16 8s16-3.6 16-8V20" stroke-width="2" fill="none"/>
  <path class="icon-stroke" d="M16 32v12c0 4.4 7.2 8 16 8s16-3.6 16-8V32" stroke-width="2" fill="none"/>
</svg>`;

module.exports = { 
  atomSvgAnim, 
  ruleSvgAnim,
  apiSvgAnim,
  leafSvgAnim,
  dbSvgAnim,
  folderSvgAnim,
  closedFolderSvgAnim,
  openFolderSvgAnim,
  fileSvgAnim
};
