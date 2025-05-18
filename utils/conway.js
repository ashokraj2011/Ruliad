// utils/conway.js
// Conway's Game of Life implementation for dialog box decoration

/**
 * Creates a Game of Life canvas that can be attached to a dialog
 * @param {number} width - Width of the canvas
 * @param {number} height - Height of the canvas
 * @param {string} accent - Accent color for cells
 * @return {HTMLCanvasElement} Canvas element with the game
 */
function createGameOfLifeCanvas(width, height, accent = '#00acee') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.className = 'game-of-life';

  const ctx = canvas.getContext('2d');
  const cellSize = 10;
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);

  // Create grid with random seed
  let grid = Array(rows).fill().map(() =>
    Array(cols).fill().map(() => Math.random() > 0.85)
  );

  // Create next generation
  function nextGeneration() {
    const next = Array(rows).fill().map(() => Array(cols).fill(false));

    // Apply Game of Life rules
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Count live neighbors
        let neighbors = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const ni = (i + di + rows) % rows;
            const nj = (j + dj + cols) % cols;
            if (grid[ni][nj]) neighbors++;
          }
        }

        // Apply rules
        if (grid[i][j]) {
          // Cell is alive
          next[i][j] = (neighbors === 2 || neighbors === 3);
        } else {
          // Cell is dead
          next[i][j] = (neighbors === 3);
        }
      }
    }

    grid = next;
  }

  // Draw the grid
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = accent;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j]) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  }

  // Animation loop
  let animationId;
  function animate() {
    draw();
    nextGeneration();
    animationId = requestAnimationFrame(animate);
  }

  // Start animation
  animate();

  // Add method to stop animation
  canvas.stopAnimation = () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };

  return canvas;
}

/**
 * Attaches Game of Life to the left side of a dialog
 * @param {HTMLDialogElement} dialog - The dialog to attach to
 * @param {string} accentColor - Color for the cells
 */
function attachGameOfLifeToDialog(dialog, accentColor) {
  try {
    // Don't attach if dialog isn't visible/open
    if (!dialog || !dialog.open) {
      return;
    }

    // Use a safe fallback color if the provided one isn't valid
    if (!accentColor || accentColor.trim() === '') {
      accentColor = '#00acee';
    }

    // Create container for the game of life
    const container = document.createElement('div');
    container.className = 'dialog-game-container';

    // Get the dialog dimensions
    const width = 300; // Fixed width for the game
    const height = Math.min(window.innerHeight * 0.7, 600); // Limit height

    // Create the game canvas
    const gameCanvas = createGameOfLifeCanvas(width, height, accentColor);
    container.appendChild(gameCanvas);

    // Insert the game container before the dialog's form
    const form = dialog.querySelector('form');
    dialog.insertBefore(container, form);

    // Clean up animation when dialog closes
    const onClose = () => {
      gameCanvas.stopAnimation();
      dialog.removeEventListener('close', onClose);
    };
    dialog.addEventListener('close', onClose);
  } catch (error) {
    console.error('Error attaching Game of Life:', error);
    // Fail gracefully, don't break the application
  }
}

module.exports = { createGameOfLifeCanvas, attachGameOfLifeToDialog };
