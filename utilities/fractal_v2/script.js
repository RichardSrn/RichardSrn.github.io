// Utility: Compile shader and create program
function createShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error: ' + info);
  }
  return sh;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const pr = gl.createProgram();
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(pr);
    gl.deleteProgram(pr);
    throw new Error('Program link error: ' + info);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return pr;
}

const canvas = document.getElementById('gl');
// Try WebGL1 for broader compatibility
const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
if (!gl) {
  alert('WebGL not supported on this device/browser.');
  throw new Error('No WebGL');
}

// Vertex shader (full-screen triangle)
const VS = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

// Fragment shader: animated fractal
// Updated to accept explicit zoom check center, rotation from JS
const FS = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;          
  uniform float u_paletteShift;  
  uniform float u_quality;       
  uniform float u_dpr;           
  
  // New Uniforms for manual control
  uniform float u_zoom;
  uniform vec2 u_center;
  uniform float u_rotation;

  // Rotate a 2D vector
  vec2 rot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return mat2(c,-s,s,c)*p;
  }

  // Inigo Quilez style palette
  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(6.2831853*(c*t + d));
  }

  // Smooth iteration count
  float smoothIter(vec2 z, float iter) {
    float mag2 = dot(z,z);
    return iter - log2(max(1e-8, log2(max(1.0000001, sqrt(mag2)))));
  }

  // Unified fractal
  float fractalUnified(vec2 point, vec2 cJulia, float w, int maxIter) {
    vec2 z = mix(vec2(0.0), point, w);
    vec2 c = mix(point, cJulia, w);

    float i;
    vec2 zt = z;
    float esc = 0.0;
    for (int it = 0; it < 1000; it++) {
      if (it >= maxIter) break;

      // z = z^2 + c
      zt = vec2(zt.x*zt.x - zt.y*zt.y, 2.0*zt.x*zt.y) + c;

      if (dot(zt, zt) > 256.0) { 
        i = float(it);
        esc = 1.0;
        break;
      }
    }

    if (esc < 0.5) return 0.0;
    return smoothIter(zt, i + 1.0);
  }

  void main() {
    // Normalize pixel coordinates
    vec2 R = u_resolution;
    vec2 uv = (gl_FragCoord.xy - 0.5*R) / R.y;

    // Use current time for animation phases
    float t = u_time;

    // Motion controlled by JS uniforms now
    float scale = u_zoom;
    
    // Slight dpr-based tweak
    scale *= mix(1.0, 1.35, clamp((u_dpr-1.0)/2.0, 0.0, 1.0));

    // Apply Rotation & Center (Pan)
    vec2 p = rot(uv*scale, u_rotation) + u_center;

    // Julia constant animation
    vec2 cJ = vec2(0.285 + 0.28*cos(t*0.27), 0.01 + 0.30*sin(t*0.21));
    
    // Mouse influence
    if (u_mouse.x >= 0.0) {
      vec2 m = (u_mouse - 0.5*R)/R.y; 
      cJ = mix(cJ, 0.85*m, 0.45);
    }

    // Morph weight
    float w = 0.5 + 0.5*sin(t*0.13);

    // Quality-adaptive max iterations
    int maxIter = int(mix(100.0, 400.0, u_quality));

    float si = fractalUnified(p, cJ, w, maxIter);

    // Palette
    float baseT = 0.012*si;
    float palShift = u_paletteShift + 0.12*sin(t*0.07);

    vec3 colA = palette(baseT + palShift,
                        vec3(0.50, 0.50, 0.50),
                        vec3(0.50, 0.50, 0.50),
                        vec3(1.00, 0.77, 0.50),
                        vec3(0.00, 0.33, 0.67));

    vec3 colB = palette(baseT*1.15 + palShift*1.2,
                        vec3(0.50, 0.50, 0.50),
                        vec3(0.50, 0.40, 0.60),
                        vec3(0.80, 0.90, 0.60),
                        vec3(0.15, 0.10, 0.20));

    float mixAB = 0.5 + 0.5*sin(t*0.09 + 1.4);
    vec3 col = mix(colA, colB, mixAB);

    float glow = smoothstep(0.0, 12.0, si);
    col *= 0.1 + 0.9*glow;

    float v = 1.0 - 0.18*dot(uv, uv);
    col *= clamp(v, 0.0, 1.0);

    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col, 1.0);
  }
