// Rule-Engine Network Animation
// This script creates a network visualization with nodes and connecting edges
// with animated pulses traveling along the edges

// Initialize the canvas when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('network');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Set canvas to fullscreen
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Listen for window resize events
  window.addEventListener('resize', resize);

  // Listen for theme changes
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class' && 
          mutation.target === document.body) {
        console.log('Theme changed, redrawing animation');
        // No need to do anything special, the animation loop will use the updated theme
      }
    });
  });

  // Start observing the body for class changes (theme toggle)
  observer.observe(document.body, { attributes: true });

  // Initial resize
  resize();

  // --- Build a random network ---
  const N = 80;                // number of nodes - increased for denser network
  const nodes = [];
  const edges = [];

  // Create nodes with random positions & radii
  for (let i = 0; i < N; i++) {
    // Distribute nodes more evenly across the canvas
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 3 + Math.random() * 8,  // Slightly smaller nodes for cleaner look
      phase: Math.random() * Math.PI * 2   // for out-of-sync glow
    });
  }

  // Randomly connect pairs of nodes - increased connection probability for denser network
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      // Calculate distance between nodes
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Higher probability for closer nodes, with a minimum threshold
      const connectionProbability = Math.min(0.15, 200 / distance);

      if (Math.random() < connectionProbability) {
        edges.push({
          a: i,
          b: j,
          t: Math.random(),                    // pulse position [0..1]
          speed: 0.005 + Math.random() * 0.01  // Randomize pulse speed
        });
      }
    }
  }

  // --- Animation loop ---
  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if dark theme is active - moved outside loops for accessibility in both
    const isDarkTheme = document.body.classList.contains('dark-theme');

    // Draw all edges (light green)
    ctx.lineWidth = 1;
    edges.forEach(e => {
      const A = nodes[e.a], B = nodes[e.b];

      // Use theme-appropriate colors
      ctx.strokeStyle = isDarkTheme ? 'rgba(0,120,255,0.2)' : 'rgba(0,160,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.stroke();

      // Advance pulse using the edge's custom speed
      e.t += e.speed || 0.008; // Use custom speed if available, fallback to 0.008
      if (e.t > 1) e.t -= 1;

      // Compute pulse position
      const px = A.x + (B.x - A.x) * e.t;
      const py = A.y + (B.y - A.y) * e.t;

      // Draw the pulse with theme-appropriate color
      ctx.fillStyle = isDarkTheme ? 'rgba(0,160,255,0.8)' : 'rgba(0,200,0,0.8)';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI*2);
      ctx.fill();
    });

    // Draw nodes with pulsating glow - theme-appropriate colors
    nodes.forEach(n => {
      // Glow intensity oscillates over time
      const glow = 0.4 + 0.6 * Math.sin(n.phase + timestamp / 400);
      ctx.save();

      // Use theme-appropriate colors
      const nodeColor = isDarkTheme ? '#00acee' : '#9c27b0';
      const glowColor = isDarkTheme ? `rgba(0,172,238,${glow})` : `rgba(156,39,176,${glow})`;

      ctx.shadowColor = glowColor;
      ctx.shadowBlur  = 30 * glow;
      ctx.fillStyle  = nodeColor;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});
