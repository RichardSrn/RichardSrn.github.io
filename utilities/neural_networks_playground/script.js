/* ============================================================
 * Neural Networks Playground — script.js
 *
 * Demonstrates how different neural network architectures learn
 * a simple 3D vector permutation [a,b,c] → [c,a,b].
 *
 * Architecture:
 *   DataGenerator ─→ Model ─→ Trainer ─→ Visualizations
 *                         ↑
 *                    UIController
 *
 * TF.js memory: tensors from nextBatch() and trainOnBatch()
 * are manually disposed. model.getWeights() returns internal
 * refs — never dispose these, only call dataSync() on them.
 * ============================================================ */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // 0. Dependency check
  // ═══════════════════════════════════════════════════════════

  if (typeof tf === 'undefined') {
    document.body.innerHTML =
      '<div style="padding:40px;color:#f85149;font-family:sans-serif;">' +
      '<h2>TensorFlow.js failed to load.</h2>' +
      '<p>Please check your internet connection and reload.</p></div>';
    return;
  }
  if (typeof d3 === 'undefined') {
    document.body.innerHTML =
      '<div style="padding:40px;color:#f85149;font-family:sans-serif;">' +
      '<h2>D3.js failed to load.</h2>' +
      '<p>Please check your internet connection and reload.</p></div>';
    return;
  }

  // ═══════════════════════════════════════════════════════════
  // 1. DOM References
  // ═══════════════════════════════════════════════════════════

  const $ = (sel) => document.querySelector(sel);

  const els = {
    archLinear: $('#arch-linear'),
    archMLP: $('#arch-mlp'),
    groupHidden: $('#group-hidden'),
    hiddenSlider: $('#hidden-slider'),
    hiddenValue: $('#hidden-value'),
    lrSlider: $('#lr-slider'),
    lrValue: $('#lr-value'),
    optimizerSelect: $('#optimizer-select'),
    regRadios: document.getElementsByName('reg'),
    groupLambda: $('#group-lambda'),
    lambdaSlider: $('#lambda-slider'),
    lambdaValue: $('#lambda-value'),
    batchSlider: $('#batch-slider'),
    batchValue: $('#batch-value'),
    speedSlider: $('#speed-slider'),
    speedValue: $('#speed-value'),
    btnPlay: $('#btn-play'),
    btnPause: $('#btn-pause'),
    btnStep: $('#btn-step'),
    btnReset: $('#btn-reset'),
    stepDisplay: $('#step-display'),
    lossDisplay: $('#loss-display'),
    refToggle: $('#ref-toggle'),
  };

  // ═══════════════════════════════════════════════════════════
  // 2. Configuration State
  // ═══════════════════════════════════════════════════════════

  const config = {
    architecture: 'linear',
    hiddenSize: 8,
    learningRate: 0.01,
    optimizerType: 'adam',
    regularization: 'none',
    regLambda: 0.001,
    batchSize: 128,
    stepsPerSecond: 20,
  };

  // ═══════════════════════════════════════════════════════════
  // 3. Runtime State
  // ═══════════════════════════════════════════════════════════

  let model = null;
  let running = false;
  let stepCount = 0;
  let lossHistory = []; // array of numbers (MSE values per step)
  let timeoutId = null;
  let lastVizUpdate = 0;
  const VIZ_THROTTLE_MS = 40; // ~25 fps max for visualizations

  // ═══════════════════════════════════════════════════════════
  // 4. Helper: slider ↔ exponential value mapping
  // ═══════════════════════════════════════════════════════════

  /** Map a linear slider [0,100] to an exponential range [min, max] */
  function expMap(sliderVal, min, max) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logVal = logMin + (sliderVal / 100) * (logMax - logMin);
    return Math.pow(10, logVal);
  }

  /** Inverse of expMap: value → slider position [0,100] */
  function invExpMap(value, min, max) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const logVal = Math.log10(value);
    return ((logVal - logMin) / (logMax - logMin)) * 100;
  }

  // ═══════════════════════════════════════════════════════════
  // 5. Data Generator
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate a batch of random 3D vectors and their permutation targets.
   * Returns { xs, ys } as tf.Tensor2D: [batchSize, 3] each.
   * Caller is responsible for disposing xs and ys.
   */
  function nextBatch(batchSize) {
    const xs = tf.randomNormal([batchSize, 3]);
    const ys = tf.tidy(() => {
      const c = xs.slice([0, 2], [batchSize, 1]); // col 2 → outputs[0]
      const a = xs.slice([0, 0], [batchSize, 1]); // col 0 → outputs[1]
      const b = xs.slice([0, 1], [batchSize, 1]); // col 1 → outputs[2]
      return tf.concat([c, a, b], 1);
    });
    return { xs, ys };
  }

  // ═══════════════════════════════════════════════════════════
  // 6. Model Factory
  // ═══════════════════════════════════════════════════════════

  /** Build the L1/L2 regularizer based on config, or return null */
  function getRegularizer() {
    if (config.regularization === 'l1') {
      return tf.regularizers.l1({ l1: config.regLambda });
    }
    if (config.regularization === 'l2') {
      return tf.regularizers.l2({ l2: config.regLambda });
    }
    return null;
  }

  /** Dispose the current model if it exists */
  function disposeModel() {
    if (model) {
      model.dispose();
      model = null;
    }
  }

  /** Build a fresh tf.Sequential model from the current config */
  function buildModel() {
    disposeModel();

    const regularizer = getRegularizer();
    model = tf.sequential();

    if (config.architecture === 'linear') {
      model.add(
        tf.layers.dense({
          units: 3,
          inputShape: [3],
          kernelRegularizer: regularizer,
        })
      );
    } else {
      model.add(
        tf.layers.dense({
          units: config.hiddenSize,
          inputShape: [3],
          activation: 'relu',
          kernelRegularizer: regularizer,
        })
      );
      model.add(
        tf.layers.dense({
          units: 3,
          kernelRegularizer: regularizer,
        })
      );
    }

    const optimizer =
      config.optimizerType === 'adam'
        ? tf.train.adam(config.learningRate)
        : tf.train.sgd(config.learningRate);

    model.compile({ optimizer, loss: 'meanSquaredError' });
  }

  /**
   * Extract kernel weight matrices from the model as Float32Arrays.
   * Returns an array of { data, rows, cols, label }.
   * Does NOT dispose any tensors (model.getWeights() returns internal refs).
   */
  function extractKernels(weightTensors) {
    if (!weightTensors) return [];

    if (config.architecture === 'linear') {
      const w = weightTensors[0].dataSync();
      return [{ data: w, rows: 3, cols: 3, label: 'W (3→3)' }];
    } else {
      const w1 = weightTensors[0].dataSync();
      const w2 = weightTensors[2].dataSync();
      return [
        { data: w1, rows: 3, cols: config.hiddenSize, label: `W₁ (3→${config.hiddenSize})` },
        { data: w2, rows: config.hiddenSize, cols: 3, label: `W₂ (${config.hiddenSize}→3)` },
      ];
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 7. Training Loop
  // ═══════════════════════════════════════════════════════════

  /** Execute a single training step. Returns the scalar MSE loss. */
  async function trainStep() {
    const { xs, ys } = nextBatch(config.batchSize);

    // model.trainOnBatch() returns Promise<number> in TF.js 4.x
    const loss = await model.trainOnBatch(xs, ys);

    tf.dispose([xs, ys]);

    return loss;
  }

  /** The recursive training loop, gated by `running` and throttled by stepsPerSecond */
  function scheduleLoop() {
    if (!running) return;

    const delay = Math.max(10, Math.round(1000 / config.stepsPerSecond));
    timeoutId = setTimeout(trainIteration, delay);
  }

  function trainIteration() {
    if (!running) return;

    let loss;
    try {
      loss = trainStep(); // returns Promise<number>, but we handle it below
    } catch (err) {
      console.error('Training step failed:', err);
      stopTraining();
      return;
    }

    // trainStep returns a Promise — resolve it
    Promise.resolve(loss).then((value) => {
      if (!running) return; // may have been paused while awaiting

      stepCount++;
      lossHistory.push(value);

      // Keep history bounded to avoid unbounded memory growth
      if (lossHistory.length > 10000) {
        lossHistory = lossHistory.slice(-2000);
      }

      // Update UI counters every step (cheap DOM updates)
      els.stepDisplay.textContent = stepCount.toLocaleString();
      els.lossDisplay.textContent = value.toFixed(4);

      // Throttle heavy visualization updates
      const now = performance.now();
      if (now - lastVizUpdate >= VIZ_THROTTLE_MS) {
        updateAllVisualizations();
        lastVizUpdate = now;
      }

      scheduleLoop();
    }).catch((err) => {
      console.error('Training step failed:', err);
      stopTraining();
    });
  }

  function startTraining() {
    if (!model) buildModel();
    if (running) return;
    running = true;
    lastVizUpdate = 0;
    scheduleLoop();
    updateButtonStates();
  }

  function stopTraining() {
    running = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Flush remaining visualization updates
    updateAllVisualizations();
    updateButtonStates();
  }

  function resetState() {
    stopTraining();
    disposeModel();
    stepCount = 0;
    lossHistory = [];
    els.stepDisplay.textContent = '0';
    els.lossDisplay.textContent = '—';
    clearAllVisualizations();
    updateButtonStates();
  }

  function hardReset() {
    stopTraining();
    disposeModel();
    stepCount = 0;
    lossHistory = [];
    els.stepDisplay.textContent = '0';
    els.lossDisplay.textContent = '—';
    buildModel();
    clearAllVisualizations();
    // Draw initial (random) weights
    updateAllVisualizations();
    updateButtonStates();
  }

  function updateButtonStates() {
    els.btnPlay.disabled = running;
    els.btnPause.disabled = !running;
    els.btnStep.disabled = running;
  }

  // ═══════════════════════════════════════════════════════════
  // 8. Visualization Classes
  // ═══════════════════════════════════════════════════════════

  // ── 8a. HeatmapViz ────────────────────────────────────────

  class HeatmapViz {
    constructor(svgId) {
      this.svg = d3.select(`#${svgId}`);
      this.margin = { top: 10, right: 30, bottom: 10, left: 30 };
      this.gapBetween = 40;
    }

    /**
     * @param {Array} matrices - from extractKernels()
     * @param {boolean} showReference - toggle ground-truth overlay
     */
    update(matrices, showReference) {
      if (!matrices.length) return;

      const containerNode = this.svg.node();
      if (!containerNode) return;
      const container = containerNode.parentNode;
      if (!container) return;

      const fullW = container.clientWidth || 600;
      const fullH = container.clientHeight || 260;

      this.svg.selectAll('*').remove();
      this.svg
        .attr('width', fullW)
        .attr('height', fullH)
        .attr('viewBox', `0 0 ${fullW} ${fullH}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const numMatrices = matrices.length;
      const totalGap = (numMatrices - 1) * this.gapBetween;
      const availW = fullW - this.margin.left - this.margin.right - totalGap;
      const panelW = availW / numMatrices;
      const availH = fullH - this.margin.top - this.margin.bottom;

      matrices.forEach((m, idx) => {
        const xOffset =
          this.margin.left + idx * (panelW + this.gapBetween);
        this._drawMatrix(m, xOffset, this.margin.top, panelW, availH, showReference);
      });
    }

    _drawMatrix(mat, x0, y0, availW, availH, showReference) {
      const { data, rows, cols, label } = mat;

      // Compute cell size: fit within available space
      const cellSize = Math.min(
        Math.floor(availW / (cols + 1)), // +1 for row labels
        Math.floor(availH / (rows + 1)), // +1 for col labels
        70 // max cell size
      );
      const rowLabelWidth = 28;
      const colLabelHeight = 20;
      const gridX = x0 + rowLabelWidth;
      const gridY = y0 + colLabelHeight;
      const gridW = cellSize * cols;
      const gridH = cellSize * rows;

      // Color scale: diverging blue–white–red
      let maxAbs = 1;
      for (let i = 0; i < data.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(data[i]));
      }
      const colorScale = d3
        .scaleDiverging()
        .domain([-maxAbs, 0, maxAbs])
        .interpolator((t) => d3.interpolateRdBu(1 - t))
        .clamp(true);

      // Title
      this.svg
        .append('text')
        .attr('x', x0 + rowLabelWidth + gridW / 2)
        .attr('y', y0 + 12)
        .attr('class', 'chart-title')
        .attr('text-anchor', 'middle')
        .text(label);

      // Draw cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = data[r * cols + c];
          const cx = gridX + c * cellSize;
          const cy = gridY + r * cellSize;

          this.svg
            .append('rect')
            .attr('x', cx)
            .attr('y', cy)
            .attr('width', cellSize)
            .attr('height', cellSize)
            .attr('fill', colorScale(val))
            .attr('rx', 2)
            .attr('class', 'heatmap-cell');

          // Weight value text
          const textColor =
            maxAbs > 0.5 && Math.abs(val) > 0.4 * maxAbs ? '#fff' : '#1a1a2e';
          this.svg
            .append('text')
            .attr('x', cx + cellSize / 2)
            .attr('y', cy + cellSize / 2)
            .attr('class', 'heatmap-label')
            .attr('fill', textColor)
            .style('font-size', Math.max(9, Math.min(12, cellSize / 4.5)) + 'px')
            .text(val.toFixed(2));
        }
      }

      // Row labels (input dimension)
      for (let r = 0; r < rows; r++) {
        this.svg
          .append('text')
          .attr('x', x0 + rowLabelWidth - 4)
          .attr('y', gridY + r * cellSize + cellSize / 2)
          .attr('class', 'heatmap-axis-label')
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .text(rows <= 5 ? `x${r}` : `${r}`);
      }

      // Column labels (output dimension)
      for (let c = 0; c < cols; c++) {
        this.svg
          .append('text')
          .attr('x', gridX + c * cellSize + cellSize / 2)
          .attr('y', y0 + colLabelHeight - 5)
          .attr('class', 'heatmap-axis-label')
          .attr('text-anchor', 'middle')
          .text(cols <= 5 ? `y${c}` : `${c}`);
      }

      // Column label header
      this.svg
        .append('text')
        .attr('x', x0 + rowLabelWidth + gridW / 2)
        .attr('y', y0 + 24)
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .text('Output');

      // Row label header
      this.svg
        .append('text')
        .attr('x', x0 - 2)
        .attr('y', gridY + gridH / 2)
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', `rotate(-90, ${x0 - 2}, ${gridY + gridH / 2})`)
        .text('Input');

      // Reference overlay: highlight cells of the target permutation matrix
      // Only applicable for a 3×3 kernel (single-layer linear model)
      if (showReference && rows === 3 && cols === 3) {
        // Target permutation matrix [ [0,1,0], [0,0,1], [1,0,0] ]
        // Cells at (r=0,c=1), (r=1,c=2), (r=2,c=0)
        const targetCells = [
          [0, 1],
          [1, 2],
          [2, 0],
        ];

        targetCells.forEach(([r, c]) => {
          const cx = gridX + c * cellSize;
          const cy = gridY + r * cellSize;
          this.svg
            .append('rect')
            .attr('x', cx + 1)
            .attr('y', cy + 1)
            .attr('width', cellSize - 2)
            .attr('height', cellSize - 2)
            .attr('class', 'reference-overlay');
        });
      }
    }
  }

  // ── 8b. NodeLinkViz ───────────────────────────────────────

  class NodeLinkViz {
    constructor(svgId) {
      this.svg = d3.select(`#${svgId}`);
      this.padding = { top: 30, right: 60, bottom: 30, left: 70 };
      this.inputValues = [0, 1, 2]; // editable: x₀, x₁, x₂
      this.overlayCreated = false;
      this.overlayDiv = null;
      this.inputFields = []; // HTML <input> elements for x₀,x₁,x₂
      this.lastWeights = null;
      this.lastArchitecture = null;
      this.lastHiddenSize = 0;
      // References to SVG output labels (for in-place updates on input change)
      this.yhatLabels = [];
      this.yLabels = [];
    }

    /**
     * Compute a forward pass through the network using raw weight tensors.
     * Returns [y0, y1, y2] — the predicted output for the given input.
     */
    _computeForwardPass(input, architecture, hiddenSize, weightTensors) {
      if (architecture === 'linear') {
        const W = weightTensors[0].dataSync(); // [3, 3]
        const b = weightTensors[1].dataSync(); // [3]
        const out = [0, 0, 0];
        for (let j = 0; j < 3; j++) {
          for (let i = 0; i < 3; i++) {
            out[j] += input[i] * W[i * 3 + j];
          }
          out[j] += b[j];
        }
        return out;
      } else {
        const W1 = weightTensors[0].dataSync(); // [3, H]
        const b1 = weightTensors[1].dataSync(); // [H]
        const W2 = weightTensors[2].dataSync(); // [H, 3]
        const b2 = weightTensors[3].dataSync(); // [3]
        const H = hiddenSize;
        const hidden = new Array(H).fill(0);
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < 3; i++) {
            hidden[j] += input[i] * W1[i * H + j];
          }
          hidden[j] = Math.max(0, hidden[j] + b1[j]);
        }
        const out = [0, 0, 0];
        for (let k = 0; k < 3; k++) {
          for (let j = 0; j < H; j++) {
            out[k] += hidden[j] * W2[j * 3 + k];
          }
          out[k] += b2[k];
        }
        return out;
      }
    }

    /** Create and position the HTML input overlay (called once). */
    _setupOverlay(container) {
      const overlay = document.createElement('div');
      overlay.className = 'nodelink-overlay';
      container.style.position = 'relative';
      container.appendChild(overlay);
      this.overlayDiv = overlay;

      for (let i = 0; i < 3; i++) {
        const field = document.createElement('input');
        field.type = 'text';
        field.className = 'nodelink-input';
        field.value = String(this.inputValues[i]);

        const viz = this;
        field.addEventListener('input', function () {
          const val = parseFloat(this.value);
          if (!isNaN(val)) {
            viz.inputValues[i] = val;
            viz._refreshOutputLabels();
          } else {
            this.value = String(viz.inputValues[i]);
          }
        });

        overlay.appendChild(field);
        this.inputFields.push(field);
      }
      this.overlayCreated = true;
    }

    /**
     * Convert SVG coordinates to CSS pixel coordinates relative to the container.
     * Accounts for viewBox scaling and xMidYMid meet.
     */
    _svgPos(sx, sy) {
      const svgNode = this.svg.node();
      const svgRect = svgNode.getBoundingClientRect();
      const containerRect = svgNode.parentNode.getBoundingClientRect();
      const vb = svgNode.viewBox.baseVal;
      return {
        x: (svgRect.left - containerRect.left) + (sx / vb.width) * svgRect.width,
        y: (svgRect.top - containerRect.top) + (sy / vb.height) * svgRect.height,
      };
    }

    /** Position the three HTML input fields near their input nodes. */
    _positionInputFields(inputNodes) {
      if (!this.overlayCreated) return;
      for (let i = 0; i < 3; i++) {
        const pos = this._svgPos(inputNodes[i].x - 38, inputNodes[i].y - 9);
        const f = this.inputFields[i];
        f.style.left = pos.x + 'px';
        f.style.top = pos.y + 'px';
      }
    }

    /** Update the SVG output labels (ŷ and y) in-place without full SVG redraw. */
    _refreshOutputLabels() {
      if (!this.lastWeights || !this.yhatLabels.length) return;
      const input = [
        parseFloat(this.inputFields[0].value) || 0,
        parseFloat(this.inputFields[1].value) || 0,
        parseFloat(this.inputFields[2].value) || 0,
      ];
      const predicted = this._computeForwardPass(
        input, this.lastArchitecture, this.lastHiddenSize, this.lastWeights
      );
      const expected = [input[2], input[0], input[1]];

      for (let i = 0; i < 3; i++) {
        if (this.yhatLabels[i]) this.yhatLabels[i].text(predicted[i].toFixed(3));
        if (this.yLabels[i]) this.yLabels[i].text(expected[i].toFixed(3));
      }
    }

    /** Main update: redraws the full SVG diagram + positions overlay + draws output labels. */
    update(architecture, hiddenSize, weightTensors) {
      if (!weightTensors) return;

      this.lastArchitecture = architecture;
      this.lastHiddenSize = hiddenSize;
      this.lastWeights = weightTensors;

      const containerNode = this.svg.node();
      if (!containerNode) return;
      const container = containerNode.parentNode;
      if (!container) return;
      const fullW = container.clientWidth || 700;
      const fullH = container.clientHeight || 240;

      if (!this.overlayCreated) this._setupOverlay(container);

      this.svg.selectAll('*').remove();
      this.svg
        .attr('width', fullW)
        .attr('height', fullH)
        .attr('viewBox', `0 0 ${fullW} ${fullH}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const hasHidden = architecture === 'mlp';
      const h = hasHidden ? hiddenSize : 0;
      const maxNodes = Math.max(3, h, 3);
      const availV = fullH - this.padding.top - this.padding.bottom;
      const maxGap = 50;
      const fitGap = maxNodes > 1 ? availV / (maxNodes - 1) : availV;
      const vGap = Math.min(maxGap, fitGap);

      let inputX, hiddenX, outputX, yhatX, yX;
      if (hasHidden) {
        inputX = fullW * 0.08;
        hiddenX = fullW * 0.4;
        outputX = fullW * 0.6;
        yhatX = fullW * 0.73;
        yX = fullW * 0.84;
      } else {
        inputX = fullW * 0.15;
        outputX = fullW * 0.55;
        yhatX = fullW * 0.7;
        yX = fullW * 0.83;
      }

      const padTop = this.padding.top;

      function yPos(index, total) {
        const span = (total - 1) * vGap;
        const top = padTop + (availV - span) / 2;
        return top + index * vGap;
      }

      const subscripts = ['\u2080', '\u2081', '\u2082']; // ₀ ₁ ₂

      const inputNodes = [];
      for (let i = 0; i < 3; i++) {
        inputNodes.push({ id: `in${i}`, x: inputX, y: yPos(i, 3), label: 'x' + subscripts[i] });
      }

      const outputNodes = [];
      for (let i = 0; i < 3; i++) {
        outputNodes.push({ id: `out${i}`, x: outputX, y: yPos(i, 3), label: 'y' + subscripts[i] });
      }

      const toSub = (n) => String(n).split('').map((d) => String.fromCodePoint(0x2080 + +d)).join('');

      const hiddenNodes = [];
      if (hasHidden) {
        for (let i = 0; i < h; i++) {
          hiddenNodes.push({ id: `h${i}`, x: hiddenX, y: yPos(i, h), label: 'h' + toSub(i) });
        }
      }

      // Extract kernel matrices for edge drawing
      let w1, w2;
      if (architecture === 'linear') {
        w1 = weightTensors[0].dataSync();
        w2 = null;
      } else {
        w1 = weightTensors[0].dataSync();
        w2 = weightTensors[2].dataSync();
      }

      let maxAbs = 0.1;
      for (let i = 0; i < w1.length; i++) maxAbs = Math.max(maxAbs, Math.abs(w1[i]));
      if (w2) {
        for (let i = 0; i < w2.length; i++) maxAbs = Math.max(maxAbs, Math.abs(w2[i]));
      }

      const maxEdgeWidth = hasHidden ? 5 : 8;

      // ── Draw edges ──

      if (hasHidden && w2) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < h; j++) {
            const val = w1[i * h + j];
            const abs = Math.abs(val);
            if (abs < 0.001) continue;
            const frac = abs / maxAbs;
            const sw = 0.5 + frac * maxEdgeWidth;
            const alpha = 0.1 + 0.7 * frac;
            const color = val > 0 ? '#00d4aa' : '#f85149';
            this.svg
              .append('line')
              .attr('x1', inputNodes[i].x).attr('y1', inputNodes[i].y)
              .attr('x2', hiddenNodes[j].x).attr('y2', hiddenNodes[j].y)
              .attr('stroke', color).attr('stroke-width', sw)
              .attr('opacity', alpha).attr('class', 'edge-line');
          }
        }
        for (let j = 0; j < h; j++) {
          for (let k = 0; k < 3; k++) {
            const val = w2[j * 3 + k];
            const abs = Math.abs(val);
            if (abs < 0.001) continue;
            const frac = abs / maxAbs;
            const sw = 0.5 + frac * maxEdgeWidth;
            const alpha = 0.1 + 0.7 * frac;
            const color = val > 0 ? '#00d4aa' : '#f85149';
            this.svg
              .append('line')
              .attr('x1', hiddenNodes[j].x).attr('y1', hiddenNodes[j].y)
              .attr('x2', outputNodes[k].x).attr('y2', outputNodes[k].y)
              .attr('stroke', color).attr('stroke-width', sw)
              .attr('opacity', alpha).attr('class', 'edge-line');
          }
        }
      } else {
        for (let i = 0; i < 3; i++) {
          for (let k = 0; k < 3; k++) {
            const val = w1[i * 3 + k];
            const abs = Math.abs(val);
            if (abs < 0.001) continue;
            const frac = abs / maxAbs;
            const sw = 0.5 + frac * maxEdgeWidth;
            const alpha = 0.15 + 0.7 * frac;
            const color = val > 0 ? '#00d4aa' : '#f85149';
            this.svg
              .append('line')
              .attr('x1', inputNodes[i].x).attr('y1', inputNodes[i].y)
              .attr('x2', outputNodes[k].x).attr('y2', outputNodes[k].y)
              .attr('stroke', color).attr('stroke-width', sw)
              .attr('opacity', alpha).attr('class', 'edge-line');
          }
        }
      }

      // ── Draw nodes ──

      inputNodes.forEach((n) => {
        this.svg.append('circle')
          .attr('cx', n.x).attr('cy', n.y).attr('r', 7)
          .attr('fill', '#58a6ff').attr('class', 'node-circle');
      });

      hiddenNodes.forEach((n) => {
        this.svg.append('circle')
          .attr('cx', n.x).attr('cy', n.y).attr('r', 5)
          .attr('fill', '#f0883e').attr('class', 'node-circle');
        if (h <= 12) {
          this.svg.append('text')
            .attr('x', n.x).attr('y', n.y - 10)
            .attr('class', 'node-label').style('font-size', '9px').text(n.label);
        }
      });

      outputNodes.forEach((n) => {
        this.svg.append('circle')
          .attr('cx', n.x).attr('cy', n.y).attr('r', 7)
          .attr('fill', '#f85149').attr('class', 'node-circle');
      });

      // ── Forward pass + output labels ──

      const inputVals = [
        parseFloat(this.inputFields[0].value) || 0,
        parseFloat(this.inputFields[1].value) || 0,
        parseFloat(this.inputFields[2].value) || 0,
      ];
      const predicted = this._computeForwardPass(
        inputVals, architecture, hiddenSize, weightTensors
      );
      const expected = [inputVals[2], inputVals[0], inputVals[1]];

      this.yhatLabels = [];
      this.yLabels = [];
      const labelFontSize = '11px';

      for (let i = 0; i < 3; i++) {
        const y = yPos(i, 3);

        this.svg.append('text')
          .attr('x', yhatX).attr('y', y)
          .attr('class', 'forward-output').attr('text-anchor', 'start')
          .attr('dominant-baseline', 'central')
          .style('font-size', labelFontSize)
          .style('font-family', 'JetBrains Mono, monospace')
          .style('fill', '#00d4aa')
          .text(predicted[i].toFixed(3));

        this.svg.append('text')
          .attr('x', yX).attr('y', y)
          .attr('class', 'forward-expected').attr('text-anchor', 'start')
          .attr('dominant-baseline', 'central')
          .style('font-size', labelFontSize)
          .style('font-family', 'JetBrains Mono, monospace')
          .style('fill', '#8b949e')
          .text(expected[i].toFixed(3));
      }

      // Store references for in-place updates
      this.yhatLabels = this.svg.selectAll('.forward-output').nodes();
      this.yLabels = this.svg.selectAll('.forward-expected').nodes();
      this.yhatLabels = this.yhatLabels.map((el) => d3.select(el));
      this.yLabels = this.yLabels.map((el) => d3.select(el));

      // ── Column headers ──

      this.svg.append('text')
        .attr('x', yhatX).attr('y', this.padding.top + 12)
        .attr('class', 'chart-title').attr('text-anchor', 'start')
        .text('\u0177 (predicted)');

      this.svg.append('text')
        .attr('x', yX).attr('y', this.padding.top + 12)
        .attr('class', 'chart-title').attr('text-anchor', 'start')
        .text('y (expected)');

      // ── Layer labels ──

      this.svg.append('text')
        .attr('x', inputX).attr('y', 14)
        .attr('class', 'chart-title').attr('text-anchor', 'middle').text('x');

      if (hasHidden) {
        this.svg.append('text')
          .attr('x', hiddenX).attr('y', 14)
          .attr('class', 'chart-title').attr('text-anchor', 'middle').text('Hidden');
      }

      // ── Edge legend ──

      const legX = fullW - 100;
      const legY = fullH - 25;
      this.svg.append('line')
        .attr('x1', legX).attr('y1', legY).attr('x2', legX + 20).attr('y2', legY)
        .attr('stroke', '#00d4aa').attr('stroke-width', 3).attr('class', 'edge-line');
      this.svg.append('text')
        .attr('x', legX + 24).attr('y', legY + 4)
        .attr('class', 'chart-title').text('pos');

      this.svg.append('line')
        .attr('x1', legX + 48).attr('y1', legY).attr('x2', legX + 68).attr('y2', legY)
        .attr('stroke', '#f85149').attr('stroke-width', 3).attr('class', 'edge-line');
      this.svg.append('text')
        .attr('x', legX + 72).attr('y', legY + 4)
        .attr('class', 'chart-title').text('neg');

      // ── Position the HTML input overlay fields ──

      this._positionInputFields(inputNodes);
    }
  }

  // ── 8c. LossCurveViz ──────────────────────────────────────

  class LossCurveViz {
    constructor(svgId) {
      this.svg = d3.select(`#${svgId}`);
      this.margin = { top: 16, right: 28, bottom: 38, left: 56 };
      this.MAX_POINTS = 500;
    }

    update(lossHistoryArr) {
      const containerNode = this.svg.node();
      if (!containerNode) return;
      const container = containerNode.parentNode;
      if (!container) return;
      const fullW = container.clientWidth || 600;
      const fullH = container.clientHeight || 200;

      this.svg.selectAll('*').remove();
      this.svg
        .attr('width', fullW)
        .attr('height', fullH)
        .attr('viewBox', `0 0 ${fullW} ${fullH}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const width = fullW - this.margin.left - this.margin.right;
      const height = fullH - this.margin.top - this.margin.bottom;
      const g = this.svg
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

      const data = lossHistoryArr.slice(-this.MAX_POINTS);
      const n = data.length;

      if (n < 2) {
        // Draw empty state
        g.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('class', 'axis-label')
          .text('Waiting for training data...');
        return;
      }

      const xMax = n - 1;
      let yMax = d3.max(data);
      if (yMax === 0) yMax = 1;

      const xScale = d3.scaleLinear().domain([0, xMax]).range([0, width]);
      const yScale = d3.scaleLinear().domain([0, yMax * 1.08]).range([height, 0]);

      // Axes
      const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d'));
      const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2g'));

      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'axis')
        .call(xAxis);

      g.append('g').attr('class', 'axis').call(yAxis);

      // Grid lines
      g.append('g')
        .attr('class', 'grid-line')
        .selectAll('line')
        .data(yScale.ticks(5))
        .join('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', (d) => yScale(d))
        .attr('y2', (d) => yScale(d));

      // Axis labels
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height + 32)
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .text('Step');

      g.append('text')
        .attr('x', -height / 2)
        .attr('y', -42)
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .text('MSE Loss');

      // Line
      const line = d3
        .line()
        .x((_, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('class', 'loss-line')
        .attr('d', line);

      // Area fill
      const area = d3
        .area()
        .x((_, i) => xScale(i))
        .y0(height)
        .y1((d) => yScale(d))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(data).attr('class', 'loss-area').attr('d', area);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 9. Visualization Orchestration
  // ═══════════════════════════════════════════════════════════

  const heatmapViz = new HeatmapViz('heatmap-svg');
  const nodeLinkViz = new NodeLinkViz('nodelink-svg');
  const lossCurveViz = new LossCurveViz('loss-svg');

  function updateAllVisualizations() {
    if (!model) return;

    const weightTensors = model.getWeights(); // internal refs — do NOT dispose
    const kernels = extractKernels(weightTensors);
    const showRef = els.refToggle.checked;

    heatmapViz.update(kernels, showRef);
    nodeLinkViz.update(config.architecture, config.hiddenSize, weightTensors);
    lossCurveViz.update(lossHistory);
  }

  function clearAllVisualizations() {
    heatmapViz.update([], false);
    nodeLinkViz.update(config.architecture, config.hiddenSize, null);
    lossCurveViz.update([]);
  }

  // ═══════════════════════════════════════════════════════════
  // 10. UI Control Bindings
  // ═══════════════════════════════════════════════════════════

  /** Rebuild model (if config affecting structure/compile changed) and reset */
  function onConfigStructuralChange() {
    const wasRunning = running;
    stopTraining();
    disposeModel();
    stepCount = 0;
    lossHistory = [];
    els.stepDisplay.textContent = '0';
    els.lossDisplay.textContent = '—';
    buildModel();
    clearAllVisualizations();
    updateAllVisualizations(); // show initial random weights
    if (wasRunning) startTraining();
  }

  /** Non-structural change: just update config and continue */
  function onConfigSoftChange() {
    // No rebuild needed; next training step picks up new config
  }

  // Architecture buttons
  els.archLinear.addEventListener('click', () => {
    if (config.architecture === 'linear') return;
    config.architecture = 'linear';
    els.archLinear.classList.add('active');
    els.archMLP.classList.remove('active');
    els.groupHidden.style.display = 'none';
    onConfigStructuralChange();
  });

  els.archMLP.addEventListener('click', () => {
    if (config.architecture === 'mlp') return;
    config.architecture = 'mlp';
    els.archMLP.classList.add('active');
    els.archLinear.classList.remove('active');
    els.groupHidden.style.display = '';
    onConfigStructuralChange();
  });

  // Initialize hidden group visibility
  els.groupHidden.style.display = config.architecture === 'linear' ? 'none' : '';

  // Hidden size slider
  els.hiddenSlider.addEventListener('input', () => {
    config.hiddenSize = parseInt(els.hiddenSlider.value);
    els.hiddenValue.textContent = config.hiddenSize;
  });
  els.hiddenSlider.addEventListener('change', () => {
    onConfigStructuralChange();
  });

  // Learning rate slider (exponential mapping)
  els.lrSlider.addEventListener('input', () => {
    config.learningRate = expMap(parseFloat(els.lrSlider.value), 0.0001, 1.0);
    els.lrValue.textContent = config.learningRate.toFixed(4);
  });
  els.lrSlider.addEventListener('change', () => {
    onConfigStructuralChange();
  });

  // Optimizer select
  els.optimizerSelect.addEventListener('change', () => {
    config.optimizerType = els.optimizerSelect.value;
    onConfigStructuralChange();
  });

  // Regularization radios
  document.querySelectorAll('input[name="reg"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      config.regularization = radio.value;
      els.groupLambda.style.display =
        config.regularization === 'none' ? 'none' : '';
      onConfigStructuralChange();
    });
  });
  els.groupLambda.style.display = 'none';

  // Lambda slider (exponential mapping)
  els.lambdaSlider.addEventListener('input', () => {
    config.regLambda = expMap(parseFloat(els.lambdaSlider.value), 0.00001, 0.5);
    els.lambdaValue.textContent = config.regLambda.toFixed(4);
  });
  els.lambdaSlider.addEventListener('change', () => {
    onConfigStructuralChange();
  });

  // Batch size slider
  els.batchSlider.addEventListener('input', () => {
    config.batchSize = parseInt(els.batchSlider.value);
    els.batchValue.textContent = config.batchSize;
  });

  // Speed slider
  els.speedSlider.addEventListener('input', () => {
    config.stepsPerSecond = parseInt(els.speedSlider.value);
    els.speedValue.textContent = config.stepsPerSecond;
    // If training, restart the loop with new interval
    if (running) {
      clearTimeout(timeoutId);
      timeoutId = null;
      scheduleLoop();
    }
  });

  // Play button
  els.btnPlay.addEventListener('click', () => {
    startTraining();
  });

  // Pause button
  els.btnPause.addEventListener('click', () => {
    stopTraining();
  });

  // Step once button
  els.btnStep.addEventListener('click', async () => {
    if (!model) buildModel();

    let loss;
    try {
      loss = await trainStep();
    } catch (err) {
      console.error('Step failed:', err);
      return;
    }

    stepCount++;
    lossHistory.push(loss);
    if (lossHistory.length > 10000) {
      lossHistory = lossHistory.slice(-2000);
    }

    els.stepDisplay.textContent = stepCount.toLocaleString();
    els.lossDisplay.textContent = loss.toFixed(4);
    updateAllVisualizations();
  });

  // Reset button
  els.btnReset.addEventListener('click', () => {
    hardReset();
  });

  // Reference toggle
  els.refToggle.addEventListener('change', () => {
    updateAllVisualizations();
  });

  // ═══════════════════════════════════════════════════════════
  // 11. Initialization
  // ═══════════════════════════════════════════════════════════

  function init() {
    // Handle window resize for visualizations
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateAllVisualizations();
      }, 150);
    });

    // Build initial model and show random weights
    buildModel();
    updateAllVisualizations();
    updateButtonStates();
  }

  // Wait for TF.js backend to be ready before initializing
  tf.ready().then(() => {
    console.log('TF.js backend:', tf.getBackend());
    init();
  });
})();