`;

const program = createProgram(gl, VS, FS);

// Full-screen triangle
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
const verts = new Float32Array([
  -1, -1,
  3, -1,
  -1, 3
]);
gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

const loc_a_pos = gl.getAttribLocation(program, 'a_pos');
gl.enableVertexAttribArray(loc_a_pos);
gl.vertexAttribPointer(loc_a_pos, 2, gl.FLOAT, false, 0, 0);

// Uniform Locations
const u_resolution = gl.getUniformLocation(program, 'u_resolution');
const u_time = gl.getUniformLocation(program, 'u_time');
const u_mouse = gl.getUniformLocation(program, 'u_mouse');
const u_paletteShift = gl.getUniformLocation(program, 'u_paletteShift');
const u_quality = gl.getUniformLocation(program, 'u_quality');
const u_dpr = gl.getUniformLocation(program, 'u_dpr');

const u_zoom = gl.getUniformLocation(program, 'u_zoom');
const u_center = gl.getUniformLocation(program, 'u_center');
const u_rotation = gl.getUniformLocation(program, 'u_rotation');

// State Variables
let dprCap = Math.min(window.devicePixelRatio || 1, 2.0);
let paletteShift = 0;

// Motion State
let currentZoom = 3.5;
let rotationAngle = 0.0;
let centerPos = { x: -0.5, y: 0.0 };
let speedMultiplier = 1.0;
let isAutoRotating = false;
let isPaused = false;
let isMouseInfluenced = false; // Toggle for pointer influence
let accumulatedTime = Math.random() * 10000; // Random start logic preserved

// Constants
const ZOOM_SENSITIVITY = 0.001;
const PAN_SENSITIVITY = 0.002;

let lastTime = performance.now();
let mouse = { x: -1, y: -1, down: false };
let isDragging = false;
let lastDragPos = { x: 0, y: 0 };

function resize() {
  dprCap = Math.min(window.devicePixelRatio || 1, 2.0);
  const w = Math.floor(innerWidth * dprCap);
  const h = Math.floor(innerHeight * dprCap);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener('resize', resize, { passive: true });
resize();

// UI Elements
const speedInput = document.getElementById('speedRaw');
const speedVal = document.getElementById('speedVal');
const zoomInput = document.getElementById('zoomRaw');
const zoomVal = document.getElementById('zoomVal');
const autoRotateCheck = document.getElementById('autoRotate');
const showEqCheck = document.getElementById('showEq');
const shiftPaletteBtn = document.getElementById('shiftPaletteBtn');
const resetBtn = document.getElementById('resetBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const controlPanel = document.getElementById('controlPanel');
const toggleControlsBtn = document.getElementById('toggleControlsBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const equationDisplay = document.getElementById('equationDisplay');
const mouseInfluenceCheck = document.getElementById('mouseInfluence');

// UI Logic
function updateSpeed() {
  // Map 0-200 slider to 0.0 - 5.0
  const raw = parseInt(speedInput.value, 10);
  speedMultiplier = raw / 40.0; // 40 -> 1x
  speedVal.textContent = speedMultiplier.toFixed(1) + 'x';
}

function updateZoomFromSlider() {
  // Logarithmic slider for better feel
  const raw = parseInt(zoomInput.value, 10);
  // Map 0-1000 -> 0.1 to 5.0
  currentZoom = 0.1 + (raw / 200.0);
  zoomVal.textContent = currentZoom.toFixed(2);
}

function updateSliderFromZoom() {
  zoomInput.value = Math.max(0, Math.min(1000, (currentZoom - 0.1) * 200.0));
  zoomVal.textContent = currentZoom.toFixed(2);
}

// Listeners
speedInput.addEventListener('input', updateSpeed);
zoomInput.addEventListener('input', updateZoomFromSlider);

autoRotateCheck.addEventListener('change', (e) => {
  isAutoRotating = e.target.checked;
});

showEqCheck.addEventListener('change', (e) => {
  if (e.target.checked) equationDisplay.classList.add('mb-visible');
  else equationDisplay.classList.remove('mb-visible');
});

mouseInfluenceCheck.addEventListener('change', (e) => {
  isMouseInfluenced = e.target.checked;
});

shiftPaletteBtn.addEventListener('click', () => {
  paletteShift += 0.27;
});

resetBtn.addEventListener('click', () => {
  currentZoom = 1.5;
  centerPos = { x: -0.5, y: 0.0 };
  rotationAngle = 0.0;
  speedInput.value = 40;
  updateSpeed();
  updateSliderFromZoom();
  // Re-randomize time for variety
  accumulatedTime = Math.random() * 10000;
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

toggleControlsBtn.addEventListener('click', () => {
  controlPanel.classList.toggle('visible');
});

closePanelBtn.addEventListener('click', () => {
  controlPanel.classList.remove('visible');
});

// Canvas Interaction (Pan & Zoom)
canvas.addEventListener('mousedown', e => {
  isDragging = true;
  lastDragPos = { x: e.clientX, y: e.clientY };
  mouse.x = (e.clientX - canvas.getBoundingClientRect().left) * dprCap;
  mouse.y = (canvas.getBoundingClientRect().height - (e.clientY - canvas.getBoundingClientRect().top)) * dprCap;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('mousemove', e => {
  if (isDragging) {
    const dx = e.clientX - lastDragPos.x;
    const dy = e.clientY - lastDragPos.y;

    // Panning logic (rotated by current angle to make sense visually)
    // We need to move 'center' in the opposite direction of drag
    // scaled by zoom level.
    const cosA = Math.cos(-rotationAngle);
    const sinA = Math.sin(-rotationAngle);

    // Adjust for aspect ratio? Coordinate logic implies y is normalized.
    // Simplified Pan:
    const moveScale = currentZoom / (window.innerHeight * 0.5); // Heuristic

    // Rotate the drag vector so it aligns with the view
    const rx = dx * cosA - dy * sinA;
    const ry = dx * sinA + dy * cosA;

    centerPos.x -= rx * moveScale;
    centerPos.y += ry * moveScale;

    lastDragPos = { x: e.clientX, y: e.clientY };
  }

  // Update shader mouse
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * dprCap;
  mouse.y = (rect.height - (e.clientY - rect.top)) * dprCap;
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const zoomFactor = Math.exp(e.deltaY * ZOOM_SENSITIVITY);
  currentZoom *= zoomFactor;
  // Clamp zoom
  currentZoom = Math.max(0.0001, Math.min(100.0, currentZoom));
  updateSliderFromZoom();
}, { passive: false });


// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    isPaused = !isPaused;
  } else if (e.key === 's' || e.key === 'S') {
    const link = document.createElement('a');
    link.download = 'fractal-dream.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
});

function estimateQuality() {
  const px = gl.drawingBufferWidth * gl.drawingBufferHeight;
  const q = 1.05 - Math.log2(Math.max(1, px / (1280 * 720)));
  return Math.min(1.0, Math.max(0.65, q));
}

function draw() {
  const now = performance.now();
  const dt = (now - lastTime) * 0.001; // seconds
  lastTime = now;

  if (!isPaused) {
    accumulatedTime += dt * speedMultiplier;
    if (isAutoRotating) {
      rotationAngle += (0.12 + 0.05 * Math.sin(accumulatedTime * 0.05)) * dt * speedMultiplier;
    }
  }

  gl.useProgram(program);
  gl.uniform2f(u_resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(u_time, accumulatedTime);

  // Conditionally send mouse coordinates
  if (isMouseInfluenced) {
    gl.uniform2f(u_mouse, mouse.x, mouse.y);
  } else {
    gl.uniform2f(u_mouse, -1.0, -1.0);
  }

  gl.uniform1f(u_paletteShift, paletteShift);
  gl.uniform1f(u_quality, estimateQuality());
  gl.uniform1f(u_dpr, dprCap);

  gl.uniform1f(u_zoom, currentZoom);
  gl.uniform2f(u_center, centerPos.x, centerPos.y);
  gl.uniform1f(u_rotation, rotationAngle);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(draw);
}

// Initial update
updateSpeed();
updateSliderFromZoom();
requestAnimationFrame(draw);
