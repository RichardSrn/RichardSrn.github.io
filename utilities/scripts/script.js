// State Management
let allScripts = [];
let scriptTree = null;
let currentScript = null;
let currentContent = '';
let isEditing = false;
let sortCriteria = 'name';
let sortDirection = 1; // 1 for Asc, -1 for Desc
let searchQuery = '';

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const resizer = document.getElementById('sidebar-resizer');
const fileTreeEl = document.getElementById('file-tree');
const scriptViewerEl = document.getElementById('script-viewer');
const welcomeMessageEl = document.getElementById('welcome-message');
const fileNameEl = document.getElementById('file-name');
const fileMetaEl = document.getElementById('file-meta');
const codeContentEl = document.getElementById('code-content');
const codeEditorEl = document.getElementById('code-editor');
const hoverPreview = document.getElementById('hover-preview');

const btnEdit = document.getElementById('btn-edit');
const btnDownload = document.getElementById('btn-download');
const btnToggleHelp = document.getElementById('btn-toggle-help');
const btnSortDir = document.getElementById('btn-sort-dir');
const sortIcon = document.getElementById('sort-icon');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('script-search');
const helpPanel = document.getElementById('help-panel');
const helpContentEl = document.getElementById('help-content');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchScripts();
    initResizer();
    initControls();
});

function initControls() {
    sortSelect.addEventListener('change', (e) => {
        sortCriteria = e.target.value;
        render();
    });

    btnSortDir.addEventListener('click', () => {
        sortDirection *= -1;
        sortIcon.textContent = sortDirection === 1 ? '↓' : '↑';
        render();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        render();
    });

    btnEdit.addEventListener('click', toggleEditMode);
    btnDownload.addEventListener('click', downloadScript);
    btnToggleHelp.addEventListener('click', () => helpPanel.classList.toggle('hidden'));
}

// --- Fetch & Process ---
async function fetchScripts() {
    try {
        const response = await fetch('scripts_manifest.json');
        if (!response.ok) throw new Error('Manifest not found');
        allScripts = await response.json();

        // Build Tree
        scriptTree = buildTree(allScripts);
        render();
    } catch (error) {
        fileTreeEl.innerHTML = `<div class="empty-result">Error loading scripts.<br>Please run <code>generate_manifest.py</code></div>`;
        console.error(error);
    }
}

function buildTree(scripts) {
    const root = { name: 'Repository', type: 'folder', children: {}, path: '' };

    scripts.forEach(script => {
        // Path in manifest: "repository/folder/name.py"
        // We want to skip the "repository/" prefix if possible or handle it
        const parts = script.path.split('/');
        // Usually: parts = ["repository", "folder", "script.py"] or ["repository", "script.py"]

        // Skip "repository" if it's the first part and all scripts share it
        const pathParts = parts[0] === 'repository' ? parts.slice(1) : parts;

        let current = root;
        pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
                // It's a file
                current.children[part] = { ...script, type: 'file' };
            } else {
                // It's a folder
                if (!current.children[part]) {
                    current.children[part] = { name: part, type: 'folder', children: {}, path: parts.slice(0, index + 2).join('/') };
                }
                current = current.children[part];
            }
        });
    });
    return root;
}

// --- Rendering ---
function render() {
    fileTreeEl.innerHTML = '';

    if (searchQuery) {
        renderFlatList(filterScripts(searchQuery));
    } else {
        renderTreeNode(scriptTree, fileTreeEl, 0);
    }
}

function filterScripts(query) {
    return allScripts.filter(s => s.name.toLowerCase().includes(query));
}

