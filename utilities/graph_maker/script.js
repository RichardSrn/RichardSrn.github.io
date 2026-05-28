// ============================================================
// SOCIAL GRAPH EDITOR — script.js
// ============================================================

// ===================== STATE =====================

let cy = null;
let selectedElement = null;
let _marqueeActive = false;
let _marqueeOverlay = null;

const STATE = {
  labelAttr: 'label',
  colorMode: 'attribute',
  colorAttr: 'group',
  communities: null,
  useManualColors: false
};

const VISUAL = {
  nodeSize: 45,
  edgeWidth: 2,
  labelSize: 12,
  nodeLabelColor: '#000000',
  edgeLabelColor: '#777788',
  nodeLabelBgColor: '#ffffff',
  edgeLabelBgColor: '#0f172a',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  nodeLabels: true,
  edgeLabels: false,
  nodeFontBold: false,
  edgeFontBold: false,
  nodeLabelBg: false,
  edgeLabelBg: false,
  repulsion: 8000,
  idealEdgeLength: 100,
  colorPalette: 'default',
  edgeOpacity: 1,
  curveStyle: 'unbundled-bezier',
  curveStep: 10,
  curveEdgeDistances: 'intersection',
  edgeWeightWidth: false,
  springCoeff: 0.0004,
  springMass: 8,
  springDamping: 0.1,
  nodeBorderWidth: 2,
  nodeBorderColor: '#1e3a5f',
  edgeArrows: false,
  bgColor: '#0f172a'
};

// ===================== UNDO =====================

var undoStack = [];
var UNDO_MAX = 100;

function pushUndo() {
  if (!cy) return;
  undoStack.push(cy.json());
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  updateUndoButton();
}

function performUndo() {
  if (!cy || undoStack.length === 0) return;
  var state = undoStack.pop();
  unhighlightNodeNeighborhood();
  cy.json(state);
  // Re-apply function-based styles: functions don't survive JSON serialization
  cy.style(baseStyle());
  applyLabelStyle();
  applyColorStyle();
  populateDropdowns();
  selectedElement = null;
  TOOL.selectedNodes = [];
  showEmptySidebar();
  updateUndoButton();
}

function updateUndoButton() {
  var btn = document.getElementById('btn-undo');
  if (!btn) return;
  var n = undoStack.length;
  btn.disabled = (n === 0);
  btn.textContent = 'Undo' + (n > 0 ? ' (' + n + ')' : '');
}

// ===================== TOOL SYSTEM =====================

const TOOL = {
  name: null,
  nodeCounter: 1,
  edgeSource: null,
  selectedNodes: [],
  settings: {
    'add-node':      { group: 'work',  attrs: {} },
    'add-edge':      { type: 'colleague', weight: 3, attrs: {} },
    'set-node-attrs': { attrs: {} },
    'set-edge-attrs': { attrs: {} },
    'connect-all':   { type: 'colleague', weight: 3, attrs: {} },
    'select-box':    {}
  }
};

function activateTool(name) {
  if (TOOL.name === name) { deactivateTool(); return; }
  TOOL.name = name;
  TOOL.edgeSource = null;
  if (name === 'connect-all') TOOL.selectedNodes = [];
  if (name === 'select-box' && cy) {
    cy.panningEnabled(false);
  }
  if (cy) cy.elements().unselect();
  updateToolButtons();
  renderToolPanel();
  updateToolCursor();
}

function deactivateTool() {
  if (TOOL.edgeSource) {
    TOOL.edgeSource.style('border-color', '#1e3a5f');
    TOOL.edgeSource.style('border-width', 2);
    TOOL.edgeSource = null;
  }
  if (cy) cy.elements().removeClass('highlighted');
  if (cy && TOOL.name === 'select-box') {
    cy.panningEnabled(true);
  }
  _marqueeActive = false;
  hideMarqueeOverlay();
  TOOL.selectedNodes = [];
  TOOL.name = null;
  updateToolButtons();
  hideToolPanel();
  updateToolCursor();
}

function updateToolButtons() {
  var buttons = document.querySelectorAll('.tool-btn');
  buttons.forEach(function(b) {
    b.classList.remove('active');
  });
  if (TOOL.name) {
    var active = document.getElementById('tool-' + TOOL.name);
    if (active) active.classList.add('active');
  }
}

function updateToolCursor() {
  var c = '';
  if (TOOL.name === 'add-node') c = 'crosshair';
  else if (TOOL.name === 'select-box') c = 'crosshair';
  else if (TOOL.name === 'add-edge' && TOOL.edgeSource) c = 'cell';
  else if (TOOL.name === 'add-edge') c = 'pointer';
  else if (TOOL.name === 'set-node-attrs') c = 'pointer';
  else if (TOOL.name === 'set-edge-attrs') c = 'pointer';
  document.getElementById('graph-cy').style.cursor = c || '';
}

function hideToolPanel() {
  document.getElementById('tool-panel').classList.add('hidden');
}

function toolLabel(name) {
  var map = { 'add-node': 'Add Node', 'add-edge': 'Add Edge', 'set-node-attrs': 'Set Node Attrs', 'set-edge-attrs': 'Set Edge Attrs', 'connect-all': 'Connect All', 'select-box': 'Select Box' };
  return map[name] || name;
}

function renderToolPanel() {
  var panel = document.getElementById('tool-panel');
  var content = document.getElementById('tool-panel-content');
  panel.classList.remove('hidden');

  var s = TOOL.settings[TOOL.name];
  var html = '<span class="tp-mode">' + toolLabel(TOOL.name) + '</span>';

  if (TOOL.name === 'add-node') {
    html += '<label class="tp-field">Group ' +
      '<select id="tp-node-group">' +
        '<option value="work"'    + (s.group==='work'?' selected':'')    + '>Work</option>' +
        '<option value="family"'  + (s.group==='family'?' selected':'')  + '>Family</option>' +
        '<option value="friends"' + (s.group==='friends'?' selected':'') + '>Friends</option>' +
        '<option value="other"'   + (s.group==='other'?' selected':'')   + '>Other</option>' +
      '</select></label>';
    html += '<div class="tp-attrs" id="tp-a-attrs"></div>';
    html += '<button id="tp-a-add-attr" class="btn btn-small">+ attr</button>';
  } else if (TOOL.name === 'add-edge') {
    html += '<label class="tp-field">Type ' +
      '<select id="tp-e-type">' +
        '<option value="colleague"'   +(s.type==='colleague'?' selected':'')   +'>Colleague</option>' +
        '<option value="friend"'      +(s.type==='friend'?' selected':'')      +'>Friend</option>' +
        '<option value="collaborator"'+(s.type==='collaborator'?' selected':'')+'>Collaborator</option>' +
        '<option value="spouse"'      +(s.type==='spouse'?' selected':'')      +'>Spouse</option>' +
        '<option value="sibling"'     +(s.type==='sibling'?' selected':'')     +'>Sibling</option>' +
        '<option value="parent"'      +(s.type==='parent'?' selected':'')      +'>Parent</option>' +
        '<option value="family"'      +(s.type==='family'?' selected':'')      +'>Family</option>' +
        '<option value="family-in-law"'+(s.type==='family-in-law'?' selected':'')+'>Family-in-law</option>' +
        '<option value="mentor"'      +(s.type==='mentor'?' selected':'')      +'>Mentor</option>' +
        '<option value="other"'       +(s.type==='other'?' selected':'')       +'>Other</option>' +
      '</select></label>';
    html += '<label class="tp-field">Weight <input id="tp-e-weight" type="number" min="1" max="5" value="' + s.weight + '" class="tp-num"></label>';
    html += '<div class="tp-attrs" id="tp-e-attrs"></div>';
    html += '<button id="tp-e-add-attr" class="btn btn-small">+ attr</button>';
  } else if (TOOL.name === 'set-node-attrs') {
    html += '<div class="tp-attrs" id="tp-sn-attrs"></div>';
    html += '<button id="tp-sn-add-attr" class="btn btn-small">+ attr</button>';
  } else if (TOOL.name === 'set-edge-attrs') {
    html += '<div class="tp-attrs" id="tp-se-attrs"></div>';
    html += '<button id="tp-se-add-attr" class="btn btn-small">+ attr</button>';
  } else if (TOOL.name === 'select-box') {
    html += '<span class="tp-mode">Drag on canvas to select multiple nodes. Click a node to toggle its selection.</span>';
  } else if (TOOL.name === 'connect-all') {
    html += '<label class="tp-field">Type ' +
      '<select id="tp-ca-type">' +
        '<option value="colleague"'   +((s.type||0)==='colleague'?' selected':'')   +'>Colleague</option>' +
        '<option value="friend"'      +((s.type||0)==='friend'?' selected':'')      +'>Friend</option>' +
        '<option value="collaborator"'+((s.type||0)==='collaborator'?' selected':'')+'>Collaborator</option>' +
        '<option value="spouse"'      +((s.type||0)==='spouse'?' selected':'')      +'>Spouse</option>' +
        '<option value="sibling"'     +((s.type||0)==='sibling'?' selected':'')     +'>Sibling</option>' +
        '<option value="parent"'      +((s.type||0)==='parent'?' selected':'')      +'>Parent</option>' +
        '<option value="family"'      +((s.type||0)==='family'?' selected':'')      +'>Family</option>' +
        '<option value="family-in-law"'+((s.type||0)==='family-in-law'?' selected':'')+'>Family-in-law</option>' +
        '<option value="mentor"'      +((s.type||0)==='mentor'?' selected':'')      +'>Mentor</option>' +
        '<option value="other"'       +((s.type||0)==='other'?' selected':'')       +'>Other</option>' +
      '</select></label>';
    html += '<label class="tp-field">Weight <input id="tp-ca-weight" type="number" min="1" max="5" value="' + (s.weight || 3) + '" class="tp-num"></label>';
    html += '<div class="tp-attrs" id="tp-ca-attrs"></div>';
    html += '<button id="tp-ca-add-attr" class="btn btn-small">+ attr</button>';
    html += '<span id="tp-ca-count" class="tp-mode">0 nodes</span>';
    html += '<button id="tp-ca-connect" class="btn btn-accent" style="margin-left:8px">Connect</button>';
  }

  html += '<button id="tp-done" class="btn btn-small tp-done">Done</button>';
  content.innerHTML = html;

  // Render existing custom attrs
  renderToolAttrs(TOOL.name);

  bindToolPanelEvents();
}

function renderToolAttrs(toolName) {
  var s = TOOL.settings[toolName];
  var containerId = '';
  if (toolName === 'add-node') containerId = 'tp-a-attrs';
  else if (toolName === 'add-edge') containerId = 'tp-e-attrs';
  else if (toolName === 'set-node-attrs') containerId = 'tp-sn-attrs';
  else if (toolName === 'set-edge-attrs') containerId = 'tp-se-attrs';
  else if (toolName === 'connect-all') containerId = 'tp-ca-attrs';
  else return;

  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  var keys = Object.keys(s.attrs);
  keys.forEach(function(k) {
    var row = document.createElement('div');
    row.className = 'tp-attr-row';
    row.innerHTML =
      '<span class="tp-attr-key">' + escHtml(k) + '</span>' +
      '<input class="tp-attr-val" value="' + escHtml(String(s.attrs[k] || '')) + '" data-key="' + escAttr(k) + '">' +
      '<button class="attr-remove tp-attr-rm">&times;</button>';
    container.appendChild(row);
  });
}

