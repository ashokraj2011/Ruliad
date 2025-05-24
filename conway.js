/**
 * Conway's Game of Life implementation
 * Rules:
 * 1. Any live cell with fewer than two live neighbors dies (underpopulation)
 * 2. Any live cell with two or three live neighbors lives on
 * 3. Any live cell with more than three live neighbors dies (overpopulation)
 * 4. Any dead cell with exactly three live neighbors becomes a live cell (reproduction)
 */
class ConwayGame {
  constructor(canvasId, options = {}) {
    // Get canvas and context
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Set default options
    this.options = {
      cellSize: options.cellSize || 10,
      updateInterval: options.updateInterval || 100,
      fillStyle: options.fillStyle || 'rgba(0, 102, 204, 0.8)', // Explicit blue color
      strokeStyle: options.strokeStyle || 'rgba(0, 77, 153, 0.5)', // Explicit darker blue
      backgroundColor: options.backgroundColor || 'rgba(240, 240, 240, 0.3)', // Light gray background
      initialDensity: options.initialDensity || 0.3,
      ...options
    };

    // Log options for debugging
    console.log('Conway Game options:', this.options);

    // Initialize game state
    this.isRunning = false;
    this.intervalId = null;

    // Resize canvas to fill container
    this.resizeCanvas();

    // Initialize grid
    this.initGrid();

    // Add event listeners
    window.addEventListener('resize', () => this.resizeCanvas());

    // Add click event to toggle cells
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

    // Note: We don't automatically start the game anymore
    // The simulation will be started explicitly by the user
  }

  resizeCanvas() {
    try {
      // Get the container dimensions
      const container = this.canvas.parentElement;

      // Log container dimensions for debugging
      console.log('Resizing canvas. Container dimensions:', 
        container.clientWidth, 'x', container.clientHeight);

      // Set minimum dimensions to ensure visibility
      const minWidth = 300;
      const minHeight = 200;

      // Set canvas dimensions, ensuring minimum size
      this.canvas.width = Math.max(container.clientWidth, minWidth);
      this.canvas.height = Math.max(container.clientHeight, minHeight);

      // Log the actual canvas dimensions
      console.log('Canvas dimensions set to:', this.canvas.width, 'x', this.canvas.height);

      // Recalculate grid dimensions
      this.cols = Math.floor(this.canvas.width / this.options.cellSize);
      this.rows = Math.floor(this.canvas.height / this.options.cellSize);

      // Ensure we have at least some cells
      if (this.cols < 5) this.cols = 5;
      if (this.rows < 5) this.rows = 5;

      console.log('Grid dimensions:', this.cols, 'x', this.rows, 
        'cells (cell size:', this.options.cellSize, 'px)');

      // Reinitialize grid if it exists
      if (this.grid) {
        this.initGrid();
      }

      // Force a redraw
      if (this.grid) {
        this.draw();
      }
    } catch (error) {
      console.error('Error resizing canvas:', error);
    }
  }

  initGrid() {
    // Create a 2D array for the grid
    this.grid = Array(this.rows).fill().map(() => 
      Array(this.cols).fill().map(() => 
        Math.random() < this.options.initialDensity ? 1 : 0
      )
    );

    // Draw initial state
    this.draw();
  }

