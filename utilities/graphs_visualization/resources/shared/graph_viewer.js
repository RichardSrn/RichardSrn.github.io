/* Graph Viewer - Shared JavaScript
 * For use with D3.js v7 and Chart.js
 * 
 * Expected globals from HTML:
 * - GRAPH_DATA (object with nodes, links, selfLoops, graphInfo, featureMode)
 * - GRAPH_NAME (string)
 */

// Global state to track UI initialization and active viewer components
window.UI_INITIALIZED = false;
window.ACTIVE_VIEWER = {
    simulation: null,
    node: null,
    link: null,
    svg: null,
    zoom: null,
    chartInstance: null,
    currentFeatures: null,
    nodesData: null
};

// --- INITIALIZATION ---
function initGraphViewer(config = {}) {
    const { data, name, isSBM = false, sbmLevels = [] } = config;

    const nodesData = data.nodes;
    const linksData = data.links;
    const selfLoops = data.selfLoops || [];
    const graphInfo = data.graphInfo || {};
    const featureMode = data.featureMode || 'full';

    window.ACTIVE_VIEWER.data = data;
    window.ACTIVE_VIEWER.nodesData = nodesData;

    // Set title
    const graphNameEl = document.getElementById('graph-name');
    if (graphNameEl) graphNameEl.textContent = name;

    // Update info overlay
    updateInfoOverlay(graphInfo);

    // Update feature mode display
    const featureModeEl = document.getElementById('feature-mode');
    if (featureModeEl) featureModeEl.textContent = featureMode.toUpperCase();

    // Setup UI listeners only once
    setupUIListeners();

    // Capture current zoom state
    let savedTransform = d3.zoomIdentity;
    const oldSvg = document.querySelector('#graph-container svg');
    if (oldSvg) {
        savedTransform = d3.zoomTransform(oldSvg);
    }

    // D3 SETUP
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing SVG if any
    d3.select('#graph-container svg').remove();

    const svg = d3.select('#graph-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .on('click', (e) => {
            if (e.target.tagName === 'svg') {
                resetSelection();
            }
        });

    const g = svg.append('g');

    // Enhanced Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.01, 100])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);

            // Update zoom slider/val if they exist
            const zoomSlider = document.getElementById('zoomSlider');
            const zoomVal = document.getElementById('zoom-val');
            if (zoomSlider) zoomSlider.value = event.transform.k.toFixed(1);
            if (zoomVal) zoomVal.value = event.transform.k.toFixed(1);
        });
    svg.call(zoom);

    // Apply saved transform
    svg.call(zoom.transform, savedTransform);

    // READ CURRENT UI PARAMETERS for initial simulation state
    const chargeVal = parseFloat(document.getElementById('charge')?.value || -300);
    const linkDistVal = parseFloat(document.getElementById('linkDist')?.value || 50);

    // Simulation
    const simulation = d3.forceSimulation(nodesData)
        .force('link', d3.forceLink(linksData).id(d => d.id).distance(linkDistVal))
        .force('charge', d3.forceManyBody().strength(chargeVal))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(d => 5))
        .alphaDecay(0.001);  // Slower decay = more time to settle into a good layout

    // The simulation runs with alpha=1 and decays slowly, giving nodes
    // plenty of time to spread out and find their natural positions.

    // Elements
    const linkWidthVal = parseFloat(document.getElementById('linkWidth')?.value || 1);
    const link = g.append('g')
        .selectAll('line')
        .data(linksData)
        .join('line')
        .attr('class', 'link')
        .attr('stroke', 'var(--link-color)')
        .attr('stroke-width', linkWidthVal);

    // Self loops - created here so they are behind nodes/labels
    const selfLoopGroup = g.append('g');
    function drawSelfLoops() {
        // Read current slider value so self-loops stay in sync with the linkWidth control
        const currentWidth = parseFloat(document.getElementById('linkWidth')?.value || linkWidthVal);
        selfLoopGroup.selectAll('path').remove();
        selfLoopGroup.selectAll('path')
            .data(selfLoops)
            .join('path')
            .attr('class', 'link')
            .attr('d', nodeId => {
                const n = nodesData.find(x => x.id === nodeId);
                if (!n) return '';
                const r = (parseFloat(n.r) || 6) + 10;
                return `M ${n.x},${n.y - 5} A ${r},${r} 0 1,1 ${n.x + 5},${n.y}`;
            })
            .attr('stroke', 'var(--link-color)')
            .attr('stroke-width', currentWidth)
            .attr('fill', 'none');
    }

    const label = g.append('g')
        .selectAll('text')
        .data(nodesData)
        .join('text')
        .attr('class', 'node-label')
        .text(d => d.id);

    const node = g.append('g')
        .selectAll('circle')
        .data(nodesData)
        .join('circle')
        .attr('class', 'node')
        .attr('fill', d => d.color)
        .attr('stroke', document.body.classList.contains('dark') ? '#333' : '#fff')
        .attr('stroke-width', 1.5)
        .call(drag(simulation))
        .on('click', (event, d) => {
            event.stopPropagation();
            selectNode(d);
        });

    // Initial label visibility
    const showLabelsCb = document.getElementById('showLabels');
    if (showLabelsCb && !showLabelsCb.checked) {
        g.classed('labels-hidden', true);
    }

    // Node sizes synchronization
    window.ACTIVE_VIEWER.node = node;
    window.ACTIVE_VIEWER.label = label; // Track labels
    window.ACTIVE_VIEWER.selfLoopGroup = selfLoopGroup;
    window.ACTIVE_VIEWER.simulation = simulation;
    updateNodeSizes();

    // Tooltip
    const tooltip = d3.select('#tooltip');
    node.on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
            .html(`<b>${d.label}</b><br>Deg: ${d.degree}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    })
        .on('mouseout', () => tooltip.style('display', 'none'));

    // Tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        label
            .attr('x', d => d.x)
            .attr('y', d => d.y - (d.r || 6) - 5);

        drawSelfLoops();
    });

    function drag(simulation) {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    // Update global state
    window.ACTIVE_VIEWER.link = link;
    window.ACTIVE_VIEWER.svg = svg;
    window.ACTIVE_VIEWER.zoom = zoom;
    window.ACTIVE_VIEWER.selfLoopGroup = selfLoopGroup;

    // Reset panel if node not found in new graph
    if (window.ACTIVE_VIEWER.currentFeatures) {
        // Optionally we could try to find a node with same ID here
    }

    return window.ACTIVE_VIEWER;
}

// --- UI SETUP (RUNS ONCE) ---
function setupUIListeners() {
    if (window.UI_INITIALIZED) return;

    function setupSlider(id, callback, explicitInputId) {
        const slider = document.getElementById(id);
        const input = document.getElementById(explicitInputId || (id + '-val'));
        if (!slider || !input) return;
        slider.addEventListener('input', () => {
            input.value = slider.value;
            callback(parseFloat(slider.value));
        });
        input.addEventListener('change', () => {
            slider.value = input.value;
            callback(parseFloat(input.value));
        });
    }

    setupSlider('charge', (val) => {
        if (window.ACTIVE_VIEWER.simulation) {
            window.ACTIVE_VIEWER.simulation.force('charge', d3.forceManyBody().strength(val));
            window.ACTIVE_VIEWER.simulation.alpha(0.3).restart();
        }
    });

    setupSlider('linkDist', (val) => {
        if (window.ACTIVE_VIEWER.simulation) {
            window.ACTIVE_VIEWER.simulation.force('link').distance(val);
            window.ACTIVE_VIEWER.simulation.alpha(0.3).restart();
        }
    });

    setupSlider('nodeSize', updateNodeSizes);

    setupSlider('linkWidth', (val) => {
        if (window.ACTIVE_VIEWER.link) {
            window.ACTIVE_VIEWER.link.attr('stroke-width', val);
        }
        if (window.ACTIVE_VIEWER.selfLoopGroup) {
            window.ACTIVE_VIEWER.selfLoopGroup.selectAll('path').attr('stroke-width', val);
        }
    });

    setupSlider('zoomSlider', (val) => {
        if (window.ACTIVE_VIEWER.svg && window.ACTIVE_VIEWER.zoom) {
            // console.log("Zoom slider change:", val);
            window.ACTIVE_VIEWER.svg.call(
                window.ACTIVE_VIEWER.zoom.scaleTo,
                val
            );
        }
    }, 'zoom-val');

    const degreeSizeCb = document.getElementById('degreeSize');
    if (degreeSizeCb) degreeSizeCb.addEventListener('change', updateNodeSizes);

    // Bins Slider
    const binsSlider = document.getElementById('histogramBins');
    const binsVal = document.getElementById('histogramBins-val');
    if (binsSlider && binsVal) {
        binsSlider.addEventListener('input', () => {
            binsVal.textContent = binsSlider.value;
            if (window.ACTIVE_VIEWER.currentFeatures) {
                renderChart(window.ACTIVE_VIEWER.currentFeatures);
            }
        });
    }

    const showLabelsCb = document.getElementById('showLabels');
    if (showLabelsCb) {
        showLabelsCb.addEventListener('change', function () {
            const g = d3.select('svg g');
            if (g) g.classed('labels-hidden', !this.checked);
        });
    }

    // Toggles
    const toggleCtl = document.getElementById('toggleControls');
    if (toggleCtl) toggleCtl.addEventListener('click', function () {
        const controls = document.getElementById('controls');
        if (!controls) return;
        controls.classList.toggle('hidden');
        this.classList.toggle('active', !controls.classList.contains('hidden'));
    });

    const toggleFeats = document.getElementById('toggleFeatures');
    if (toggleFeats) toggleFeats.addEventListener('click', toggleFeatures);

    const toggleInf = document.getElementById('toggleInfo');
    if (toggleInf) toggleInf.addEventListener('click', function () {
        const info = document.getElementById('info-overlay');
        if (!info) return;
        info.style.opacity = info.style.opacity === '0' ? '0.8' : '0';
        this.classList.toggle('active');
    });

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        // A full reload is the most robust way to reset all parameters, 
        // re-center the graph, and clear any zoom/pan state perfectly.
        location.reload();
    });

    const darkBtn = document.getElementById('darkBtn');
    if (darkBtn) darkBtn.addEventListener('click', function () {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        this.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        if (window.ACTIVE_VIEWER.node) {
            window.ACTIVE_VIEWER.node.attr('stroke', isDark ? '#333' : '#fff');
        }
    });

    // Save
    const savePng = document.getElementById('savePng');
    if (savePng) savePng.addEventListener('click', () => {
        const name = document.getElementById('graph-name')?.textContent || "graph";
        saveImage('png', name);
    });
    const saveSvg = document.getElementById('saveSvg');
    if (saveSvg) saveSvg.addEventListener('click', () => {
        const name = document.getElementById('graph-name')?.textContent || "graph";
        saveImage('svg', name);
    });

    window.UI_INITIALIZED = true;
}

// --- NODES UI LOGIC ---
function updateNodeSizes() {
    const nodeSizeEl = document.getElementById('nodeSize');
    const degreeSizeCb = document.getElementById('degreeSize');
    if (!nodeSizeEl || !degreeSizeCb || !window.ACTIVE_VIEWER.node) return;

    const sizeVal = parseFloat(nodeSizeEl.value);
    const degreeMode = degreeSizeCb.checked;
    const node = window.ACTIVE_VIEWER.node;
    const nodesData = window.ACTIVE_VIEWER.nodesData;
    const simulation = window.ACTIVE_VIEWER.simulation;

    if (degreeMode) {
        const maxDeg = Math.max(...nodesData.map(d => d.degree)) || 1;
        node.attr('r', d => {
            const scale = 3 + Math.sqrt(d.degree / maxDeg) * sizeVal * 2.5;
            d.r = scale;
            return scale;
        });
    } else {
        node.attr('r', sizeVal);
        nodesData.forEach(d => d.r = sizeVal);
    }
    if (simulation) {
        simulation.force('collide', d3.forceCollide().radius(d => (d.r || sizeVal) + 2));
        simulation.alpha(0.1).restart();
    }
}

// --- INTERACTION LOGIC ---
function selectNode(d) {
    if (!window.ACTIVE_VIEWER.node) return;
    const node = window.ACTIVE_VIEWER.node;

    node.attr('stroke', document.body.classList.contains('dark') ? '#333' : '#fff').attr('stroke-width', 1.5);
    const selected = node.filter(n => n.id === d.id);
    selected.attr('stroke', '#000').attr('stroke-width', 3);

    const panel = document.getElementById('side-panel');
    if (panel) panel.classList.remove('hidden');

    const featBtn = document.getElementById('toggleFeatures');
    if (featBtn) featBtn.classList.add('active');

    const placeholder = document.getElementById('panel-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const details = document.getElementById('node-details');
    if (details) details.style.display = 'block';

    if (document.getElementById('node-title')) document.getElementById('node-title').textContent = d.label;
    if (document.getElementById('node-group')) document.getElementById('node-group').textContent = d.group;
    if (document.getElementById('node-degree')) document.getElementById('node-degree').textContent = d.degree;

    if (document.getElementById('node-degree')) document.getElementById('node-degree').textContent = d.degree;

    console.log("Selected node:", d);
    console.log(" Node features:", d.features);

    window.ACTIVE_VIEWER.currentFeatures = d.features || {};

    // --- Feature Table Rendering ---
    const tbody = document.querySelector('#feature-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const features = d.features || {};
        const numFeatures = window.ACTIVE_VIEWER.data.numFeatures || 0;

        let allKeys = [];
        // If we have numFeatures, we can reconstruct the full list "Feat 0" ... "Feat N-1"
        // But if N is large (e.g. 1700), rendering 1700 rows might be slow.

        // User requested to skip 0s in the table for clarity/performance,
        // but keep them in the histogram.
        // So we only iterate over the keys present in the sparse features object.
        allKeys = Object.keys(features);

        // Sort numerically
        allKeys.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
        });

        // Use a document fragment for performance
        const fragment = document.createDocumentFragment();

        // Safety limit? 1700 is fine for modern browsers. 10k might be sluggish.
        allKeys.forEach(k => {
            const val = features[k];
            // Only show if non-zero (though sparse dict usually implies this, safe to check)
            if (Math.abs(val) > 1e-9) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${k}</td><td>${val.toFixed(4)}</td>`;
                fragment.appendChild(tr);
            }
        });
        tbody.appendChild(fragment);

        if (tbody.children.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">No non-zero features</td></tr>';
        }
    }

    // Show sparse representation note if applicable
    const sparseNote = document.getElementById('sparse-note');
    if (sparseNote) {
        const featureMode = window.ACTIVE_VIEWER.data?.featureMode || 'full';
        sparseNote.style.display = (featureMode === 'sparse') ? 'block' : 'none';
    }

    renderChart(d.features);
}