function bindToolPanelEvents() {
  function addAttrRow(containerId, toolName) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'tp-attr-row tp-attr-new';

    var keyInput = el('input', { className: 'tp-attr-key-input', placeholder: 'key' });
    var valInput = el('input', { className: 'tp-attr-val', placeholder: 'value' });
    var rmBtn = el('button', { className: 'attr-remove tp-attr-rm', innerHTML: '&times;' });

    row.appendChild(keyInput);
    row.appendChild(valInput);
    row.appendChild(rmBtn);
    container.appendChild(row);
    keyInput.focus();

    function commit() {
      var k = keyInput.value.trim();
      var v = valInput.value.trim();
      if (k) {
        TOOL.settings[toolName].attrs[k] = isNumStr(v) ? Number(v) : v;
      }
      renderToolAttrs(toolName);
      bindToolPanelEvents();
    }

    keyInput.addEventListener('blur', function() {
      if (valInput.value.trim() || keyInput.value.trim()) {
        setTimeout(function() { if (document.activeElement !== valInput) commit(); }, 150);
      }
    });
    valInput.addEventListener('blur', function() { if (keyInput.value.trim()) commit(); else row.remove(); });
    keyInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') valInput.focus(); if (e.key === 'Escape') row.remove(); });
    valInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') commit(); if (e.key === 'Escape') row.remove(); });
    rmBtn.addEventListener('click', function() { row.remove(); });
  }

  // Done button
  var done = document.getElementById('tp-done');
  if (done) done.onclick = deactivateTool;

  // Attr value changes & remove
  document.querySelectorAll('.tp-attr-val').forEach(function(input) {
    input.addEventListener('change', function() {
      var k = this.getAttribute('data-key');
      var v = this.value.trim();
      TOOL.settings[TOOL.name].attrs[k] = isNumStr(v) ? Number(v) : v;
    });
    input.addEventListener('blur', function() {
      var k = this.getAttribute('data-key');
      var v = this.value.trim();
      TOOL.settings[TOOL.name].attrs[k] = isNumStr(v) ? Number(v) : v;
    });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') this.blur(); });
  });

  document.querySelectorAll('.tp-attr-rm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var row = this.parentElement;
      var keyEl = row.querySelector('.tp-attr-key');
      var keyInput = row.querySelector('.tp-attr-key-input');
      var k = keyEl ? keyEl.textContent : (keyInput ? keyInput.value.trim() : '');
      if (k) delete TOOL.settings[TOOL.name].attrs[k];
      renderToolAttrs(TOOL.name);
      bindToolPanelEvents();
    });
  });

  // Add attr buttons
  var addMap = {
    'tp-a-add-attr':  ['tp-a-attrs',  'add-node'],
    'tp-e-add-attr':  ['tp-e-attrs',  'add-edge'],
    'tp-sn-add-attr': ['tp-sn-attrs', 'set-node-attrs'],
    'tp-se-add-attr': ['tp-se-attrs', 'set-edge-attrs'],
    'tp-ca-add-attr': ['tp-ca-attrs', 'connect-all']
  };
  for (var id in addMap) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.onclick = (function(cid, tn) { return function() { addAttrRow(cid, tn); }; })(addMap[id][0], addMap[id][1]);
    }
  }

  // Selects and inputs
  if (TOOL.name === 'add-node') {
    var ng = document.getElementById('tp-node-group');
    if (ng) ng.onchange = function() { TOOL.settings['add-node'].group = this.value; };
  }
  if (TOOL.name === 'add-edge') {
    var et = document.getElementById('tp-e-type');
    var ew = document.getElementById('tp-e-weight');
    if (et) et.onchange = function() { TOOL.settings['add-edge'].type = this.value; };
    if (ew) ew.onchange = function() { TOOL.settings['add-edge'].weight = parseInt(this.value) || 1; };
  }
  if (TOOL.name === 'connect-all') {
    var ct = document.getElementById('tp-ca-type');
    var cw = document.getElementById('tp-ca-weight');
    if (ct) ct.onchange = function() { TOOL.settings['connect-all'].type = this.value; };
    if (cw) cw.onchange = function() { TOOL.settings['connect-all'].weight = parseInt(this.value) || 1; };
    var cc = document.getElementById('tp-ca-connect');
    if (cc) cc.onclick = executeConnectAll;
  }
}

function executeConnectAll() {
  if (!cy) return;
  var sel = TOOL.selectedNodes;
  if (sel.length < 2) {
    alert('Select at least 2 nodes');
    return;
  }

  pushUndo();

  var s = TOOL.settings['connect-all'];
  var type = s.type || 'colleague';
  var weight = s.weight || 3;
  var attrs = s.attrs || {};

  var created = 0;
  var skipped = 0;

  for (var i = 0; i < sel.length; i++) {
    for (var j = i + 1; j < sel.length; j++) {
      var idA = sel[i];
      var idB = sel[j];

      var existing = cy.edges().filter(function(e) {
        return (e.source().id() === idA && e.target().id() === idB) ||
               (e.source().id() === idB && e.target().id() === idA);
      });

      if (existing.length > 0) { skipped++; continue; }

      var data = { source: idA, target: idB, type: type, weight: weight };
      var keys = Object.keys(attrs);
      for (var k = 0; k < keys.length; k++) { var key = keys[k]; data[key] = attrs[key]; }
      cy.add({ group: 'edges', data: data });
      created++;
    }
  }

  cy.elements().removeClass('highlighted');
  TOOL.selectedNodes = [];
  var countEl = document.getElementById('tp-ca-count');
  if (countEl) countEl.textContent = '0 nodes';
  applyColorStyle();

  var msg = 'Created ' + created + ' edges.';
  if (skipped > 0) msg += ' Skipped ' + skipped + ' (already connected).';
  alert(msg);
}

function isNumStr(v) {
  var n = Number(v);
  return !isNaN(n) && String(n) === v;
}

// ===================== MARQUEE SELECTION OVERLAY =====================

function ensureMarqueeOverlay() {
  if (!_marqueeOverlay) {
    _marqueeOverlay = document.createElement('div');
    _marqueeOverlay.id = 'selection-overlay';
    document.body.appendChild(_marqueeOverlay);
  }
  return _marqueeOverlay;
}

function showMarqueeOverlay(x1, y1, x2, y2) {
  var el = ensureMarqueeOverlay();
  var l = Math.min(x1, x2);
  var t = Math.min(y1, y2);
  var w = Math.abs(x2 - x1);
  var h = Math.abs(y2 - y1);
  el.style.left = l + 'px';
  el.style.top = t + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.classList.add('active');
}

function hideMarqueeOverlay() {
  if (_marqueeOverlay) {
    _marqueeOverlay.classList.remove('active');
  }
}

function el(tag, attrs) {
  var e = document.createElement(tag);
  for (var k in attrs) {
    if (k === 'innerHTML') e.innerHTML = attrs[k];
    else e[k] = attrs[k];
  }
  return e;
}

// ===================== GEPHI CSV EXPORT =====================

function crc32(data) {
  var crc = 0xFFFFFFFF;
  for (var i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (var j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
  /* files: [{name:string, data:string}] — returns Uint8Array of the .zip */
  var enc = new TextEncoder();
  var localHeaders = [];
  var centralEntries = [];
  var totalLocalSize = 0;

  files.forEach(function(f) {
    var nBytes = enc.encode(f.name);
    var dBytes = enc.encode(f.data);
    var crc = crc32(dBytes);

    /* local file header: 30 + name + data */
    var local = new Uint8Array(30 + nBytes.length + dBytes.length);
    var v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);     /* signature */
    v.setUint16(4, 20, true);             /* version needed */
    v.setUint16(6, 0, true);              /* flags */
    v.setUint16(8, 0, true);              /* method = store */
    v.setUint32(14, crc, true);           /* crc32 */
    v.setUint32(18, dBytes.length, true); /* compressed size */
    v.setUint32(22, dBytes.length, true); /* uncompressed size */
    v.setUint16(26, nBytes.length, true); /* filename length */
    v.setUint16(28, 0, true);             /* extra field length */
    local.set(nBytes, 30);
    local.set(dBytes, 30 + nBytes.length);
    localHeaders.push({ bytes: local, offset: totalLocalSize });
    totalLocalSize += local.length;

    /* central directory entry: 46 + name */
    var cent = new Uint8Array(46 + nBytes.length);
    v = new DataView(cent.buffer);
    v.setUint32(0, 0x02014b50, true);     /* signature */
    v.setUint16(4, 20, true);             /* version made by */
    v.setUint16(6, 20, true);             /* version needed */
    v.setUint16(8, 0, true);              /* flags */
    v.setUint16(10, 0, true);             /* method = store */
    v.setUint32(16, crc, true);           /* crc32 */
    v.setUint32(20, dBytes.length, true); /* compressed size */
    v.setUint32(24, dBytes.length, true); /* uncompressed size */
    v.setUint16(28, nBytes.length, true); /* filename length */
    v.setUint16(30, 0, true);             /* extra field length */
    v.setUint16(32, 0, true);             /* file comment length */
    v.setUint16(34, 0, true);             /* disk number start */
    v.setUint16(36, 0, true);             /* internal attrs */
    v.setUint32(38, 0, true);             /* external attrs */
    v.setUint32(42, localHeaders[localHeaders.length-1].offset, true); /* local header offset */
    cent.set(nBytes, 46);
    centralEntries.push(cent);
  });

  var centralSize = centralEntries.reduce(function(s, c) { return s + c.length; }, 0);

  /* end of central directory: 22 bytes */
  var eocd = new Uint8Array(22);
  var ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);     /* signature */
  ev.setUint16(8, files.length, true);   /* total entries on this disk */
  ev.setUint16(10, files.length, true);  /* total entries */
  ev.setUint32(12, centralSize, true);   /* size of central directory */
  ev.setUint32(16, totalLocalSize, true);/* offset of central directory */
  ev.setUint16(20, 0, true);             /* comment length */

  /* concatenate */
  var total = totalLocalSize + centralSize + 22;
  var result = new Uint8Array(total);
  var pos = 0;
  localHeaders.forEach(function(lh) { result.set(lh.bytes, pos); pos += lh.bytes.length; });
  centralEntries.forEach(function(c) { result.set(c, pos); pos += c.length; });
  result.set(eocd, pos);
  return result;
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  var s = String(val);
  if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportGephiCSV() {
  if (!cy) return;
  if (cy.nodes().length === 0) { alert('Graph is empty.'); return; }

  /* collect extra attribute keys (exclude internal ones) */
  var extraNodeKeys = {};
  var extraEdgeKeys = {};
  cy.nodes().forEach(function(n) {
    Object.keys(n.data()).forEach(function(k) {
      if (k !== 'id' && k !== 'label' && k !== '_color' && k !== 'community' && n.data(k) !== undefined)
        extraNodeKeys[k] = true;
    });
  });
  cy.edges().forEach(function(e) {
    Object.keys(e.data()).forEach(function(k) {
      if (k !== 'source' && k !== 'target' && k !== 'type' && k !== 'weight' && e.data(k) !== undefined)
        extraEdgeKeys[k] = true;
    });
  });

  var sortedExtraNodes = Object.keys(extraNodeKeys).sort();
  var sortedExtraEdges = Object.keys(extraEdgeKeys).sort();

  /* --- nodes.csv --- */
  var nodeHeaders = ['Id', 'Label'].concat(sortedExtraNodes);
  var csvNodes = nodeHeaders.join(',') + '\n';
  cy.nodes().forEach(function(n) {
    var vals = nodeHeaders.map(function(f) {
      if (f === 'Id') return csvEscape(n.data('id'));
      if (f === 'Label') return csvEscape(n.data('label') || '');
      return csvEscape(n.data(f));
    });
    csvNodes += vals.join(',') + '\n';
  });

  /* --- edges.csv --- */
  var edgeHeaders = ['Source', 'Target', 'Type', 'Weight'].concat(sortedExtraEdges);
  var csvEdges = edgeHeaders.join(',') + '\n';
  cy.edges().forEach(function(e) {
    var vals = edgeHeaders.map(function(f) {
      if (f === 'Source') return csvEscape(e.data('source'));
      if (f === 'Target') return csvEscape(e.data('target'));
      if (f === 'Type') return csvEscape(e.data('type') || 'Undirected');
      if (f === 'Weight') return csvEscape(e.data('weight'));
      return csvEscape(e.data(f));
    });
    csvEdges += vals.join(',') + '\n';
  });

  /* build and download ZIP */
  var zipBytes = buildZip([
    { name: 'nodes.csv', data: csvNodes },
    { name: 'edges.csv', data: csvEdges }
  ]);
  var blob = new Blob([zipBytes], { type: 'application/zip' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'graph_gephi.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===================== COLOR =====================

var MANUAL_COLORS = {};
const VALUE_COLORS = {};

function colorFor(value, idx) {
  if (VALUE_COLORS[value]) return VALUE_COLORS[value];
  var p = VISUAL.colorPalette;
  var hue, sat, lig;

  // Base hue from golden angle for maximum perceptual spread
  hue = (idx * 137.508) % 360;

  // Warm and cool palettes override the hue range
  if (p === 'warm') {
    hue = 0 + (idx * 45) % 70;
  } else if (p === 'cool') {
    hue = 190 + (idx * 30) % 120;
  }

  // Vary saturation and lightness by cycling through modulo groups.
  // This gives colors a second dimension of distinction beyond hue,
  // so many values still look distinct.
  sat = 55 + (idx % 3) * 10;   // 55, 65, 75
  lig = 40 + (idx % 4) * 7;    // 40, 47, 54, 61

  // Palette modifiers
  if (p === 'pastel') { sat = Math.round(sat * 0.6); lig = Math.round(lig * 1.35); }
  else if (p === 'vibrant') { sat = Math.round(sat * 1.25); lig = Math.round(lig * 0.8); }

  // Clamp to valid ranges
  sat = Math.max(25, Math.min(85, sat));
  lig = Math.max(25, Math.min(72, lig));

  var c = 'hsl(' + hue + ', ' + sat + '%, ' + lig + '%)';
  VALUE_COLORS[value] = c;
  return c;
}

function resetColorCache() {
  for (const k of Object.keys(VALUE_COLORS)) delete VALUE_COLORS[k];
}

// ===================== NEIGHBORHOOD HIGHLIGHT =====================

function highlightNodeNeighborhood(node) {
  if (!cy) return;
  unhighlightNodeNeighborhood();
  if (TOOL.name) return;
  var edges = node.connectedEdges();
  edges.addClass('highlighted');
  var neighbors = node.neighborhood().nodes();
  neighbors.addClass('highlighted');
}

function unhighlightNodeNeighborhood() {
  if (!cy) return;
  cy.elements().removeClass('highlighted');
}

// ===================== IMPORT / EXPORT =====================

function validateData(data) {
  var errs = [];
  var tag;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errs.push('Root: expected a JSON object with "nodes" and "edges"');
    return errs;
  }
  if (!Array.isArray(data.nodes)) {
    errs.push('"nodes": must be an array');
    return errs;
  }
  if (!Array.isArray(data.edges)) {
    errs.push('"edges": must be an array');
    return errs;
  }

  var nodeIndex = {};
  var nodes = data.nodes;

  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    tag = 'Node[' + i + ']';
    if (!n || typeof n !== 'object') {
      errs.push(tag + ': not a valid object');
      continue;
    }
    if (n.id == null) {
      errs.push(tag + ': missing "id"');
      continue;
    }
    var nid = String(n.id);
    if (nid === '') {
      errs.push(tag + ': "id" is empty string');
      continue;
    }
    if (n.id !== '' && n.label === '') {
      errs.push(tag + ': "label" is empty string');
    }
    if (n.group === '') {
      errs.push(tag + ': "group" is empty string');
    }
    if (nid in nodeIndex) {
      errs.push(tag + ': duplicate id "' + nid + '" — already at Node[' + nodeIndex[nid] + ']');
    } else {
      nodeIndex[nid] = i;
    }
  }

  var edgeIdCounts = {};
  var edges = data.edges;

  for (var i = 0; i < edges.length; i++) {
    var e = edges[i];
    tag = 'Edge[' + i + ']';
    if (!e || typeof e !== 'object') {
      errs.push(tag + ': not a valid object');
      continue;
    }
    if (e.source == null) {
      errs.push(tag + ': missing "source"');
      continue;
    }
    if (e.target == null) {
      errs.push(tag + ': missing "target"');
      continue;
    }
    var src = String(e.source);
    var tgt = String(e.target);
    if (src === '') {
      errs.push(tag + ': "source" is empty string');
      continue;
    }
    if (tgt === '') {
      errs.push(tag + ': "target" is empty string');
      continue;
    }
    if (src === tgt) {
      if (!(src in nodeIndex)) {
        errs.push(tag + ': source/target "' + src + '" references a non-existent node');
      }
      errs.push(tag + ': source and target are the same node ("' + src + '")');
    } else {
      if (!(src in nodeIndex)) {
        errs.push(tag + ': source "' + src + '" references a non-existent node');
      }
      if (!(tgt in nodeIndex)) {
        errs.push(tag + ': target "' + tgt + '" references a non-existent node');
      }
    }
    if ('type' in e && e.type === '') {
      errs.push(tag + ': "type" is empty string');
    }
    if ('weight' in e) {
      var w = Number(e.weight);
      if (isNaN(w) || !isFinite(w)) {
        errs.push(tag + ': weight "' + e.weight + '" is not a valid number');
      } else if (w < 0) {
        errs.push(tag + ': weight ' + w + ' is negative');
      }
    }
    if (e.id != null) {
      var eid = String(e.id);
      edgeIdCounts[eid] = (edgeIdCounts[eid] || 0) + 1;
    }
  }

  for (var eid in edgeIdCounts) {
    if (edgeIdCounts[eid] > 1) {
      errs.push('Duplicate edge id "' + eid + '" (' + edgeIdCounts[eid] + ' occurrences)');
    }
  }

  return errs;
}

function importJSON(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var data;
    try {
      data = JSON.parse(e.target.result);
    } catch (err) {
      alert('Invalid JSON: ' + err.message);
      return;
    }
    var errors = validateData(data);
    if (errors.length > 0) {
      alert('JSON validation failed — ' + errors.length + ' issue(s):\n\n' + errors.join('\n'));
      return;
    }
    var elements = [];
    data.nodes.forEach(function(n) {
      var el = { group: 'nodes', data: {} };
      Object.keys(n).forEach(function(k) {
        if (k === 'position' && n[k] && typeof n[k].x === 'number') {
          el.position = n[k];
        } else if (k !== 'position') {
          el.data[k] = n[k];
        }
      });
      elements.push(el);
    });
    data.edges.forEach(function(e) {
      elements.push({ group: 'edges', data: e });
    });
    var hasPositions = data.nodes.some(function(n) { return n.position && typeof n.position.x === 'number'; });
    initGraph(elements, hasPositions);
    if (data._params) {
      setTimeout(function() { applyParams(data._params); }, 0);
    }
  };
  reader.readAsText(file);
}

function exportJSON() {
  if (!cy) return;
  var withPos = document.getElementById('chk-export-pos').checked;
  var withParams = document.getElementById('chk-export-params').checked;
  exportJSONGeneric(function(n) {
    var d = {};
    var keys = Object.keys(n.data());
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === 'community' || keys[i] === '_color') continue;
      var val = n.data(keys[i]);
      if (val === undefined) continue;
      d[keys[i]] = val;
    }
    if (withPos) {
      var pos = n.position();
      d.position = { x: Math.round(pos.x * 100) / 100, y: Math.round(pos.y * 100) / 100 };
    }
    return d;
  }, 'data.json', withParams);
}

