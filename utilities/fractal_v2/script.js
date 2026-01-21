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

// Fragment shader: animated fractal (Mandelbrot/Julia morph), smooth coloring, shifting palette
const FS = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;          // in pixels; (-1,-1) if no mouse yet
  uniform float u_paletteShift;  // accumulates on clicks
  uniform float u_pauseTime;     // stop time when paused (so animation freezes cleanly)
  uniform float u_quality;       // quality hint (0.0..1.0)
  uniform float u_dpr;           // device pixel ratio (for subtle scale tweaks)

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
    // Guard against log of small numbers
    float mag2 = dot(z,z);
    return iter - log2(max(1e-8, log2(max(1.0000001, sqrt(mag2)))));
  }

  // Unified fractal that morphs between Mandelbrot and Julia via weight w [0..1]
  // point: complex plane coordinate
  // cJulia: Julia constant
  // Returns smooth iteration metric
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

      if (dot(zt, zt) > 256.0) { // escape radius 16
        i = float(it);
        esc = 1.0;
        break;
      }
    }

    if (esc < 0.5) {
      // did not escape; treat as interior
      return 0.0;
    }
    return smoothIter(zt, i + 1.0);
  }

  void main() {
    // Normalize pixel coordinates
    vec2 R = u_resolution;
    vec2 uv = (gl_FragCoord.xy - 0.5*R) / R.y;

    // Effective time that stops when paused
    float t = u_pauseTime;

    // Gently evolving zoom and rotation for motion that never ends
    float zoomCycle = 0.65 + 0.35*sin(t*0.15) + 0.15*sin(t*0.071 + 1.7);
    float scale = mix(1.2, 3.0, zoomCycle);   // 1.2..3.0
    float angle = 0.12*t + 0.1*sin(t*0.05);

    // Center wanders around Mandelbrot's "interesting" region
    vec2 center = vec2(-0.5, 0.0) + 0.35*vec2(cos(t*0.11), sin(t*0.087));

    // Slight dpr-based tweak to keep similar visual density across screens
    scale *= mix(1.0, 1.35, clamp((u_dpr-1.0)/2.0, 0.0, 1.0));

    // Complex plane coordinate with rotation and center offset
    vec2 p = rot(uv*scale, angle) + center;

    // Julia constant follows a Lissajous path; also influenced by pointer
    vec2 cJ = vec2(0.285 + 0.28*cos(t*0.27), 0.01 + 0.30*sin(t*0.21));
    // If mouse is present, blend in some control from it
    if (u_mouse.x >= 0.0) {
      vec2 m = (u_mouse - 0.5*R)/R.y; // normalized to same space as uv
      cJ = mix(cJ, 0.85*m, 0.45);
    }

    // Morph weight Mandelbrot<->Julia (0..1)
    float w = 0.5 + 0.5*sin(t*0.13);

    // Quality-adaptive max iterations
    // u_quality ~ 0.65..1 based on canvas size & device
    int maxIter = int(mix(100.0, 250.0, u_quality));

    // Compute smooth iteration metric
    float si = fractalUnified(p, cJ, w, maxIter);

    // Palette progression
    float baseT = 0.012*si;
    float palShift = u_paletteShift + 0.12*sin(t*0.07);

    // Multiple palette families blended for variety
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

    // Emphasize boundary glow; darker interior
    float glow = smoothstep(0.0, 12.0, si);
    col *= 0.1 + 0.9*glow;

    // Gentle vignette for focus
    float v = 1.0 - 0.18*dot(uv, uv);
    col *= clamp(v, 0.0, 1.0);

    // Gamma-ish
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

// Uniforms
const u_resolution = gl.getUniformLocation(program, 'u_resolution');
const u_time = gl.getUniformLocation(program, 'u_time');
const u_mouse = gl.getUniformLocation(program, 'u_mouse');
const u_paletteShift = gl.getUniformLocation(program, 'u_paletteShift');
const u_pauseTime = gl.getUniformLocation(program, 'u_pauseTime');
const u_quality = gl.getUniformLocation(program, 'u_quality');
const u_dpr = gl.getUniformLocation(program, 'u_dpr');

let dprCap = Math.min(window.devicePixelRatio || 1, 2.0); // cap for perf
let paletteShift = 0;
let isPaused = false;
let startTime = performance.now();
let pausedAt = 0;
let unpausedOffset = 0;

let mouse = { x: -1, y: -1, down: false };

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

// Mouse / touch
function setMouseFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
        const t = e.touches[0];
        mouse.x = (t.clientX - rect.left) * dprCap;
        mouse.y = (rect.height - (t.clientY - rect.top)) * dprCap;
    } else if ('clientX' in e) {
        mouse.x = (e.clientX - rect.left) * dprCap;
        mouse.y = (rect.height - (e.clientY - rect.top)) * dprCap;
    }
}
canvas.addEventListener('mousemove', e => { setMouseFromEvent(e); }, { passive: true });
canvas.addEventListener('touchmove', e => { setMouseFromEvent(e); }, { passive: true });
canvas.addEventListener('mousedown', e => { mouse.down = true; setMouseFromEvent(e); }, { passive: true });
canvas.addEventListener('touchstart', e => { mouse.down = true; setMouseFromEvent(e); }, { passive: true });
window.addEventListener('mouseup', () => { mouse.down = false; }, { passive: true });
window.addEventListener('touchend', () => { mouse.down = false; }, { passive: true });

// Click to shift palette
canvas.addEventListener('click', () => {
    paletteShift += 0.27; // arbitrary pleasing step
});

// Keyboard: Space to pause; S to save
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!isPaused) {
            isPaused = true;
            pausedAt = performance.now();
        } else {
            isPaused = false;
            const now = performance.now();
            // accumulate paused duration so animation time doesn't jump
            unpausedOffset += (now - pausedAt);
        }
    } else if (e.key === 's' || e.key === 'S') {
        // Save PNG
        const link = document.createElement('a');
        link.download = 'fractal-dream.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
});

// Quality estimator: prefer higher on smaller canvases
function estimateQuality() {
    const px = gl.drawingBufferWidth * gl.drawingBufferHeight;
    // Heuristic: 1080p ~ 2Mpx => quality ~ 0.85; scale down at higher resolutions
    const q = 1.05 - Math.log2(Math.max(1, px / (1280 * 720))); // ~0.7..1.1
    return Math.min(1.0, Math.max(0.65, q));
}

function draw() {
    const now = performance.now();
    const rawTime = (now - startTime) * 0.001;

    // When paused, freeze u_pauseTime
    const pauseTime = isPaused ? (pausedAt - startTime - unpausedOffset) * 0.001
        : (now - startTime - unpausedOffset) * 0.001;

    gl.useProgram(program);
    gl.uniform2f(u_resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u_time, rawTime);
    gl.uniform2f(u_mouse, mouse.x, mouse.y);
    gl.uniform1f(u_paletteShift, paletteShift);
    gl.uniform1f(u_pauseTime, pauseTime);
    gl.uniform1f(u_quality, estimateQuality());
    gl.uniform1f(u_dpr, dprCap);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