function resetSelection() {
    if (window.ACTIVE_VIEWER.node) {
        window.ACTIVE_VIEWER.node.attr('stroke', document.body.classList.contains('dark') ? '#333' : '#fff').attr('stroke-width', 1.5);
    }
}

function renderChart(features) {
    const chartEl = document.getElementById('featureChart');
    if (!chartEl) return;
    const ctx = chartEl.getContext('2d');

    if (window.ACTIVE_VIEWER.chartInstance) window.ACTIVE_VIEWER.chartInstance.destroy();

    if (!features || Object.keys(features).length === 0) {
        console.warn("No features to render chart.");
        // Optional: clear canvas or show text
        return;
    }

    // Reconstruct full values vector including zeros
    const numFeatures = window.ACTIVE_VIEWER.data.numFeatures || 0;
    let fullValues = [];

    if (numFeatures > 0) {
        // Create array of zeros
        fullValues = new Float32Array(numFeatures).fill(0);
        // Fill in non-zeros
        for (const [key, val] of Object.entries(features)) {
            const idx = parseInt(key.match(/\d+/)?.[0]);
            if (!isNaN(idx) && idx < numFeatures) {
                fullValues[idx] = val;
            }
        }
    } else {
        // Fallback
        fullValues = Object.values(features);
    }

    if (fullValues.length === 0) return;

    const valuesArr = Array.from(fullValues); // Convert for Math.min/max logic if needed
    // But for histogram, we can iterate

    // Determine range. If binary/categorical, usually 0/1. If continuous, find min/max.
    let min = 0;
    let max = 0;
    if (valuesArr.length > 0) {
        min = Math.min(...valuesArr);
        max = Math.max(...valuesArr);
    }

    // If all zeros, range is 0. If mostly binary, range is 0-1.
    // Ensure we capture 0s.
    if (min > 0) min = 0; // always anchor at 0 for sparse data logic usually? 
    // Actually, stick to data bounds, but usually 0 is present.

    const binsSlider = document.getElementById('histogramBins');
    const numBins = binsSlider ? parseInt(binsSlider.value) : 10;
    const range = max - min || 1;
    const binWidth = range / numBins;

    const histogram = new Array(numBins).fill(0);

    valuesArr.forEach(v => {
        let binIndex = Math.floor((v - min) / binWidth);
        if (binIndex >= numBins) binIndex = numBins - 1;
        // Float precision fix
        if (binIndex < 0) binIndex = 0;
        histogram[binIndex]++;
    });

    const binLabels = histogram.map((_, i) => {
        const start = min + i * binWidth;
        const end = min + (i + 1) * binWidth;
        // Format label
        return i === numBins - 1
            ? `[${start.toFixed(2)}, ${end.toFixed(2)}]`
            : `[${start.toFixed(2)}, ${end.toFixed(2)})`;
    });

    window.ACTIVE_VIEWER.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Count',
                data: histogram,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Feature Distribution', font: { size: 11 } }
            },
            scales: {
                x: { display: true, title: { display: true, text: 'Value', font: { size: 10 } } },
                y: { display: true, title: { display: true, text: 'Count', font: { size: 10 } } }
            }
        }
    });
}