function exportJSONGeneric(nodeMapper, filename, includeParams) {
  if (!cy) return;
  const nodes = cy.nodes().map(nodeMapper);
  const edges = cy.edges().map(function(e) {
    var d = {};
    var keys = Object.keys(e.data());
    for (var i = 0; i < keys.length; i++) {
      var val = e.data(keys[i]);
      if (val === undefined) continue;
      d[keys[i]] = val;
    }
    return d;
  });

  var output = { nodes: nodes, edges: edges };
  if (includeParams) {
    output._params = collectParams();
  }
  var json = JSON.stringify(output, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function collectParams() {
  return {
    visual: Object.assign({}, VISUAL),
    state: Object.assign({}, STATE, { communities: null }),
    manualColors: JSON.parse(JSON.stringify(MANUAL_COLORS))
  };
}

function applyParams(params) {
  if (!params || !cy) return;

  // Apply VISUAL
  if (params.visual) {
    Object.keys(params.visual).forEach(function(key) {
      VISUAL[key] = params.visual[key];
    });
    if (params.visual.fontBold !== undefined) {
      VISUAL.nodeFontBold = params.visual.fontBold;
      VISUAL.edgeFontBold = params.visual.fontBold;
    }
    if (params.visual.labelBackground !== undefined) {
      VISUAL.nodeLabelBg = params.visual.labelBackground;
      VISUAL.edgeLabelBg = params.visual.labelBackground;
    }
    if (params.visual.labelColor !== undefined) {
      VISUAL.nodeLabelColor = params.visual.labelColor;
      VISUAL.edgeLabelColor = params.visual.labelColor;
    }
  }

  // Apply STATE (skip communities — recalculated)
  if (params.state) {
    Object.keys(params.state).forEach(function(key) {
      if (key !== 'communities') STATE[key] = params.state[key];
    });
  }

  // Apply manual colors
  if (params.manualColors) {
    MANUAL_COLORS = JSON.parse(JSON.stringify(params.manualColors));
  }

  // Sync UI: sliders
  document.querySelectorAll('.vis-slider').forEach(function(slider) {
    var key = slider.getAttribute('data-key');
    if (key && VISUAL[key] !== undefined) {
      slider.value = VISUAL[key];
      var display = document.querySelector('.slider-val[data-key="' + key + '"]');
      if (display) display.textContent = VISUAL[key];
    }
  });

  // Sync UI: color pickers
  var pickers = [
    ['vis-node-label-color', 'nodeLabelColor'],
    ['vis-edge-label-color', 'edgeLabelColor'],
    ['vis-node-label-bg-color', 'nodeLabelBgColor'],
    ['vis-edge-label-bg-color', 'edgeLabelBgColor'],
    ['vis-border-color', 'nodeBorderColor'],
    ['vis-bg-color', 'bgColor']
  ];
  pickers.forEach(function(p) {
    var el = document.getElementById(p[0]);
    if (el && VISUAL[p[1]] !== undefined) el.value = VISUAL[p[1]];
  });

  // Sync UI: selects
  var selMap = {
    'label-attr': STATE.labelAttr,
    'color-mode': STATE.colorMode,
    'color-attr': STATE.colorAttr,
    'vis-palette': VISUAL.colorPalette,
    'vis-curve-style': VISUAL.curveStyle,
    'vis-curve-dist': VISUAL.curveEdgeDistances,
    'vis-font-family': VISUAL.fontFamily
  };
  Object.keys(selMap).forEach(function(id) {
    var el = document.getElementById(id);
    if (el && selMap[id] !== undefined) el.value = selMap[id];
  });

  // Sync UI: checkboxes
  var chkMap = {
    'toggle-manual-colors': STATE.useManualColors,
    'toggle-edge-arrows': VISUAL.edgeArrows,
    'toggle-node-labels': VISUAL.nodeLabels,
    'toggle-edge-labels': VISUAL.edgeLabels,
    'toggle-node-font-bold': VISUAL.nodeFontBold,
    'toggle-edge-font-bold': VISUAL.edgeFontBold,
    'toggle-node-label-bg': VISUAL.nodeLabelBg,
    'toggle-edge-label-bg': VISUAL.edgeLabelBg,
    'toggle-edge-weight': VISUAL.edgeWeightWidth
  };
  Object.keys(chkMap).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.checked = !!chkMap[id];
  });

  updateSpringPhysicsVisibility();

  // Apply to graph
  applyLabelStyle();
  renderManualColorPickers();
  applyColorStyle();
  cy.style().update();

  // Update label dropdown options to match loaded attribute
  populateDropdowns();
}