  start() {
    if (!this.isRunning) {
      // Clear any existing interval just to be safe
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.isRunning = true;
      this.intervalId = setInterval(() => this.update(), this.options.updateInterval);
      console.log('Simulation started, interval ID:', this.intervalId);
    }
  }

  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.intervalId = null; // Set intervalId to null to ensure it's properly cleared
    }
  }

  reset() {
    this.stop();
    this.initGrid();
    this.start();
  }

  clearBoard() {
    // Stop the simulation first
    this.stop();
    console.log('Simulation stopped in clearBoard method');

    // Set all cells to 0 (dead)
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = 0;
      }
    }
    this.draw();
    console.log('Board cleared - all cells set to 0');

    // Double-check that isRunning is false and intervalId is null
    if (this.isRunning) {
      console.log('Warning: isRunning is still true after clearBoard, forcing to false');
      this.isRunning = false;
    }

    if (this.intervalId) {
      console.log('Warning: intervalId is still set after clearBoard, clearing it');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  update() {
    // Create a new grid for the next generation
    const nextGrid = Array(this.rows).fill().map(() => Array(this.cols).fill(0));

    // Apply Conway's rules to each cell
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const neighbors = this.countNeighbors(x, y);
        const cell = this.grid[y][x];

        // Apply Conway's rules
        if (cell === 1) {
          // Rule 1 & 3: Live cell with < 2 or > 3 neighbors dies
          if (neighbors < 2 || neighbors > 3) {
            nextGrid[y][x] = 0;
          } 
          // Rule 2: Live cell with 2 or 3 neighbors lives
          else {
            nextGrid[y][x] = 1;
          }
        } else {
          // Rule 4: Dead cell with exactly 3 neighbors becomes alive
          if (neighbors === 3) {
            nextGrid[y][x] = 1;
          }
        }
      }
    }

    // Update grid and draw
    this.grid = nextGrid;
    this.draw();
  }

  countNeighbors(x, y) {
    let count = 0;

    // Check all 8 neighboring cells
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        // Skip the cell itself
        if (dx === 0 && dy === 0) continue;

        // Calculate neighbor coordinates with wrapping
        const nx = (x + dx + this.cols) % this.cols;
        const ny = (y + dy + this.rows) % this.rows;

        // Count live neighbors
        count += this.grid[ny][nx];
      }
    }

    return count;
  }

  draw() {
    // Log drawing activity occasionally
    if (Math.random() < 0.01) {
      console.log('Drawing Conway grid:', 
        this.rows, 'rows x', this.cols, 'cols, canvas size:', 
        this.canvas.width, 'x', this.canvas.height);
    }

    // Clear canvas
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Set cell styles
    this.ctx.strokeStyle = this.options.strokeStyle;
    this.ctx.fillStyle = this.options.fillStyle;

    // Count live cells for debugging
    let liveCells = 0;

    // Draw cells
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 1) {
          liveCells++;
          const cellX = x * this.options.cellSize;
          const cellY = y * this.options.cellSize;

          // Fill cell
          this.ctx.fillRect(
            cellX, 
            cellY, 
            this.options.cellSize, 
            this.options.cellSize
          );

          // Stroke cell
          this.ctx.strokeRect(
            cellX, 
            cellY, 
            this.options.cellSize, 
            this.options.cellSize
          );
        }
      }
    }

    // Log live cell count occasionally
    if (Math.random() < 0.01) {
      console.log('Conway live cells:', liveCells, 'of', this.rows * this.cols, 'total cells');
    }
  }

  handleCanvasClick(e) {
    // Get mouse position relative to canvas
    const rect = this.canvas.getBoundingClientRect();

    // Calculate the scaling factors in case the canvas is scaled
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    // Apply scaling to get the correct position within the canvas
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Convert to grid coordinates
    const x = Math.floor(canvasX / this.options.cellSize);
    const y = Math.floor(canvasY / this.options.cellSize);

    // Toggle cell state if within bounds
    if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
      // Store the current running state
      const wasRunning = this.isRunning;

      // Pause the simulation temporarily to ensure the toggle is visible
      if (wasRunning) {
        this.stop();
      }

      // Toggle the cell state
      this.grid[y][x] = this.grid[y][x] ? 0 : 1;

      // Redraw the grid
      this.draw();

      // Resume the simulation if it was running before
      if (wasRunning) {
        this.start();
      }

      console.log(`Toggled cell at (${x}, ${y}) to ${this.grid[y][x]}`);
    }
  }
}

// Function to initialize Conway's Game of Life
function initConway(canvasId, options = {}) {
  // Add RGB variables for colors to use in rgba()
  document.documentElement.style.setProperty('--accent-primary-rgb', '0, 102, 204'); // Blue in RGB
  document.documentElement.style.setProperty('--accent-secondary-rgb', '0, 77, 153'); // Darker blue in RGB
  document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255'); // White in RGB

  // Update RGB values when theme changes
  const updateRgbValues = () => {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    if (isDarkTheme) {
      document.documentElement.style.setProperty('--accent-primary-rgb', '51, 153, 255'); // Brighter blue for dark mode
      document.documentElement.style.setProperty('--accent-secondary-rgb', '102, 179, 255'); // Lighter blue for dark mode
      document.documentElement.style.setProperty('--bg-primary-rgb', '18, 18, 18'); // Dark background in RGB
    } else {
      document.documentElement.style.setProperty('--accent-primary-rgb', '0, 102, 204'); // Blue in RGB
      document.documentElement.style.setProperty('--accent-secondary-rgb', '0, 77, 153'); // Darker blue in RGB
      document.documentElement.style.setProperty('--bg-primary-rgb', '255, 255, 255'); // White in RGB
    }
  };

  // Call initially
  updateRgbValues();

  // Listen for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        updateRgbValues();
      }
    });
  });

  observer.observe(document.body, { attributes: true });

  // Create and return the game instance
  return new ConwayGame(canvasId, options);
}