function toggleFeatures() {
    const panel = document.getElementById('side-panel');
    const btn = document.getElementById('toggleFeatures');
    if (panel && btn) {
        panel.classList.toggle('hidden');
        btn.classList.toggle('active');
    }
}
window.toggleFeatures = toggleFeatures;

// --- SAVE IMAGE ---
function saveImage(format, name) {
    const svgEl = document.querySelector('#graph-container svg');
    const container = document.getElementById('graph-container');
    if (!svgEl || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const bg = document.body.classList.contains('dark') ? '#1a1a2e' : 'white';
    const isDark = document.body.classList.contains('dark');

    const clone = svgEl.cloneNode(true);
    clone.style.background = bg;

    const nodes = clone.querySelectorAll('.node');
    nodes.forEach(n => {
        n.setAttribute('stroke', isDark ? '#333' : '#fff');
        const fill = n.getAttribute('fill');
        if (fill) n.setAttribute('fill', fill);
    });

    // Explicitly handle labels visibility and styling
    const labels = clone.querySelectorAll('.node-label');
    const areLabelsHidden = document.querySelector('svg g')?.classList.contains('labels-hidden');

    labels.forEach(l => {
        if (areLabelsHidden) {
            l.style.display = 'none';
        } else {
            // Apply styles inline so they persist in the SVG/PNG
            l.style.fontSize = '10px';
            l.style.fontWeight = 'bold';
            l.style.fill = isDark ? '#fff' : '#333';
            l.style.stroke = isDark ? '#1a1a2e' : '#fff';
            l.style.strokeWidth = '2px';
            l.style.paintOrder = 'stroke';
            l.style.strokeLinecap = 'round';
            l.style.strokeLinejoin = 'round';
            l.style.opacity = '0.8';
        }
    });

    const links = clone.querySelectorAll('.link');
    const linkColor = isDark ? '#555' : '#999';
    links.forEach(l => {
        l.setAttribute('stroke', linkColor);
        l.setAttribute('stroke-opacity', '0.6');
        const w = l.getAttribute('stroke-width');
        if (w) l.setAttribute('stroke-width', w);
    });

    const selfLoopPaths = clone.querySelectorAll('g path');
    selfLoopPaths.forEach(p => {
        if (p.getAttribute('stroke')) {
            p.setAttribute('stroke', linkColor);
            p.setAttribute('fill', 'none');
        }
    });

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(clone);

    if (format === 'svg') {
        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `${name}.svg`;
        a.href = url;
        a.click();
    } else {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));

        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = width * 2;
            canvas.height = height * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);

            const a = document.createElement('a');
            a.download = `${name}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
    }
}

// --- INFO OVERLAY ---
function updateInfoOverlay(graphInfo) {
    const overlay = document.getElementById('info-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
        <b>Graph Info:</b><br>
        Nodes: ${graphInfo.num_nodes || 'N/A'}<br>
        Edges: ${graphInfo.num_edges || 'N/A'}<br>
        Features: ${graphInfo.num_features || 'N/A'}<br>
        Avg Degree: ${graphInfo.avg_degree || 'N/A'}<br>
        Density: ${graphInfo.density || 'N/A'}<br>
        Adj. Homophily: ${graphInfo.adj_homophily || 'N/A'}
    `;
}

// --- SBM SLIDER (LEGACY - SBM EXPLORER USES INLINE JS) ---
function initSBMSlider(sbmDataMap, currentHomophily) {
    // This is for individual files that want to load others
    // Usually not used in the merged explorer
    const slider = document.getElementById('sbm-slider');
    if (!slider) return;
    slider.addEventListener('input', () => {
        const h = parseFloat(slider.value);
        const key = `h${h.toFixed(2)}`;
        if (sbmDataMap[key]) {
            initGraphViewer({ data: sbmDataMap[key], name: `SBM (h=${h.toFixed(2)})`, isSBM: true });
        }
    });
}