function injectEmojiFonts(svgStr) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(svgStr, 'image/svg+xml');
  var texts = doc.querySelectorAll('text');
  texts.forEach(function(text) {
    var existing = text.getAttribute('font-family');
    if (existing) {
      text.setAttribute('font-family', 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, ' + existing);
    } else {
      text.setAttribute('font-family', 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif');
    }
  });
  return new XMLSerializer().serializeToString(doc);
}

function exportSVG() {
  if (!cy) return;
  try {
    var svgStr = cy.svg({ full: true, bg: VISUAL.bgColor });
    svgStr = injectEmojiFonts(svgStr);
    if (!svgStr || svgStr.length < 50) throw new Error('Empty or invalid SVG');
    var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'graph.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    console.error('SVG export failed:', e);
    alert('SVG export failed: ' + e.message + '\n\nTry the PNG export instead.');
  }
}

function exportPDF() {
  if (!cy) return;
  try {
    var svgStr = cy.svg({ full: true, bg: VISUAL.bgColor });
    if (!svgStr || svgStr.length < 50) throw new Error('Empty or invalid SVG');
    svgStr = injectEmojiFonts(svgStr);
    var svgDoc = new DOMParser().parseFromString(svgStr, 'image/svg+xml');
    var svgEl = svgDoc.querySelector('svg');
    if (!svgEl) throw new Error('Failed to parse SVG. Ensure cytoscape-svg extension is loaded.');
    if (!svgEl.getAttribute('viewBox')) {
      var w = parseFloat(svgEl.getAttribute('width')) || 800;
      var h = parseFloat(svgEl.getAttribute('height')) || 600;
      svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    }
    var finalSvg = new XMLSerializer().serializeToString(svgDoc);
    var html = '<!DOCTYPE html><html><head><style>'
      + 'body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:white}'
      + 'svg{max-width:100%;max-height:100vh}</style></head><body>'
      + finalSvg
      + '<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script>'
      + '</body></html>';
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var w = window.open(url, '_blank');
    if (!w) alert('Popup blocked. Please allow popups for PDF export.');
  } catch(e) {
    console.error('PDF export failed:', e);
    alert('PDF export failed: ' + e.message);
  }
}

// ===================== GRAPH INIT =====================

function initGraph(data, skipAutoLayout) {
  if (cy) {
    cy.destroy();
    cy = null;
  }
  TOOL.edgeSource = null;

  document.getElementById('graph-empty').classList.add('hidden');
  document.getElementById('graph-loading').classList.remove('hidden');

  cy = cytoscape({
    container: document.getElementById('graph-cy'),
    elements: data,
    style: baseStyle(),
    layout: { name: 'preset' },
    minZoom: 0.15,
    maxZoom: 3,
  });

  // Register euler layout extension if loaded
  if (typeof cytoscapeEuler !== 'undefined') {
    try {
      cytoscapeEuler(cytoscape);
    } catch (e) {
      console.warn('Euler layout registration failed:', e);
    }
  }

  bindGraphEvents();
  populateDropdowns();
  applyLabelStyle();
  enableToolbar(true);

  function onLayoutStop() {
    document.getElementById('graph-loading').classList.add('hidden');
    applyColorStyle();
    renderManualColorPickers();
    var nodeToggle = document.getElementById('toggle-node-labels');
    var edgeToggle = document.getElementById('toggle-edge-labels');
    if (nodeToggle) {
      cy.style().selector('node').style('text-opacity', nodeToggle.checked ? 1 : 0).update();
    }
    if (edgeToggle) {
      cy.style().selector('edge').style('text-opacity', edgeToggle.checked ? 1 : 0).update();
    }
    if (!document.getElementById('toggle-node-colors').checked) {
      cy.nodes().forEach(function(n) { n.data('_color', null); });
      cy.style().update();
    }
  }

  cy.on('layoutstop', onLayoutStop);

  // Apply background color
  document.getElementById('graph-cy').style.backgroundColor = VISUAL.bgColor;

  if (skipAutoLayout) {
    // Preset layout already ran synchronously during cy() constructor, but
    // our onLayoutStop handler wasn't registered yet. Call it manually.
    onLayoutStop();
  } else {
    setTimeout(function() {
      applyLayout('cose', true);
    }, 100);
  }
}

function padLabel(label) {
  if (label && label.length === 1) return '\u00A0\u00A0' + label + '\u00A0\u00A0';
  return label;
}

function baseStyle() {
  return [
    {
      selector: 'node',
      style: {
        'label': function(ele) { return padLabel(ele.data(STATE.labelAttr) || ele.data('id')); },
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': function() { return VISUAL.labelSize + 'px'; },
        'font-family': function() { return VISUAL.fontFamily; },
        'font-weight': function() { return VISUAL.nodeFontBold ? 'bold' : 'normal'; },
        'color': function() { return VISUAL.nodeLabelColor; },
        'text-wrap': 'none',
        'text-background-color': function() { return VISUAL.nodeLabelBg ? VISUAL.nodeLabelBgColor : 'transparent'; },
        'text-background-opacity': function() { return VISUAL.nodeLabelBg ? 0.7 : 0; },
        'text-background-padding': function() { return VISUAL.nodeLabelBg ? '2px' : '0px'; },
        'background-color': function(ele) { return ele.data('_color') || '#334155'; },
        'width': function() { return VISUAL.nodeSize; },
        'height': function() { return VISUAL.nodeSize; },
        'border-width': function() { return VISUAL.nodeBorderWidth; },
        'border-color': function() { return VISUAL.nodeBorderColor; },
        'transition-property': 'background-color, border-color, border-width',
        'transition-duration': 200
      }
    },
    {
      selector: 'edge',
      style: {
        'width': function(ele) {
          if (VISUAL.edgeWeightWidth) {
            var w = ele.data('weight') || 1;
            return VISUAL.edgeWidth * (w / 3);
          }
          return VISUAL.edgeWidth;
        },
        'line-color': '#3a4a5f',
        'line-opacity': function() { return VISUAL.edgeOpacity; },
        'curve-style': function() { return VISUAL.curveStyle; },
        'control-point-step-size': function() { return VISUAL.curveStep; },
        'edge-distances': function() { return VISUAL.curveEdgeDistances; },
        'label': 'data(type)',
        'font-size': '9px',
        'font-family': function() { return VISUAL.fontFamily; },
        'font-weight': function() { return VISUAL.edgeFontBold ? 'bold' : 'normal'; },
        'color': function() { return VISUAL.edgeLabelColor; },
        'text-background-color': function() { return VISUAL.edgeLabelBg ? VISUAL.edgeLabelBgColor : 'transparent'; },
        'text-background-opacity': function() { return VISUAL.edgeLabelBg ? 0.85 : 0; },
        'text-background-padding': function() { return VISUAL.edgeLabelBg ? '2px' : '0px'; },
        'text-rotation': 'autorotate',
        'target-arrow-shape': function() { return VISUAL.edgeArrows ? 'triangle' : 'none'; },
        'target-arrow-color': '#3a4a5f'
      }
    },
    {
      selector: ':selected',
      style: {
        'border-color': '#f59e0b',
        'border-width': 3,
        'line-color': '#f59e0b'
      }
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#22c55e',
        'width': function() { return VISUAL.edgeWidth + 1.5; }
      }
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': '#22c55e',
        'border-width': 3
      }
    }
  ];
}