function sortList(list) {
    return [...list].sort((a, b) => {
        // Folders always come first if we were rendering them mixed, but here it's flat vs tree.
        // In flat list (search):
        if (sortCriteria === 'name') {
            return a.name.localeCompare(b.name) * sortDirection;
        } else if (sortCriteria === 'size') {
            return (a.size - b.size) * sortDirection;
        } else if (sortCriteria === 'ext') {
            const extA = a.extension || '';
            const extB = b.extension || '';
            const res = extA.localeCompare(extB);
            if (res !== 0) return res * sortDirection;
            return a.name.localeCompare(b.name); // Default to name within type
        }
        return 0;
    });
}

function renderFlatList(scripts) {
    const sorted = sortList(scripts);
    sorted.forEach(script => {
        const item = createFileItem(script);
        fileTreeEl.appendChild(item);
    });
}

function renderTreeNode(node, container, depth) {
    // Collect children and sort them
    const entries = Object.values(node.children);

    // Sort logic for tree: Folders first, then files, then by criteria
    entries.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;

        if (sortCriteria === 'name') {
            return a.name.localeCompare(b.name) * sortDirection;
        } else if (sortCriteria === 'size') {
            const sizeA = a.size || 0;
            const sizeB = b.size || 0;
            return (sizeA - sizeB) * sortDirection;
        } else if (sortCriteria === 'ext') {
            const extA = a.extension || (a.type === 'folder' ? 'folder' : '');
            const extB = b.extension || (b.type === 'folder' ? 'folder' : '');
            const res = extA.localeCompare(extB);
            if (res !== 0) return res * sortDirection;
            return a.name.localeCompare(b.name);
        }
        return 0;
    });

    entries.forEach(entry => {
        const nodeWrapper = document.createElement('div');
        nodeWrapper.className = 'tree-node';

        if (entry.type === 'folder') {
            const folderItem = createFolderItem(entry);
            nodeWrapper.appendChild(folderItem);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            nodeWrapper.appendChild(childrenContainer);

            folderItem.addEventListener('click', (e) => {
                e.stopPropagation();
                nodeWrapper.classList.toggle('expanded');
                if (nodeWrapper.classList.contains('expanded') && childrenContainer.innerHTML === '') {
                    renderTreeNode(entry, childrenContainer, depth + 1);
                }
            });

            // Hover preview for folder (directory list)
            folderItem.addEventListener('mouseenter', (e) => showFolderPreview(e, entry));
            folderItem.addEventListener('mouseleave', hidePreview);

        } else {
            const fileItem = createFileItem(entry);
            nodeWrapper.appendChild(fileItem);

            // Hover preview for file (help text)
            fileItem.addEventListener('mouseenter', (e) => showFilePreview(e, entry));
            fileItem.addEventListener('mouseleave', hidePreview);
        }

        container.appendChild(nodeWrapper);
    });
}

function createFolderItem(folder) {
    const el = document.createElement('div');
    el.className = 'tree-item folder-item';
    el.innerHTML = `
        <span class="expand-icon">▶</span>
        <span class="icon">📁</span>
        <div class="node-content">
            <span class="node-name">${folder.name}</span>
            <span class="node-meta">${Object.keys(folder.children).length} items</span>
        </div>
    `;
    return el;
}

function createFileItem(script) {
    const el = document.createElement('div');
    el.className = 'tree-item file-item';
    if (currentScript && currentScript.path === script.path) el.classList.add('active');

    let icon = '📄';
    if (script.extension === '.py') icon = '🐍';
    else if (script.extension === '.sh') icon = '🐚';
    else if (script.extension === '.js') icon = '📜';

    el.innerHTML = `
        <span class="icon" style="margin-left: 16px;">${icon}</span>
        <div class="node-content">
            <span class="node-name">${script.name}</span>
            <span class="node-meta">${formatSize(script.size)}</span>
        </div>
    `;

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.file-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        loadScript(script);
    });

    return el;
}

