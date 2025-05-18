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