function enableToolbar(enabled) {
  var ids = ['btn-export', 'btn-export-gephi', 'btn-export-svg', 'btn-export-pdf',
             'btn-add-node', 'btn-add-edge',
             'label-attr', 'color-mode', 'color-attr',
             'btn-detect-communities', 'layout-select', 'btn-layout',
             'toggle-manual-colors', 'toggle-edge-arrows',
             'toggle-node-labels', 'toggle-edge-labels',
             'toggle-node-font-bold', 'toggle-edge-font-bold',
             'toggle-node-label-bg', 'toggle-edge-label-bg'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
  if (enabled) {
    updateSpringPhysicsVisibility();
  }
}

// ===================== GRAPH EVENTS =====================

function bindGraphEvents() {
  cy.on('tap', function(evt) {
    var target = evt.target;
    var isNode = target.isNode && target.isNode();
    var isEdge = target.isEdge && target.isEdge();

    // ---- ADD NODE TOOL ----
    if (TOOL.name === 'add-node') {
      if (target === cy) {
        var id = 'new_' + TOOL.nodeCounter;
        var label = 'New ' + TOOL.nodeCounter;
        TOOL.nodeCounter++;
        var s = TOOL.settings['add-node'];
        var data = { id: id, label: label, group: s.group };
        var keys = Object.keys(s.attrs);
        for (var i = 0; i < keys.length; i++) { var k = keys[i]; if (k !== 'id' && k !== 'label' && k !== '_color' && k !== 'community') data[k] = s.attrs[k]; }
        pushUndo();
        cy.add({ group: 'nodes', data: data, position: evt.position });
        applyLabelStyle();
        applyColorStyle();
        populateDropdowns();
      }
      return;
    }

    // ---- ADD EDGE TOOL ----
    if (TOOL.name === 'add-edge') {
      if (isNode) {
        if (!TOOL.edgeSource) {
          TOOL.edgeSource = target;
          target.style('border-color', '#22c55e');
          target.style('border-width', 3);
          updateToolCursor();
        } else if (target === TOOL.edgeSource) {
          TOOL.edgeSource.style('border-color', '#1e3a5f');
          TOOL.edgeSource.style('border-width', 2);
          TOOL.edgeSource = null;
          updateToolCursor();
        } else {
          var s = TOOL.settings['add-edge'];
          var data = { source: TOOL.edgeSource.id(), target: target.id(), type: s.type, weight: s.weight };
          var keys = Object.keys(s.attrs);
          for (var i = 0; i < keys.length; i++) { var k = keys[i]; if (k !== 'source' && k !== 'target') data[k] = s.attrs[k]; }
          pushUndo();
          cy.add({ group: 'edges', data: data });
          TOOL.edgeSource.style('border-color', '#1e3a5f');
          TOOL.edgeSource.style('border-width', 2);
          TOOL.edgeSource = null;
          updateToolCursor();
        }
      }
      return;
    }

    // ---- SET NODE ATTRS TOOL ----
    if (TOOL.name === 'set-node-attrs') {
      if (isNode) {
        var s = TOOL.settings['set-node-attrs'];
        var keys = Object.keys(s.attrs);
        pushUndo();
        for (var i = 0; i < keys.length; i++) { var k = keys[i]; if (k !== 'id' && k !== '_color' && k !== 'community') target.data(k, s.attrs[k]); }
        target.style('border-color', '#22c55e');
        setTimeout(function() { target.style('border-color', '#1e3a5f'); }, 250);
        applyLabelStyle();
        applyColorStyle();
        populateDropdowns();
      }
      return;
    }

    // ---- SET EDGE ATTRS TOOL ----
    if (TOOL.name === 'set-edge-attrs') {
      if (isEdge) {
        var s = TOOL.settings['set-edge-attrs'];
        var keys = Object.keys(s.attrs);
        pushUndo();
        for (var i = 0; i < keys.length; i++) { var k = keys[i]; if (k !== 'source' && k !== 'target') target.data(k, s.attrs[k]); }
        target.style('line-color', '#22c55e');
        setTimeout(function() { target.style('line-color', '#3a4a5f'); }, 250);
      }
      return;
    }

    // ---- CONNECT ALL TOOL ----
    if (TOOL.name === 'connect-all') {
      if (isNode) {
        var idx = TOOL.selectedNodes.indexOf(target.id());
        if (idx >= 0) {
          TOOL.selectedNodes.splice(idx, 1);
          target.removeClass('highlighted');
        } else {
          TOOL.selectedNodes.push(target.id());
          target.addClass('highlighted');
        }
        var countEl = document.getElementById('tp-ca-count');
        if (countEl) countEl.textContent = TOOL.selectedNodes.length + ' nodes';
      }
      return;
    }

    // ---- SELECT BOX TOOL ----
    if (TOOL.name === 'select-box') {
      if (_marqueeActive) return; // Suppress tap after marquee drag
      if (target === cy) {
        deselectElement();
      } else if (isNode) {
        // Toggle selection and update sidebar
        if (target.selected()) {
          target.unselect();
          if (cy.$(':selected').length === 0) deselectElement();
        } else {
          target.select();
          selectElement(target);
        }
      } else if (isEdge) {
        target.select();
        selectElement(target);
      }
      return;
    }

    // ---- DEFAULT MODE (Select) ----
    if (TOOL.name === null) {
      if (target === cy) {
        deselectElement();
      } else {
        selectElement(target);
      }
    }
  });

  cy.on('mouseover', 'node, edge', function() {
    if (!TOOL.name) document.body.style.cursor = 'pointer';
  });

  cy.on('mouseout', 'node, edge', function() {
    if (!TOOL.name) document.body.style.cursor = '';
  });
}

// ===================== LAYOUT =====================

function applyLayout(name, showSpinner, live) {
  if (!cy) return;
  if (showSpinner) {
    document.getElementById('graph-loading').classList.remove('hidden');
  }
  var opts = {
    name: name,
    animate: live ? false : true,
    animationDuration: 600,
    animationEasing: 'ease-in-out-cubic'
  };
  if (name === 'cose') {
    opts.randomize = live ? false : true;
    opts.nodeRepulsion = VISUAL.repulsion;
    opts.idealEdgeLength = VISUAL.idealEdgeLength;
  }
  if (name === 'organic-deep') {
    opts.name = 'cose';
    opts.randomize = live ? false : true;
    opts.nodeRepulsion = VISUAL.repulsion || 12000;
    opts.idealEdgeLength = VISUAL.idealEdgeLength || 100;
    opts.gravity = 0.08;
    opts.gravityRange = 2.5;
    opts.numIter = 3000;
    opts.coolingFactor = 0.995;
    opts.initialTemp = 250;
    opts.minTemp = 0.5;
  }
  if (name === 'euler') {
    opts.springLength = VISUAL.idealEdgeLength || 120;
    opts.springCoeff = VISUAL.springCoeff || 0.0004;
    opts.mass = function() { return VISUAL.springMass || 8; };
    // Map repulsion slider (1000-50000) to gravity (-0.55 to -3.0)
    opts.gravity = -0.5 - (VISUAL.repulsion / 50000) * 2.5;
    opts.pull = 0.0008;
    opts.dragCoeff = VISUAL.springDamping || 0.1;
    opts.timeStep = 12;
    opts.refresh = 25;
    opts.fit = live ? false : true;
    opts.padding = 30;
    opts.maxSimulationTime = live ? 1000 : 10000;
  }
  if (name === 'concentric') {
    opts.concentric = function(node) {
      return node.data('group') === 'self' ? 2 : 1;
    };
    opts.minNodeSpacing = 40;
  }
  if (name === 'breadthfirst') {
    opts.directed = false;
    opts.spacingFactor = 1.25;
  }
  if (name === 'grid') {
    opts.rows = undefined;
  }
  try {
    cy.layout(opts).run();
  } catch (e) {
    if (showSpinner) {
      document.getElementById('graph-loading').classList.add('hidden');
    }
  }
}

function updateSpringPhysicsVisibility() {
  var algoSelect = document.getElementById('layout-select');
  if (!algoSelect) return;
  var name = algoSelect.value;
  var springPhysics = document.getElementById('spring-physics-section');
  var springSep = document.getElementById('spring-physics-sep');
  if (springPhysics && springSep) {
    if (name === 'euler') {
      springPhysics.classList.remove('hidden');
      springSep.classList.remove('hidden');
    } else {
      springPhysics.classList.add('hidden');
      springSep.classList.add('hidden');
    }
  }
}

// ===================== STYLE APPLICATION =====================

function applyLabelStyle() {
  if (!cy) return;
  cy.style()
    .selector('node')
    .style('label', function(ele) {
      return ele.data(STATE.labelAttr) || ele.data('id');
    })
    .update();
}

function applyColorStyle() {
  if (!cy) return;
  resetColorCache();

  if (STATE.colorMode === 'community' && STATE.communities) {
    var nodes = cy.nodes();
    var commSet = {};
    var commList = [];
    nodes.forEach(function(n) {
      var c = STATE.communities[n.id()];
      if (c === undefined) c = -1;
      if (!(c in commSet)) { commSet[c] = commList.length; commList.push(c); }
    });
    var manualComm = STATE.useManualColors ? (MANUAL_COLORS['_community'] || {}) : null;
    nodes.forEach(function(n) {
      var c = STATE.communities[n.id()];
      if (c === undefined) c = -1;
      var idx = commSet[c];
      if (manualComm && manualComm[c] !== undefined) {
        n.data('_color', manualComm[c]);
      } else {
        n.data('_color', colorFor('comm:' + c, idx));
      }
    });
  } else {
    var nodes = cy.nodes();
    var sortVals = [];
    var valIdx = {};
    nodes.forEach(function(n) {
      var v = String(n.data(STATE.colorAttr) || '');
      if (!(v in valIdx)) { valIdx[v] = sortVals.length; sortVals.push(v); }
    });
    var manualAttr = STATE.useManualColors ? (MANUAL_COLORS[STATE.colorAttr] || {}) : null;
    nodes.forEach(function(n) {
      var v = String(n.data(STATE.colorAttr) || '');
      if (manualAttr && manualAttr[v]) {
        n.data('_color', manualAttr[v]);
      } else {
        n.data('_color', colorFor(v, valIdx[v]));
      }
    });
  }
  cy.style().update();
}

function getUniqueValues(attr) {
  var vals = {};
  cy.nodes().forEach(function(n) {
    var v = String(n.data(attr) || '');
    if (v) vals[v] = true;
  });
  return Object.keys(vals).sort();
}

function renderManualColorPickers() {
  var container = document.getElementById('manual-color-list');
  if (!container || !cy) return;
  if (!STATE.useManualColors) {
    container.innerHTML = '';
    return;
  }
  if (STATE.colorMode !== 'attribute' && STATE.colorMode !== 'community') {
    container.innerHTML = '';
    return;
  }

  var values = [];
  var key = '';
  if (STATE.colorMode === 'community') {
    if (!STATE.communities) {
      container.innerHTML = '';
      return;
    }
    key = '_community';
    var comms = {};
    cy.nodes().forEach(function(n) {
      var c = STATE.communities[n.id()];
      if (c === undefined) c = -1;
      comms[c] = true;
    });
    values = Object.keys(comms).sort(function(a, b) {
      return parseInt(a) - parseInt(b);
    });
  } else {
    key = STATE.colorAttr;
    values = getUniqueValues(key);
  }

  if (!MANUAL_COLORS[key]) MANUAL_COLORS[key] = {};
  var manual = MANUAL_COLORS[key];
  resetColorCache();

  var valIdx = {};
  if (STATE.colorMode === 'community') {
    var commSet = {};
    var commList = [];
    cy.nodes().forEach(function(n) {
      var c = STATE.communities[n.id()];
      if (c === undefined) c = -1;
      if (!(c in commSet)) { commSet[c] = commList.length; commList.push(c); }
    });
    values.forEach(function(v) {
      valIdx[v] = commSet[v];
    });
  } else {
    values.forEach(function(v, i) { valIdx[v] = i; });
  }

  var html = '';
  values.forEach(function(v) {
    var autoColor = '';
    var labelText = '';
    if (STATE.colorMode === 'community') {
      autoColor = colorFor('comm:' + v, valIdx[v]);
      labelText = v == -1 ? "No Community" : "Community " + v;
    } else {
      autoColor = colorFor(v, valIdx[v]);
      labelText = v;
    }
    var currentColor = manual[v] || autoColor;
    if (currentColor.startsWith('hsl(')) currentColor = '#cccccc';
    var safeVal = String(v).replace(/"/g,'&quot;').replace(/</g,'&lt;');
    var safeLabel = String(labelText).replace(/"/g,'&quot;').replace(/</g,'&lt;');
    html += '<div class="mc-row"><label title="' + safeLabel + '">' + safeLabel + '</label><input type="color" class="mc-picker" data-value="' + safeVal + '" value="' + currentColor + '"></div>';
  });
  container.innerHTML = html;

  container.querySelectorAll('.mc-picker').forEach(function(picker) {
    picker.addEventListener('input', function() {
      var val = this.getAttribute('data-value');
      if (!MANUAL_COLORS[key]) MANUAL_COLORS[key] = {};
      MANUAL_COLORS[key][val] = this.value;
      applyColorStyle();
    });
  });
}

function populateDropdowns() {
  if (!cy) return;

  var attrKeys = {};
  cy.nodes().forEach(function(n) {
    var keys = Object.keys(n.data());
    keys.forEach(function(k) { if (k !== 'id' && k !== '_color' && n.data(k) !== undefined) attrKeys[k] = true; });
  });
  var sorted = Object.keys(attrKeys).sort();

  // Label dropdown
  var lbl = document.getElementById('label-attr');
  lbl.innerHTML = '';
  sorted.forEach(function(k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = k;
    lbl.appendChild(o);
  });
  if (attrKeys[STATE.labelAttr]) lbl.value = STATE.labelAttr;
  else if (sorted.length > 0) lbl.value = sorted[0];

  // Color attribute dropdown
  var col = document.getElementById('color-attr');
  col.innerHTML = '';
  sorted.forEach(function(k) {
    var o = document.createElement('option');
    o.value = k;
    o.textContent = k;
    col.appendChild(o);
  });
  if (attrKeys[STATE.colorAttr]) col.value = STATE.colorAttr;
  else if (sorted.length > 0) col.value = sorted[0];
}

// ===================== COMMUNITY DETECTION =====================

function detectCommunities() {
  if (!cy) return;

  var nodes = cy.nodes();
  var n = nodes.length;
  if (n === 0) return;

  var nodeIdx = {};
  nodes.forEach(function(node, i) { nodeIdx[node.id()] = i; });

  var degree = new Array(n).fill(0);
  var adj = {};
  var totalWeight = 0;

  cy.edges().forEach(function(edge) {
    var si = nodeIdx[edge.source().id()];
    var ti = nodeIdx[edge.target().id()];
    var w = edge.data('weight') || 1;
    degree[si] += w;
    degree[ti] += w;
    var key = si < ti ? si + '-' + ti : ti + '-' + si;
    adj[key] = (adj[key] || 0) + w;
    totalWeight += w;
  });

  if (totalWeight === 0) {
    STATE.communities = {};
    nodes.forEach(function(n) { STATE.communities[n.id()] = 0; });
    return;
  }

  var communities = [];
  for (var i = 0; i < n; i++) communities.push(i);

  function modularity(comms) {
    var Q = 0;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        if (comms[i] === comms[j]) {
          var key = i < j ? i + '-' + j : j + '-' + i;
          var Aij = (i === j) ? 0 : (adj[key] || 0);
          var expected = (degree[i] * degree[j]) / (2 * totalWeight);
          Q += Aij - expected;
        }
      }
    }
    return Q / (2 * totalWeight);
  }

  var improved = true;
  var iter = 0;
  var maxIter = 80;

  while (improved && iter < maxIter) {
    improved = false;
    iter++;

    for (var i = 0; i < n; i++) {
      var origComm = communities[i];

      var neighComms = {};
      for (var key in adj) {
        var parts = key.split('-');
        var a = +parts[0], b = +parts[1];
        if (adj[key] > 0) {
          if (a === i) neighComms[communities[b]] = true;
          if (b === i) neighComms[communities[a]] = true;
        }
      }

      var bestComm = origComm;
      var bestQ = -Infinity;

      for (var cStr in neighComms) {
        var c = +cStr;
        if (c === origComm) continue;
        var newComms = communities.slice();
        newComms[i] = c;
        var q = modularity(newComms);
        if (q > bestQ) { bestQ = q; bestComm = c; }
      }

      var maxC = -1;
      for (var j = 0; j < n; j++) { if (communities[j] > maxC) maxC = communities[j]; }
      var newComms = communities.slice();
      newComms[i] = maxC + 1;
      var q = modularity(newComms);
      if (q > bestQ) { bestQ = q; bestComm = maxC + 1; }

      if (bestComm !== origComm) {
        communities[i] = bestComm;
        improved = true;
      }
    }
  }

  var uniq = [];
  var seen = {};
  for (var j = 0; j < n; j++) {
    if (!(communities[j] in seen)) { seen[communities[j]] = uniq.length; uniq.push(communities[j]); }
  }
  var remap = {};
  uniq.forEach(function(c, idx) { remap[c] = idx; });

  STATE.communities = {};
  nodes.forEach(function(node, i) {
    var comm = remap[communities[i]];
    node.data('community', comm);
    STATE.communities[node.id()] = comm;
  });

  console.log('Detected ' + uniq.length + ' communities');

  STATE.colorMode = 'community';
  document.getElementById('color-mode').value = 'community';
  document.getElementById('color-attr').disabled = true;
  applyColorStyle();
  renderManualColorPickers();
}

// ===================== SELECTION / SIDEBAR =====================

function selectElement(ele) {
  unhighlightNodeNeighborhood(); // clear previous highlight
  selectedElement = ele;
  renderSidebar(ele);
  if (ele.isNode()) {
    highlightNodeNeighborhood(ele);
  }
}

function deselectElement() {
  selectedElement = null;
  cy.elements().unselect();
  showEmptySidebar();
  unhighlightNodeNeighborhood();
}

function showEmptySidebar() {
  document.getElementById('sidebar-empty').classList.remove('hidden');
  document.getElementById('sidebar-content').classList.add('hidden');
}

function renderSidebar(ele) {
  document.getElementById('sidebar-empty').classList.add('hidden');
  document.getElementById('sidebar-content').classList.remove('hidden');

  var isNode = ele.isNode();
  var title = document.getElementById('sidebar-title');
  var container = document.getElementById('attrs-container');

  if (isNode) {
    title.textContent = 'Node: ' + (ele.data('label') || ele.id());
  } else {
    title.textContent = 'Edge: ' + (ele.data('type') || ele.source().id() + ' \u2192 ' + ele.target().id());
  }

  container.innerHTML = '';
  var data = ele.data();
  var keys = Object.keys(data);

  // Sort: id/source/target first, then alpha
  keys.sort(function(a, b) {
    if (a === 'id') return -3;
    if (a === 'source') return -2;
    if (a === 'target') return -1;
    if (b === 'id' || b === 'source' || b === 'target') return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  keys.forEach(function(key) {
    var value = data[key];
    if (key === 'community' || key === '_color') return;
    if (value === undefined) return;

    var isMandatory = (isNode && (key === 'id' || key === 'label' || key === 'group')) ||
                      (!isNode && (key === 'source' || key === 'target' || key === 'type'));

    var row = document.createElement('div');
    row.className = 'attr-row';

    var keySpan = document.createElement('span');
    keySpan.className = 'attr-key';
    keySpan.textContent = key;
    row.appendChild(keySpan);

    var valInput = document.createElement('input');
    valInput.className = 'attr-value';
    valInput.value = (value !== undefined && value !== null) ? String(value) : '';
    valInput.setAttribute('data-key', key);
    valInput.setAttribute('data-original', valInput.value);
    row.appendChild(valInput);

    var rmBtn = null;
    if (!isMandatory) {
      rmBtn = document.createElement('button');
      rmBtn.className = 'attr-remove';
      rmBtn.innerHTML = '&times;';
      rmBtn.title = 'Remove attribute';
      row.appendChild(rmBtn);
    }

    container.appendChild(row);

    // Blur to save
    valInput.addEventListener('blur', function() {
      var newVal = this.value.trim();
      if (newVal !== this.getAttribute('data-original')) {
        updateAttribute(ele, key, newVal);
        this.setAttribute('data-original', newVal);
      }
    });

    valInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') this.blur();
    });

    if (rmBtn) {
      rmBtn.addEventListener('click', function() {
        pushUndo();
        removeAttribute(ele, key);
        renderSidebar(ele);
      });
    }
  });

  // Delete button
  document.getElementById('btn-delete').onclick = function() {
    var label = isNode ? (ele.data('label') || ele.id()) : (ele.data('type') || 'edge');
    if (confirm('Delete ' + label + '?')) {
      pushUndo();
      cy.remove(ele);
      showEmptySidebar();
      populateDropdowns();
      document.body.style.cursor = '';
    }
  };

  // Add attribute button
  document.getElementById('btn-add-attr').onclick = function() {
    addNewAttributeRow(ele, container);
  };

  // Connections section (node only)
  renderNodeConnections(ele);
}

function renderNodeConnections(ele) {
  if (!ele.isNode()) {
    document.getElementById('sidebar-connections').classList.add('hidden');
    return;
  }
  var cont = document.getElementById('sidebar-connections');
  cont.classList.remove('hidden');
  var list = document.getElementById('sidebar-conn-list');
  list.innerHTML = '';

  var edges = ele.connectedEdges();
  if (edges.length === 0) {
    list.innerHTML = '<div class="conn-empty">No connections</div>';
    return;
  }

  edges.forEach(function(edge) {
    var other = edge.source().id() === ele.id() ? edge.target() : edge.source();
    var row = document.createElement('div');
    row.className = 'conn-row';
    row.setAttribute('data-edge-id', edge.id());

    var arrow = document.createElement('span');
    arrow.className = 'conn-arrow';
    var isOut = edge.source().id() === ele.id();
    arrow.textContent = isOut ? '\u2192' : '\u2190';
    row.appendChild(arrow);

    var label = document.createElement('span');
    label.className = 'conn-label';
    label.textContent = other.data('label') || other.id();
    row.appendChild(label);

    var type = document.createElement('span');
    type.className = 'conn-type';
    type.textContent = edge.data('type') || '';
    row.appendChild(type);

    var weight = document.createElement('span');
    weight.className = 'conn-weight';
    weight.textContent = edge.data('weight') ? 'w:' + edge.data('weight') : '';
    row.appendChild(weight);

    row.addEventListener('click', function() {
      cy.elements().unselect();
      edge.select();
      selectElement(edge);
    });

    list.appendChild(row);
  });
}

function addNewAttributeRow(ele, container) {
  var row = document.createElement('div');
  row.className = 'attr-row';

  var keyInput = document.createElement('input');
  keyInput.className = 'attr-new-key';
  keyInput.placeholder = 'key';
  row.appendChild(keyInput);

  var valInput = document.createElement('input');
  valInput.className = 'attr-value';
  valInput.placeholder = 'value';
  row.appendChild(valInput);

  var rmBtn = document.createElement('button');
  rmBtn.className = 'attr-remove';
  rmBtn.innerHTML = '&times;';
  row.appendChild(rmBtn);

  container.appendChild(row);
  keyInput.focus();

  function saveNew() {
    var k = keyInput.value.trim();
    var v = valInput.value.trim();
    if (k) {
      updateAttribute(ele, k, v);
      renderSidebar(ele);
      populateDropdowns();
    } else {
      row.remove();
    }
  }

  keyInput.addEventListener('blur', function() {
    if (valInput.value.trim() || keyInput.value.trim()) {
      setTimeout(function() {
        if (document.activeElement !== valInput) saveNew();
      }, 150);
    }
  });

  valInput.addEventListener('blur', function() {
    if (keyInput.value.trim()) saveNew();
    else row.remove();
  });

  keyInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') valInput.focus();
    if (e.key === 'Escape') row.remove();
  });

  valInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveNew();
    if (e.key === 'Escape') row.remove();
  });

  rmBtn.addEventListener('click', function() { row.remove(); });
}