// --- Preview Logic ---
function showFilePreview(e, script) {
    const help = script.help_text || 'No documentation found for this script.';
    const lines = help.split('\n').slice(0, 5).join('\n');
    const display = lines + (help.split('\n').length > 5 ? '\n...' : '');

    hoverPreview.innerHTML = `
        <h4>${script.name}</h4>
        <span class="preview-meta">${script.extension.toUpperCase()} · ${formatSize(script.size)}</span>
        <div>${display}</div>
    `;
    updatePreviewPos(e);
}

function showFolderPreview(e, folder) {
    const children = Object.keys(folder.children);
    const display = children.slice(0, 8).join('\n') + (children.length > 8 ? '\n...' : '');

    hoverPreview.innerHTML = `
        <h4>${folder.name}/</h4>
        <span class="preview-meta">${children.length} items</span>
        <div>${display}</div>
    `;
    updatePreviewPos(e);
}

function updatePreviewPos(e) {
    hoverPreview.style.left = (e.clientX + 20) + 'px';
    hoverPreview.style.top = (e.clientY + 10) + 'px';
    hoverPreview.classList.add('visible');
    hoverPreview.classList.remove('hidden');
}

function hidePreview() {
    hoverPreview.classList.remove('visible');
    hoverPreview.classList.add('hidden');
}

// --- Script Loading & Mode ---
async function loadScript(script) {
    currentScript = script;

    welcomeMessageEl.classList.add('hidden');
    scriptViewerEl.classList.remove('hidden');
    fileNameEl.textContent = script.name;
    fileMetaEl.textContent = `${script.extension.toUpperCase()} · ${formatSize(script.size)} · ${script.path}`;

    if (script.help_text) {
        helpContentEl.textContent = script.help_text;
        btnToggleHelp.classList.remove('hidden');
        helpPanel.classList.add('hidden');
    } else {
        btnToggleHelp.classList.add('hidden');
        helpPanel.classList.add('hidden');
    }

    isEditing = false;
    codeEditorEl.classList.add('hidden');
    codeContentEl.parentElement.classList.remove('hidden');
    btnEdit.innerHTML = '<span class="btn-icon">✏️</span> Edit';

    try {
        const response = await fetch(script.path);
        const text = await response.text();
        currentContent = text;

        let lang = 'none';
        if (script.extension === '.py') lang = 'python';
        else if (script.extension === '.sh') lang = 'bash';
        else if (script.extension === '.js') lang = 'javascript';

        codeContentEl.className = `language-${lang} line-numbers`;
        codeContentEl.textContent = text;
        Prism.highlightElement(codeContentEl);
    } catch (error) {
        codeContentEl.textContent = "Error loading content.";
    }
}

function toggleEditMode() {
    if (!currentScript) return;
    isEditing = !isEditing;

    if (isEditing) {
        codeEditorEl.value = currentContent;
        codeContentEl.parentElement.classList.add('hidden');
        codeEditorEl.classList.remove('hidden');
        btnEdit.innerHTML = '<span class="btn-icon">💾</span> Done';
        codeEditorEl.focus();
    } else {
        currentContent = codeEditorEl.value;
        codeContentEl.textContent = currentContent;
        Prism.highlightElement(codeContentEl);
        codeEditorEl.classList.add('hidden');
        codeContentEl.parentElement.classList.remove('hidden');
        btnEdit.innerHTML = '<span class="btn-icon">✏️</span> Edit';
    }
}

function downloadScript() {
    const blob = new Blob([currentContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentScript.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// --- Sidebar Resizing ---
function initResizer() {
    let x = 0;
    let w = 0;

    const mouseDownHandler = (e) => {
        x = e.clientX;
        const styles = window.getComputedStyle(sidebar);
        w = parseInt(styles.width, 10);
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        resizer.classList.add('resizing');
    };

    const mouseMoveHandler = (e) => {
        const dx = e.clientX - x;
        const newWidth = w + dx;
        if (newWidth > 200 && newWidth < 600) {
            sidebar.style.width = `${newWidth}px`;
        }
    };

    const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
        resizer.classList.remove('resizing');
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
}

// --- Helpers ---
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