function updateAttribute(ele, key, value) {
  pushUndo();
  var isNode = ele.isNode();
  var mandatory = (isNode && (key === 'id' || key === 'label' || key === 'group')) ||
                  (!isNode && (key === 'source' || key === 'target' || key === 'type'));
  if (value === '' || value === null) {
    if (mandatory) return;
    removeAttribute(ele, key);
    return;
  }

  if ((key === 'source' || key === 'target') && !isNode) {
    var exists = cy.nodes().filter(function(n) { return String(n.id()) === String(value); });
    if (exists.length === 0) {
      alert('No node with ID "' + value + '" exists.');
      return;
    }
    ele.data(key, value);
    return;
  }

  if (key === 'id' && isNode) {
    var oldId = ele.id();
    var newVal = value;
    var num = Number(newVal);
    if (!isNaN(num) && String(num) === newVal && newVal !== '') newVal = num;
    var conflict = cy.nodes().filter(function(n) {
      return n.id() !== oldId && String(n.id()) === String(newVal);
    });
    if (conflict.length > 0) {
      alert('A node with ID "' + newVal + '" already exists.');
      return;
    }
    ele.data('id', newVal);
    cy.edges().filter(function(e) {
      return e.data('source') === oldId || e.data('target') === oldId;
    }).forEach(function(e) {
      if (e.data('source') === oldId) e.data('source', newVal);
      if (e.data('target') === oldId) e.data('target', newVal);
    });
    applyLabelStyle();
    applyColorStyle();
    populateDropdowns();
    renderSidebar(ele);
    return;
  }

  var num = Number(value);
  if (!isNaN(num) && String(num) === value && value !== '') {
    ele.data(key, num);
  } else {
    ele.data(key, value);
  }
  if (ele.isNode()) {
    applyLabelStyle();
    applyColorStyle();
    populateDropdowns();
    renderSidebar(ele);
  }
}

function removeAttribute(ele, key) {
  ele.data(key, undefined);
  if (ele.isNode()) {
    applyLabelStyle();
    applyColorStyle();
    populateDropdowns();
  }
}

// ===================== MODAL =====================

function showModal(title, bodyHTML, onSave) {
  var overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  overlay.classList.remove('hidden');

  function close() {
    overlay.classList.add('hidden');
    document.removeEventListener('keydown', escHandler);
  }

  document.getElementById('modal-close').onclick = close;
  document.getElementById('modal-cancel').onclick = close;

  document.getElementById('modal-save').onclick = function() {
    var result = onSave();
    if (result !== false) close();
  };

  overlay.onclick = function(e) {
    if (e.target === overlay) close();
  };

  function escHandler(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', escHandler);
}

function showAddNodeModal() {
  var nodeIds = {};
  cy.nodes().forEach(function(n) { nodeIds[n.id()] = true; });

  var html = '' +
    '<div class="form-group">' +
      '<label>ID <span style="color:var(--text-muted);text-transform:none">(unique)</span></label>' +
      '<input id="mn-id" type="text" placeholder="e.g. paul" autofocus>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label>Label</label>' +
        '<input id="mn-label" type="text" placeholder="e.g. Paul Smith">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Group</label>' +
        '<select id="mn-group">' +
          '<option value="work">Work</option>' +
          '<option value="family">Family</option>' +
          '<option value="friends">Friends</option>' +
          '<option value="other">Other</option>' +
        '</select>' +
      '</div>' +
    '</div>' +
    '<div class="attrs-section">' +
      '<h4>Custom Attributes</h4>' +
      '<div id="mn-attrs"></div>' +
      '<button id="mn-add-attr" class="btn btn-small" style="margin-top:8px">+ Add</button>' +
    '</div>';

  showModal('Add Node', html, function() {
    var id = document.getElementById('mn-id').value.trim();
    var label = document.getElementById('mn-label').value.trim();
    var group = document.getElementById('mn-group').value;

    if (!id) { alert('ID is required'); return false; }
    if (nodeIds[id]) { alert('ID must be unique'); return false; }

    var attrs = {};
    var rows = document.querySelectorAll('#mn-attrs .modal-attr-row');
    rows.forEach(function(row) {
      var k = row.querySelector('.matr-key').value.trim();
      var v = row.querySelector('.matr-val').value.trim();
      if (k) attrs[k] = v;
    });

    pushUndo();
    cy.add({
      group: 'nodes',
      data: Object.assign({ id: id, label: label || id, group: group }, attrs)
    });
    applyLabelStyle();
    applyColorStyle();
    populateDropdowns();
    return true;
  });

  document.getElementById('mn-add-attr').onclick = function() {
    var container = document.getElementById('mn-attrs');
    var row = document.createElement('div');
    row.className = 'attr-row modal-attr-row';
    row.innerHTML = '<input class="matr-key" placeholder="key" style="flex:0 0 90px;min-width:0;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input);color:var(--text);font-size:12px;font-family:var(--font);outline:none">' +
      '<input class="matr-val" placeholder="value" style="flex:1;min-width:0;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input);color:var(--text);font-size:12px;font-family:var(--font);outline:none">' +
      '<button class="attr-remove" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(row);
  };

  document.getElementById('mn-id').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('modal-save').click();
  });
}

function showAddEdgeModal() {
  var nodes = cy.nodes();
  if (nodes.length < 2) {
    alert('Need at least 2 nodes to create an edge');
    return;
  }

  var opts = '';
  nodes.forEach(function(n) {
    opts += '<option value="' + escAttr(n.id()) + '">' + escHtml(n.data('label') || n.id()) + '</option>';
  });

  var html = '' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label>Source</label>' +
        '<select id="me-source">' + opts + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Target</label>' +
        '<select id="me-target">' + opts + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group">' +
        '<label>Type</label>' +
        '<select id="me-type">' +
          '<option value="colleague">Colleague</option>' +
          '<option value="friend">Friend</option>' +
          '<option value="collaborator">Collaborator</option>' +
          '<option value="spouse">Spouse</option>' +
          '<option value="sibling">Sibling</option>' +
          '<option value="parent">Parent</option>' +
          '<option value="family">Family</option>' +
          '<option value="family-in-law">Family-in-law</option>' +
          '<option value="mentor">Mentor</option>' +
          '<option value="other">Other</option>' +
        '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Weight (1-5)</label>' +
        '<input id="me-weight" type="number" min="1" max="5" value="3">' +
      '</div>' +
    '</div>' +
    '<div class="attrs-section">' +
      '<h4>Custom Attributes</h4>' +
      '<div id="me-attrs"></div>' +
      '<button id="me-add-attr" class="btn btn-small" style="margin-top:8px">+ Add</button>' +
    '</div>';

  showModal('Add Edge', html, function() {
    var source = document.getElementById('me-source').value;
    var target = document.getElementById('me-target').value;
    var type = document.getElementById('me-type').value;
    var weight = parseInt(document.getElementById('me-weight').value) || 1;

    if (!source || !target) { alert('Source and Target are required'); return false; }
    if (source === target) { alert('Source and Target must be different'); return false; }

    var existing = cy.edges().filter(function(e) {
      return (e.source().id() === source && e.target().id() === target) ||
             (e.source().id() === target && e.target().id() === source);
    });
    if (existing.length > 0) {
      if (!confirm('An edge already exists between these nodes. Add another?')) return false;
    }

    var attrs = {};
    var rows = document.querySelectorAll('#me-attrs .modal-attr-row');
    rows.forEach(function(row) {
      var k = row.querySelector('.matr-key').value.trim();
      var v = row.querySelector('.matr-val').value.trim();
      if (k) attrs[k] = v;
    });

    pushUndo();
    cy.add({
      group: 'edges',
      data: Object.assign({ source: source, target: target, type: type, weight: weight }, attrs)
    });
    applyColorStyle();
    return true;
  });

  document.getElementById('me-add-attr').onclick = function() {
    var container = document.getElementById('me-attrs');
    var row = document.createElement('div');
    row.className = 'attr-row modal-attr-row';
    row.innerHTML = '<input class="matr-key" placeholder="key" style="flex:0 0 90px;min-width:0;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input);color:var(--text);font-size:12px;font-family:var(--font);outline:none">' +
      '<input class="matr-val" placeholder="value" style="flex:1;min-width:0;padding:5px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-input);color:var(--text);font-size:12px;font-family:var(--font);outline:none">' +
      '<button class="attr-remove" onclick="this.parentElement.remove()">&times;</button>';
    container.appendChild(row);
  };
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ===================== INIT =====================

function init() {
  // Import
  document.getElementById('btn-import').addEventListener('click', function() {
    document.getElementById('file-input').click();
  });
  document.getElementById('btn-import-big').addEventListener('click', function() {
    document.getElementById('file-input').click();
  });
  document.getElementById('btn-scratch').addEventListener('click', function() {
    undoStack = [];
    updateUndoButton();
    initGraph([], true);
  });
  document.getElementById('btn-random-graph').addEventListener('click', showRandomGraphModal);
  document.getElementById('file-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      importJSON(e.target.files[0]);
    }
    this.value = '';
  });

  // Export
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-export-gephi').addEventListener('click', exportGephiCSV);
  document.getElementById('btn-export-svg').addEventListener('click', exportSVG);
  document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);

  // Undo
  document.getElementById('btn-undo').addEventListener('click', performUndo);

  // Add Node / Edge
  document.getElementById('btn-add-node').addEventListener('click', showAddNodeModal);
  document.getElementById('btn-add-edge').addEventListener('click', showAddEdgeModal);

  // Label attribute
  document.getElementById('label-attr').addEventListener('change', function(e) {
    STATE.labelAttr = e.target.value;
    applyLabelStyle();
  });

  // Color mode
  document.getElementById('color-mode').addEventListener('change', function(e) {
    STATE.colorMode = e.target.value;
    document.getElementById('color-attr').disabled = (STATE.colorMode === 'community');
    applyColorStyle();
    renderManualColorPickers();
  });

  // Color attribute
  document.getElementById('color-attr').addEventListener('change', function(e) {
    STATE.colorAttr = e.target.value;
    STATE.colorMode = 'attribute';
    document.getElementById('color-mode').value = 'attribute';
    document.getElementById('color-attr').disabled = false;
    applyColorStyle();
    renderManualColorPickers();
  });

  // Detect communities
  document.getElementById('btn-detect-communities').addEventListener('click', detectCommunities);

  // Layout
  document.getElementById('btn-layout').addEventListener('click', function() {
    applyLayout(document.getElementById('layout-select').value);
  });

  document.getElementById('layout-select').addEventListener('change', function() {
    updateSpringPhysicsVisibility();
  });

  // Tool buttons
  document.getElementById('tool-add-node').addEventListener('click', function() {
    if (!cy) return;
    activateTool('add-node');
  });
  document.getElementById('tool-add-edge').addEventListener('click', function() {
    if (!cy) return;
    activateTool('add-edge');
  });
  document.getElementById('tool-set-node-attrs').addEventListener('click', function() {
    if (!cy) return;
    activateTool('set-node-attrs');
  });
  document.getElementById('tool-set-edge-attrs').addEventListener('click', function() {
    if (!cy) return;
    activateTool('set-edge-attrs');
  });
  document.getElementById('tool-connect-all').addEventListener('click', function() {
    if (!cy) return;
    activateTool('connect-all');
  });
  document.getElementById('tool-select-box').addEventListener('click', function() {
    if (!cy) return;
    activateTool('select-box');
  });

  // Toggle node labels
  document.getElementById('toggle-node-labels').addEventListener('change', function(e) {
    VISUAL.nodeLabels = e.target.checked;
    if (!cy) return;
    cy.style().selector('node').style('text-opacity', e.target.checked ? 1 : 0).update();
  });

  // Toggle edge labels
  document.getElementById('toggle-edge-labels').addEventListener('change', function(e) {
    VISUAL.edgeLabels = e.target.checked;
    if (!cy) return;
    cy.style().selector('edge').style('text-opacity', e.target.checked ? 1 : 0).update();
  });

  // Toggle node colors
  document.getElementById('toggle-node-colors').addEventListener('change', function(e) {
    if (!cy) return;
    if (e.target.checked) {
      applyColorStyle();
    } else {
      cy.nodes().forEach(function(n) { n.data('_color', null); });
      cy.style().update();
    }
  });

  // Visualization panel toggle (minimize/expand)
  document.getElementById('vis-panel-toggle').addEventListener('click', function(e) {
    e.stopPropagation();
    var panel = document.getElementById('vis-panel');
    panel.classList.toggle('minimized');
    this.textContent = panel.classList.contains('minimized') ? '+' : '\u2212';
    this.title = panel.classList.contains('minimized') ? 'Expand' : 'Minimize';
  });
  // Click header to toggle (same behavior)
  document.getElementById('vis-panel-header').addEventListener('click', function(e) {
    if (e.target.id === 'vis-panel-toggle') return;
    document.getElementById('vis-panel-toggle').click();
  });

  // Visual sliders
  document.querySelectorAll('.vis-slider').forEach(function(slider) {
    slider.addEventListener('input', function() {
      var key = this.getAttribute('data-key');
      var val = parseFloat(this.value);
      VISUAL[key] = val;
      var valDisplay = document.querySelector('.slider-val[data-key="' + key + '"]');
      if (valDisplay) valDisplay.textContent = val;
      
      // If layout parameter, run layout live; otherwise update style
      if (['repulsion', 'idealEdgeLength', 'springCoeff', 'springMass', 'springDamping'].indexOf(key) !== -1) {
        if (cy) {
          var algo = document.getElementById('layout-select').value;
          applyLayout(algo, false, true);
        }
      } else {
        if (cy) cy.style().update();
      }
    });
  });

  // Node Label color picker
  document.getElementById('vis-node-label-color').addEventListener('input', function() {
    VISUAL.nodeLabelColor = this.value;
    if (cy) cy.style().update();
  });

  // Node Label background color picker
  document.getElementById('vis-node-label-bg-color').addEventListener('input', function() {
    VISUAL.nodeLabelBgColor = this.value;
    if (cy) cy.style().update();
  });

  // Edge Label color picker
  document.getElementById('vis-edge-label-color').addEventListener('input', function() {
    VISUAL.edgeLabelColor = this.value;
    if (cy) cy.style().update();
  });

  // Edge Label background color picker
  document.getElementById('vis-edge-label-bg-color').addEventListener('input', function() {
    VISUAL.edgeLabelBgColor = this.value;
    if (cy) cy.style().update();
  });

  document.getElementById('vis-bg-color').addEventListener('input', function() {
    VISUAL.bgColor = this.value;
    document.getElementById('graph-cy').style.backgroundColor = this.value;
  });

  document.getElementById('vis-border-color').addEventListener('input', function() {
    VISUAL.nodeBorderColor = this.value;
    if (cy) cy.style().update();
  });

  // Font family selector
  document.getElementById('vis-font-family').addEventListener('change', function() {
    VISUAL.fontFamily = this.value;
    if (cy) cy.style().update();
  });

  // Node Font bold toggle
  document.getElementById('toggle-node-font-bold').addEventListener('change', function() {
    VISUAL.nodeFontBold = this.checked;
    if (!cy) return;
    cy.style().selector('node').style('font-weight', this.checked ? 'bold' : 'normal').update();
  });

  // Edge Font bold toggle
  document.getElementById('toggle-edge-font-bold').addEventListener('change', function() {
    VISUAL.edgeFontBold = this.checked;
    if (!cy) return;
    cy.style().selector('edge').style('font-weight', this.checked ? 'bold' : 'normal').update();
  });

  // Palette selector
  document.getElementById('vis-palette').addEventListener('change', function() {
    VISUAL.colorPalette = this.value;
    if (cy) applyColorStyle();
  });

  // Curve style selector
  document.getElementById('vis-curve-style').addEventListener('change', function() {
    VISUAL.curveStyle = this.value;
    if (cy) cy.style().update();
    var show = this.value === 'unbundled-bezier';
    var params = document.getElementById('curve-params');
    if (params) params.classList.toggle('hidden', !show);
  });

  // Curve step slider
  document.getElementById('vis-curve-step').addEventListener('input', function() {
    VISUAL.curveStep = parseInt(this.value) || 10;
    var valDisplay = document.getElementById('vis-curve-step-val');
    if (valDisplay) valDisplay.textContent = this.value;
    if (cy) cy.style().update();
  });

  // Curve edge-distances selector
  document.getElementById('vis-curve-dist').addEventListener('change', function() {
    VISUAL.curveEdgeDistances = this.value;
    if (cy) cy.style().update();
  });

  // Edge weight width toggle
  document.getElementById('toggle-edge-weight').addEventListener('change', function() {
    VISUAL.edgeWeightWidth = this.checked;
    if (cy) cy.style().update();
  });

  // Manual colors toggle
  document.getElementById('toggle-manual-colors').addEventListener('change', function() {
    STATE.useManualColors = this.checked;
    if (cy) {
      renderManualColorPickers();
      applyColorStyle();
    }
  });

  // Edge arrows toggle
  document.getElementById('toggle-edge-arrows').addEventListener('change', function() {
    VISUAL.edgeArrows = this.checked;
    if (cy) cy.style().update();
  });

  // Node Label background toggle
  document.getElementById('toggle-node-label-bg').addEventListener('change', function() {
    VISUAL.nodeLabelBg = this.checked;
    if (!cy) return;
    cy.style().selector('node')
      .style('text-background-opacity', this.checked ? 0.7 : 0)
      .style('text-background-padding', this.checked ? '2px' : '0px')
      .update();
  });

  // Edge Label background toggle
  document.getElementById('toggle-edge-label-bg').addEventListener('change', function() {
    VISUAL.edgeLabelBg = this.checked;
    if (!cy) return;
    cy.style().selector('edge')
      .style('text-background-opacity', this.checked ? 0.85 : 0)
      .style('text-background-padding', this.checked ? '2px' : '0px')
      .update();
  });

  // ---- Marquee selection (for Select Box tool) ----
  (function() {
    var _marqueeStart = null;
    var _gcyEl = document.getElementById('graph-cy');

    _gcyEl.addEventListener('pointerdown', function(e) {
      if (TOOL.name !== 'select-box' || !cy) return;
      // Check if pointer is on a node — let tap handler manage node clicks
      var onNode = cy.nodes().some(function(n) {
        var bb = n.renderedBoundingBox({ includeLabels: false });
        return bb.x1 <= e.clientX && bb.x2 >= e.clientX &&
               bb.y1 <= e.clientY && bb.y2 >= e.clientY;
      });
      if (onNode) return;
      _marqueeStart = { x: e.clientX, y: e.clientY };
      _gcyEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    _gcyEl.addEventListener('pointermove', function(e) {
      if (!_marqueeStart) return;
      showMarqueeOverlay(_marqueeStart.x, _marqueeStart.y, e.clientX, e.clientY);
      e.preventDefault();
    });

    _gcyEl.addEventListener('pointerup', function(e) {
      if (!_marqueeStart || !cy) return;
      var start = _marqueeStart;
      _marqueeStart = null;
      hideMarqueeOverlay();
      var dx = Math.abs(e.clientX - start.x);
      var dy = Math.abs(e.clientY - start.y);
      if (dx < 5 && dy < 5) return; // Was a click, not drag
      _marqueeActive = true;
      setTimeout(function() { _marqueeActive = false; }, 100);
      var x1 = Math.min(start.x, e.clientX);
      var y1 = Math.min(start.y, e.clientY);
      var x2 = Math.max(start.x, e.clientX);
      var y2 = Math.max(start.y, e.clientY);
      cy.nodes().forEach(function(n) {
        var pos = n.renderedPosition();
        if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) {
          n.select();
        }
      });
    });
  })();

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      performUndo();
      return;
    }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape' && TOOL.name) {
      deactivateTool();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && cy) {
      var sel = cy.$(':selected');
      if (sel.length > 0) {
        e.preventDefault();
        sel.forEach(function(ele) {
          var label = ele.isNode() ? (ele.data('label') || ele.id()) : (ele.data('type') || 'edge');
          if (confirm('Delete ' + label + '?')) {
            pushUndo();
            cy.remove(ele);
            showEmptySidebar();
            populateDropdowns();
          }
        });
      }
    }
  });

  // Resize handler
  window.addEventListener('resize', function() {
    if (cy) cy.resize();
  });

  // Blur sidebar inputs before canvas clicks, ensuring edits save
  document.addEventListener('mousedown', function(e) {
    var active = document.activeElement;
    if (active && (active.classList.contains('attr-value') || active.classList.contains('attr-new-key'))) {
      active.blur();
    }
  }, true);

  // Drag & drop JSON file
  var dropZone = document.getElementById('graph-container');
  dropZone.addEventListener('dragover', function(e) { e.preventDefault(); });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      importJSON(file);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);


// ===================== RANDOM GRAPH GENERATION =====================

function generateErdosRenyi(n, p) {
  const elements = [];
  const groups = ['work', 'family', 'friends', 'other'];
  const edgeTypes = ['colleague', 'friend', 'collaborator', 'mentor', 'other'];
  
  // Nodes
  for (let i = 1; i <= n; i++) {
    const group = groups[Math.floor(Math.random() * groups.length)];
    elements.push({
      group: 'nodes',
      data: { id: 'n' + i, label: 'V' + i, group: group }
    });
  }
  
  // Edges
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      if (Math.random() < p) {
        const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
        const weight = Math.floor(Math.random() * 5) + 1;
        elements.push({
          group: 'edges',
          data: {
            source: 'n' + i,
            target: 'n' + j,
            type: type,
            weight: weight
          }
        });
      }
    }
  }
  return elements;
}

function generateBarabasiAlbert(n, m) {
  const elements = [];
  const groups = ['work', 'family', 'friends', 'other'];
  const edgeTypes = ['colleague', 'friend', 'collaborator', 'mentor', 'other'];

  // Start with m + 1 connected nodes
  const initialNodes = m + 1;
  for (let i = 1; i <= initialNodes; i++) {
    const group = groups[Math.floor(Math.random() * groups.length)];
    elements.push({
      group: 'nodes',
      data: { id: 'n' + i, label: 'V_' + i, group: group }
    });
  }
  for (let i = 1; i <= initialNodes; i++) {
    for (let j = i + 1; j <= initialNodes; j++) {
      const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
      const weight = Math.floor(Math.random() * 5) + 1;
      elements.push({
        group: 'edges',
        data: { source: 'n' + i, target: 'n' + j, type: type, weight: weight }
      });
    }
  }

  // Keep track of degrees
  const degrees = {};
  for (let i = 1; i <= initialNodes; i++) degrees['n' + i] = initialNodes - 1;

  // Add remaining nodes
  for (let i = initialNodes + 1; i <= n; i++) {
    const newId = 'n' + i;
    const group = groups[Math.floor(Math.random() * groups.length)];
    elements.push({
      group: 'nodes',
      data: { id: newId, label: 'V_' + i, group: group }
    });
    degrees[newId] = 0;

    // Select m targets based on preferential attachment
    const targets = [];
    const candidates = Object.keys(degrees).filter(function(id) { return id !== newId; });
    let totalDegree = candidates.reduce(function(sum, id) { return sum + degrees[id]; }, 0);

    while (targets.length < m && candidates.length > 0) {
      let rand = Math.random() * totalDegree;
      let runningSum = 0;
      let selectedIdx = -1;

      for (let k = 0; k < candidates.length; k++) {
        runningSum += degrees[candidates[k]];
        if (rand <= runningSum) {
          selectedIdx = k;
          break;
        }
      }

      if (selectedIdx === -1) selectedIdx = candidates.length - 1;
      const targetId = candidates.splice(selectedIdx, 1)[0];
      targets.push(targetId);
      totalDegree -= degrees[targetId];
    }

    // Connect to targets
    targets.forEach(function(targetId) {
      const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
      const weight = Math.floor(Math.random() * 5) + 1;
      elements.push({
        group: 'edges',
        data: { source: newId, target: targetId, type: type, weight: weight }
      });
      degrees[newId]++;
      degrees[targetId]++;
    });
  }

  return elements;
}

function generateWattsStrogatz(n, k, beta) {
  const elements = [];
  const groups = ['work', 'family', 'friends', 'other'];
  const edgeTypes = ['colleague', 'friend', 'collaborator', 'mentor', 'other'];

  // Ensure k is even and smaller than n
  k = Math.min(n - 1, Math.max(2, k - (k % 2)));

  // Create nodes
  for (let i = 1; i <= n; i++) {
    const group = groups[Math.floor(Math.random() * groups.length)];
    elements.push({
      group: 'nodes',
      data: { id: 'n' + i, label: 'V_' + i, group: group }
    });
  }

  // Create ring lattice edges
  const adj = {};
  for (let i = 1; i <= n; i++) {
    adj[i] = new Set();
  }

  for (let i = 1; i <= n; i++) {
    for (let step = 1; step <= k / 2; step++) {
      let j = i + step;
      if (j > n) j -= n;
      adj[i].add(j);
      adj[j].add(i);
    }
  }

  // Rewire edges
  for (let i = 1; i <= n; i++) {
    for (let step = 1; step <= k / 2; step++) {
      let j = i + step;
      if (j > n) j -= n;

      if (Math.random() < beta) {
        // Rewire target j to a random node target
        // Choose target not equal to i, not already connected to i
        const candidates = [];
        for (let t = 1; t <= n; t++) {
          if (t !== i && !adj[i].has(t)) {
            candidates.push(t);
          }
        }

        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          // Remove old edge from adj
          adj[i].delete(j);
          adj[j].delete(i);
          // Add new edge
          adj[i].add(target);
          adj[target].add(i);
        }
      }
    }
  }

  // Add edges to elements list
  const added = new Set();
  for (let i = 1; i <= n; i++) {
    adj[i].forEach(function(j) {
      const key = i < j ? i + '-' + j : j + '-' + i;
      if (!added.has(key)) {
        added.add(key);
        const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
        const weight = Math.floor(Math.random() * 5) + 1;
        elements.push({
          group: 'edges',
          data: { source: 'n' + i, target: 'n' + j, type: type, weight: weight }
        });
      }
    });
  }

  return elements;
}

function generateSBM(n, c, pIn, pOut) {
  const elements = [];
  const groups = ['work', 'family', 'friends', 'other'];
  const edgeTypes = ['colleague', 'friend', 'collaborator', 'mentor', 'other'];

  // Partition nodes
  const nodeComm = {};
  for (let i = 1; i <= n; i++) {
    const comm = Math.floor(Math.random() * c);
    nodeComm[i] = comm;
    // Map community index to a group name for visualization
    const groupName = groups[comm % groups.length];
    elements.push({
      group: 'nodes',
      data: { id: 'n' + i, label: 'V_' + i, group: groupName, community: comm }
    });
  }

  // Add edges
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      const c1 = nodeComm[i];
      const c2 = nodeComm[j];
      const p = (c1 === c2) ? pIn : pOut;

      if (Math.random() < p) {
        const type = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
        const weight = Math.floor(Math.random() * 5) + 1;
        elements.push({
          group: 'edges',
          data: { source: 'n' + i, target: 'n' + j, type: type, weight: weight }
        });
      }
    }
  }

  return elements;
}

function showRandomGraphModal() {
  var html = '' +
    '<div class="form-group">' +
      '<label>Algorithm / Model</label>' +
      '<select id="mrg-algo">' +
        '<option value="erdos-renyi">Erdős-Rényi (Random Graph)</option>' +
        '<option value="barabasi-albert">Barabási-Albert (Scale-Free)</option>' +
        '<option value="watts-strogatz">Watts-Strogatz (Small-World)</option>' +
        '<option value="sbm">Stochastic Block Model (Community Structure)</option>' +
      '</select>' +
    '</div>' +
    '<div id="mrg-info" style="font-size:11.5px; color:var(--text-dim); margin-bottom:14px; background:var(--bg-input); padding:8px 10px; border-radius:4px; border:1px solid var(--border); line-height:1.4;">' +
      'Erdős-Rényi (G(n, p)) Model: Connects every pair of nodes independently with probability P. Models simple random networks with a Poisson degree distribution, lacking clustering or hubs.' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Number of Nodes (N)</label>' +
      '<input id="mrg-n" type="number" min="5" max="150" value="40">' +
    '</div>' +
    '<div id="mrg-fields-er" class="mrg-fields">' +
      '<div class="form-group">' +
        '<label>Edge Probability (P): <span id="mrg-val-p">0.08</span></label>' +
        '<input id="mrg-p" type="range" min="0.01" max="0.5" step="0.01" value="0.08" style="width:100%; display:block; margin-top:4px;">' +
      '</div>' +
    '</div>' +
    '<div id="mrg-fields-ba" class="mrg-fields hidden">' +
      '<div class="form-group">' +
        '<label>Connections per New Node (M)</label>' +
        '<input id="mrg-m" type="number" min="1" max="10" value="2">' +
      '</div>' +
    '</div>' +
    '<div id="mrg-fields-ws" class="mrg-fields hidden">' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label>Mean Degree (K, Even)</label>' +
          '<input id="mrg-k" type="number" min="2" max="20" step="2" value="4">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Rewiring Prob (&beta;): <span id="mrg-val-beta">0.20</span></label>' +
          '<input id="mrg-beta" type="range" min="0" max="1" step="0.05" value="0.20" style="width:100%; display:block; margin-top:4px;">' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div id="mrg-fields-sbm" class="mrg-fields hidden">' +
      '<div class="form-group">' +
        '<label>Number of Communities (C)</label>' +
        '<input id="mrg-c" type="number" min="2" max="4" value="3">' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label>Intra-comm Prob (P_in): <span id="mrg-val-pin">0.35</span></label>' +
          '<input id="mrg-pin" type="range" min="0.05" max="0.8" step="0.05" value="0.35" style="width:100%; display:block; margin-top:4px;">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Inter-comm Prob (P_out): <span id="mrg-val-pout">0.05</span></label>' +
          '<input id="mrg-pout" type="range" min="0.00" max="0.3" step="0.01" value="0.05" style="width:100%; display:block; margin-top:4px;">' +
        '</div>' +
      '</div>' +
    '</div>';

  showModal('Generate Random Graph', html, function() {
    var algo = document.getElementById('mrg-algo').value;
    var n = parseInt(document.getElementById('mrg-n').value, 10);

    if (isNaN(n) || n < 5 || n > 150) {
      alert('Number of nodes must be an integer between 5 and 150');
      return false;
    }

    var elements = [];
    if (algo === 'erdos-renyi') {
      var p = parseFloat(document.getElementById('mrg-p').value);
      elements = generateErdosRenyi(n, p);
    } else if (algo === 'barabasi-albert') {
      var m = parseInt(document.getElementById('mrg-m').value, 10);
      if (isNaN(m) || m < 1 || m >= n) {
        alert('Connections per new node (M) must be an integer between 1 and N-1');
        return false;
      }
      elements = generateBarabasiAlbert(n, m);
    } else if (algo === 'watts-strogatz') {
      var k = parseInt(document.getElementById('mrg-k').value, 10);
      var beta = parseFloat(document.getElementById('mrg-beta').value);
      if (isNaN(k) || k < 2 || k >= n || k % 2 !== 0) {
        alert('Mean degree (K) must be an even integer between 2 and N-1');
        return false;
      }
      elements = generateWattsStrogatz(n, k, beta);
    } else if (algo === 'sbm') {
      var c = parseInt(document.getElementById('mrg-c').value, 10);
      var pIn = parseFloat(document.getElementById('mrg-pin').value);
      var pOut = parseFloat(document.getElementById('mrg-pout').value);
      if (isNaN(c) || c < 2 || c > 5) {
        alert('Number of communities (C) must be between 2 and 5');
        return false;
      }
      elements = generateSBM(n, c, pIn, pOut);
    }

    undoStack = [];
    updateUndoButton();

    initGraph(elements, false);
    return true;
  });

  var algoSelect = document.getElementById('mrg-algo');
  var infoBox = document.getElementById('mrg-info');

  var infoTexts = {
    'erdos-renyi': 'Erdős-Rényi (G(n, p)) Model: Connects every pair of nodes independently with probability P. Models simple random networks with a Poisson degree distribution, lacking clustering or hubs.',
    'barabasi-albert': 'Barabási-Albert Model: Generates scale-free networks using preferential attachment (nodes connect preferentially to existing nodes with high degree). Produces heavy-tailed degree distributions (highly connected hubs) typical of real social networks.',
    'watts-strogatz': 'Watts-Strogatz Model: Generates small-world networks. Starts with a regular ring lattice connected to K nearest neighbors, then rewires each edge with probability β. Combines high local clustering with short average path lengths.',
    'sbm': 'Stochastic Block Model (SBM): Creates strong community structure. Nodes are partitioned into C blocks (groups). Edges are formed inside communities with probability P_in, and between communities with probability P_out.'
  };

  algoSelect.addEventListener('change', function() {
    var val = this.value;
    infoBox.textContent = infoTexts[val];

    var fields = document.querySelectorAll('.mrg-fields');
    fields.forEach(function(f) { f.classList.add('hidden'); });

    if (val === 'erdos-renyi') {
      document.getElementById('mrg-fields-er').classList.remove('hidden');
    } else if (val === 'barabasi-albert') {
      document.getElementById('mrg-fields-ba').classList.remove('hidden');
    } else if (val === 'watts-strogatz') {
      document.getElementById('mrg-fields-ws').classList.remove('hidden');
    } else if (val === 'sbm') {
      document.getElementById('mrg-fields-sbm').classList.remove('hidden');
    }
  });

  document.getElementById('mrg-p').addEventListener('input', function() {
    document.getElementById('mrg-val-p').textContent = parseFloat(this.value).toFixed(2);
  });
  document.getElementById('mrg-beta').addEventListener('input', function() {
    document.getElementById('mrg-val-beta').textContent = parseFloat(this.value).toFixed(2);
  });
  document.getElementById('mrg-pin').addEventListener('input', function() {
    document.getElementById('mrg-val-pin').textContent = parseFloat(this.value).toFixed(2);
  });
  document.getElementById('mrg-pout').addEventListener('input', function() {
    document.getElementById('mrg-val-pout').textContent = parseFloat(this.value).toFixed(2);
  });
}
