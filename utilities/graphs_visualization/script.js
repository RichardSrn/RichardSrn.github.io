document.addEventListener('DOMContentLoaded', () => {
    const datasetSelect = document.getElementById('dataset-select');
    const variantSelect = document.getElementById('variant-select');
    const typeSelect = document.getElementById('type-select');
    const sbmSlider = document.getElementById('sbm-slider');
    const sbmValue = document.getElementById('sbm-value');
    const visualizeBtn = document.getElementById('visualize-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const floatingFullscreenBtn = document.getElementById('floating-fullscreen-btn');
    const infoBox = document.getElementById('info-box');
    const infoText = document.getElementById('info-text');
    const graphFrame = document.getElementById('graph-frame');
    const loader = document.getElementById('loader');
    const statsTable = document.getElementById('stats-table');
    const variantGroup = document.getElementById('variant-group');
    const typeGroup = document.getElementById('type-group');
    const sbmSliderGroup = document.getElementById('sbm-slider-group');
    const fullTableBtn = document.getElementById('fulltable-btn');
    const visualizationDisplay = document.querySelector('.visualization-display');

    let config = {};
    let tableData = [];
    let sortState = { column: null, direction: 'asc' };
    let isFullTable = false; // State for table truncation toggle
    let sbmExpanded = false; // State for SBM expansion

    // Load Configuration
    fetch('config.json')
        .then(response => response.json())
        .then(data => {
            config = data;
            populateDatasetSelect();
            initTableData(data.stats);
            renderStatsTable();

            // Default to Texas if available
            if (config.graphs['Texas']) {
                datasetSelect.value = 'Texas';
                datasetSelect.dispatchEvent(new Event('change'));

                // Trigger visualization automatically for default
                // Ensure we wait for dropdown propagation
                setTimeout(() => {
                    visualizeBtn.click();
                }, 100);
            }
        })
        .catch(error => console.error('Error loading config:', error));

    function populateDatasetSelect() {
        if (!config.graphs) return;

        const datasets = Object.keys(config.graphs).sort();
        datasets.forEach(dataset => {
            const option = document.createElement('option');
            option.value = dataset;
            option.textContent = dataset;
            datasetSelect.appendChild(option);
        });
    }

    datasetSelect.addEventListener('change', () => {
        const dataset = datasetSelect.value;
        const variants = config.graphs[dataset];

        // Reset UI
        variantSelect.innerHTML = '';
        typeSelect.innerHTML = '';
        variantGroup.style.display = 'none';
        sbmSliderGroup.style.display = 'none';
        typeGroup.style.display = 'none';
        visualizeBtn.disabled = true;
        fullscreenBtn.disabled = true;
        floatingFullscreenBtn.disabled = true;
        infoBox.style.display = 'none';

        if (!variants) return;

        // Check if SBM
        if (dataset === 'SBM') {
            setupSBMSlider(variants);
        } else {
            const variantKeys = Object.keys(variants);
            if (variantKeys.length > 1) {
                variantGroup.style.display = 'flex';
                variantKeys.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v;
                    option.textContent = v;
                    variantSelect.appendChild(option);
                });
                variantSelect.dispatchEvent(new Event('change'));
            } else {
                // Auto-select single variant
                populateTypeSelect(variants[variantKeys[0]]);
            }
        }

        highlightStatsRow(dataset);
    });

    function setupSBMSlider(variants) {
        sbmSliderGroup.style.display = 'flex';
        // Only reset to 0.5 if we are NOT coming from a specific table selection
        // We'll handle preserving values externally if needed, but default is 0.5
        // If the slider was already set by table selection, we should keep it?
        // Simple approach: if sbmSlider.dataset.manualSet === 'true', keep it.

        if (sbmSlider.dataset.manualSet !== 'true') {
            sbmSlider.value = 0.5;
            sbmValue.textContent = "0.50";
        }
        sbmSlider.dataset.manualSet = 'false'; // Reset flag

        updateSBMOptions();
    }

    sbmSlider.addEventListener('input', () => {
        sbmValue.textContent = parseFloat(sbmSlider.value).toFixed(2);
        updateSBMOptions();

        // Live update if already visualizing
        if (!visualizeBtn.disabled && graphFrame.src) {
            updateVisualization();
        }
    });

    function updateSBMOptions() {
        const dataset = datasetSelect.value;
        const hVal = parseFloat(sbmSlider.value).toFixed(2);
        const variantKey = `h=${hVal}`;

        if (config.graphs[dataset] && config.graphs[dataset][variantKey]) {
            populateTypeSelect(config.graphs[dataset][variantKey]);
        } else {
            // console.warn(`Variant ${variantKey} not found for ${dataset}`);
            typeSelect.innerHTML = '';
            visualizeBtn.disabled = true;
            fullscreenBtn.disabled = true;
            floatingFullscreenBtn.disabled = true;
        }
    }

    variantSelect.addEventListener('change', () => {
        const dataset = datasetSelect.value;
        const variant = variantSelect.value;
        if (config.graphs[dataset] && config.graphs[dataset][variant]) {
            populateTypeSelect(config.graphs[dataset][variant]);
        }
    });

    function populateTypeSelect(types) {
        typeSelect.innerHTML = '';
        typeGroup.style.display = 'flex';

        types.forEach((t, index) => {
            const option = document.createElement('option');
            option.value = index; // Store index to retrieve full object later

            let label = t.type.toUpperCase().replace('_', ' ');
            if (t.type.toLowerCase() === 'lcc') {
                label = 'Largest Connected Component';
            }

            option.textContent = label;
            typeSelect.appendChild(option);
        });

        typeSelect.dispatchEvent(new Event('change'));
    }

    typeSelect.addEventListener('change', () => {
        visualizeBtn.disabled = false;
        checkFileSize();
    });

    function getSelectedGraphData() {
        const dataset = datasetSelect.value;
        if (!dataset) return null;

        if (dataset === 'SBM') {
            const hVal = parseFloat(sbmSlider.value).toFixed(2);
            const variantKey = `h=${hVal}`;
            const types = config.graphs[dataset][variantKey];
            return types[typeSelect.value];
        } else {
            const variants = config.graphs[dataset];
            const variantKeys = Object.keys(variants);
            // If variant selector is hidden, use the first/only variant
            const variant = variantGroup.style.display === 'none' ? variantKeys[0] : variantSelect.value;
            return variants[variant][typeSelect.value];
        }
    }

    function checkFileSize() {
        const data = getSelectedGraphData();
        if (!data) return;

        const infoDesc = document.getElementById('info-desc');
        infoBox.style.display = 'flex';
        infoText.textContent = `File Size: ${data.size_mb} MB.`;

        if (data.type.toLowerCase() === 'lcc') {
            infoDesc.textContent = "The Largest Connected Component is the maximal set of nodes such that any pair of nodes can be reached from each other.";
            infoDesc.style.display = 'block';
        } else {
            infoDesc.style.display = 'none';
        }

        if (data.size_mb > 50) {
            infoText.textContent += " ⚠️ Large file! Loading may be slow and consume high RAM.";
            infoBox.style.borderColor = 'var(--warning-color)';
            infoBox.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
        } else {
            infoBox.style.borderColor = 'var(--primary-color)';
            infoBox.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        }
    }

    visualizeBtn.addEventListener('click', updateVisualization);

    fullscreenBtn.addEventListener('click', () => {
        if (visualizationDisplay.requestFullscreen) {
            visualizationDisplay.requestFullscreen();
        } else if (visualizationDisplay.webkitRequestFullscreen) { /* Safari */
            visualizationDisplay.webkitRequestFullscreen();
        } else if (visualizationDisplay.msRequestFullscreen) { /* IE11 */
            visualizationDisplay.msRequestFullscreen();
        }
    });

    floatingFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (visualizationDisplay.requestFullscreen) {
                visualizationDisplay.requestFullscreen();
            } else if (visualizationDisplay.webkitRequestFullscreen) {
                visualizationDisplay.webkitRequestFullscreen();
            } else if (visualizationDisplay.msRequestFullscreen) {
                visualizationDisplay.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });

    // Listen for fullscreen changes to update button icon if desired
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
    document.addEventListener('mozfullscreenchange', updateFullscreenButton);
    document.addEventListener('MSFullscreenChange', updateFullscreenButton);

    function updateFullscreenButton() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        floatingFullscreenBtn.textContent = isFullscreen ? ' ⬃ ' : '⛶';
        floatingFullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
    }

    fullTableBtn.addEventListener('click', () => {
        isFullTable = !isFullTable;
        if (isFullTable) {
            document.body.classList.add('table-expanded');
            fullTableBtn.textContent = 'Collapse Table';
            fullTableBtn.classList.add('active');
        } else {
            document.body.classList.remove('table-expanded');
            fullTableBtn.textContent = 'Expand Table';
            fullTableBtn.classList.remove('active');
        }
    });
    // Set initial text
    fullTableBtn.textContent = 'Expand Table';

    function updateVisualization() {
        const data = getSelectedGraphData();
        if (!data) return;

        const isSBMExplorer = data.path.endsWith('SBM_explorer.html');
        // Check if we are already viewing the SBM explorer (compare existing src)
        const currentSrc = graphFrame.getAttribute('src');
        // We use getAttribute because 'src' property might differ (absolute vs relative)

        if (isSBMExplorer && currentSrc && currentSrc.endsWith('SBM_explorer.html')) {
            // Already loaded, just update the homophily locally
            const hVal = parseFloat(sbmSlider.value);
            if (graphFrame.contentWindow && graphFrame.contentWindow.setHomophily) {
                // Determine if we need to show loader? Maybe not for quick switch
                graphFrame.contentWindow.setHomophily(hVal);
            } else {
                // Fallback if function not ready yet (unlikely if loaded)
                console.warn("setHomophily not found on contentWindow");
            }
            return;
        }

        // Standard Load / Initial SBM Load
        loader.style.display = 'flex';
        graphFrame.style.opacity = '0.5';
        fullscreenBtn.disabled = false;
        floatingFullscreenBtn.disabled = false;

        graphFrame.src = data.path;

        graphFrame.onload = () => {
            loader.style.display = 'none';
            graphFrame.style.opacity = '1';
            syncThemeToIframe();

            // Inject class labels into the iframe's info overlay
            setTimeout(() => {
                injectClassLegendToIframe();
            }, 300); // Small delay to ensure iframe JS is initialized

            // If it is SBM, set initial value because resource defaults to 0.5
            if (isSBMExplorer) {
                const hVal = parseFloat(sbmSlider.value);
                if (graphFrame.contentWindow && graphFrame.contentWindow.setHomophily) {
                    graphFrame.contentWindow.setHomophily(hVal);
                }
            }
        };
    }

    function injectClassLegendToIframe() {
        try {
            const dataset = datasetSelect.value;
            if (!dataset || !config.stats) return;

            const tab10Colors = [
                "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
                "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
            ];

            let statsEntry = null;
            if (dataset === 'SBM') {
                const hVal = parseFloat(sbmSlider.value).toFixed(2);
                statsEntry = config.stats['SBM']?.[`h=${hVal}`];
            } else {
                statsEntry = config.stats[dataset];
            }

            if (!statsEntry) return;

            const classLabelsStr = statsEntry['Class Labels'] || '';
            const classesCount = parseInt(statsEntry['Classes'] || '0');
            const isConfirmed = classLabelsStr.startsWith('{');

            const classLabels = [];
            for (let i = 0; i < classesCount; i++) {
                let name = `Class ${i}`;
                if (isConfirmed) {
                    const m = classLabelsStr.match(new RegExp(`${i}:\\s*"([^"]+)"`));
                    if (m) name = m[1];
                }
                classLabels.push({ class: i, name, color: tab10Colors[i % 10], confirmed: isConfirmed });
            }

            if (graphFrame.contentWindow && graphFrame.contentWindow.ACTIVE_VIEWER) {
                const existingInfo = graphFrame.contentWindow.ACTIVE_VIEWER.data?.graphInfo || {};
                existingInfo.classLabels = classLabels;
                if (graphFrame.contentWindow.updateInfoOverlay) {
                    graphFrame.contentWindow.updateInfoOverlay(existingInfo);
                }
            }
        } catch (e) {
            // iframe cross-origin restrictions, silently ignore
        }
    }

    // Data Table Logic
    function initTableData(stats) {
        if (!stats) return;
        tableData = [];

        Object.keys(stats).forEach(key => {
            if (key === 'SBM') {
                // Add SBM Parent Row with constant SBM fields
                tableData.push({
                    Dataset: 'SBM',
                    Description: 'Stochastic Block Model synthetic community graph',
                    'Edge Meaning': 'Probabilistic connection based on community membership',
                    Nodes: '2000',
                    Edges: '-',
                    Feats: '10',
                    Classes: '4',
                    'Class Sizes': '[500, 500, 500, 500]',
                    'Class Labels': '{0: "Community 0", 1: "Community 1", 2: "Community 2", 3: "Community 3"}',
                    Comp: '-',
                    'Avg Deg': '-',
                    Dens: '-',
                    H_obs: '-',
                    H_exp: '0.25',
                    H_adj: '-',
                    'Inertia ratio within': '0.816',
                    'Inertia ratio between': '0.184',
                    Mod: '-',
                    Clust: '-',
                    Diam: '-',
                    Article: 'Stochastic Block Model Generation Script',
                    Authors: 'Serrano, R. et al.',
                    Link: 'generate_datasets.py',
                    _id: 'SBM_parent',
                    _dataset: 'SBM',
                    _isParent: true
                });

                Object.keys(stats[key]).forEach(hKey => {
                    tableData.push({
                        ...stats[key][hKey],
                        Dataset: `SBM (${hKey})`,
                        _id: `SBM_${hKey}`,
                        _dataset: 'SBM',
                        _isChild: true,
                        _sbmVal: parseFloat(hKey.split('=')[1])
                    });
                });
            } else {
                tableData.push({
                    ...stats[key],
                    Dataset: key,
                    _id: key,
                    _dataset: key
                });
            }
        });
    }

    const columnTooltips = {
        'Dataset': 'Name of the graph dataset',
        'Description': 'Semantic description of what the dataset represents',
        'Edge Meaning': 'Explanation of what the links/edges represent',
        'Nodes': 'Number of vertices in the graph (|V|)',
        'Edges': 'Number of undirected edges (|E|)',
        'Feats': 'Dimensionality of per-node feature vectors (d)',
        'Classes': 'Number of distinct categories in the labels (C)',
        'Class Sizes': 'Sizes of the classes',
        'Class Labels': 'Semantic meaning of each class label',
        'Comp': 'Number of connected groups of nodes (Connected Components)',
        'Avg Deg': 'Average number of connections per node',
        'Dens': 'Graph density',
        'H_obs': 'Observed Homophily: Fraction of edges connecting nodes of the same class',
        'H_exp': 'Expected Homophily: Expected homophily in a random graph',
        'H_adj': 'Adjusted Homophily: Measures homophily relative to expectation',
        'Inertia ratio within': 'Ratio of within-class inertia to total inertia',
        'Inertia ratio between': 'Ratio of between-class inertia to total inertia',
        'Mod': 'Modularity: Strength of division into communities',
        'Clust': 'Clustering Coefficient: Degree to which nodes tend to cluster',
        'Diam': 'Diameter: Longest shortest path',
        'Article': 'Title of the paper introducing the dataset',
        'Authors': 'Authors of the paper',
        'Link': 'Link to the paper or dataset source',
    };

    function renderStatsTable() {
        if (tableData.length === 0) return;

        const thead = statsTable.querySelector('thead');
        const tbody = statsTable.querySelector('tbody');
        thead.innerHTML = '';
        tbody.innerHTML = '';

        // Headers
        // Get generic headers excluding internal fields starting with _
        const headers = Object.keys(tableData.find(r => !r._isParent && !r._isChild) || tableData[0]).filter(k => !k.startsWith('_'));
        
        // Move Dataset to front, Description and Edge Meaning right after it, Class Sizes and Class Labels next to Classes, and Authors, Article, Link to the far right.
        const rightmostHeaders = ['Authors', 'Article', 'Link'];
        let filteredHeaders = headers.filter(h => h !== 'Dataset' && h !== 'Description' && h !== 'Edge Meaning' && h !== 'Class Sizes' && h !== 'Class Labels' && !rightmostHeaders.includes(h));
        
        let sortedHeaders = ['Dataset'];
        if (headers.includes('Description')) sortedHeaders.push('Description');
        if (headers.includes('Edge Meaning')) sortedHeaders.push('Edge Meaning');
        sortedHeaders.push(...filteredHeaders);
        const classesIdx = sortedHeaders.indexOf('Classes');
        if (classesIdx !== -1) {
            sortedHeaders.splice(classesIdx + 1, 0, 'Class Sizes');
            if (headers.includes('Class Labels')) {
                sortedHeaders.splice(classesIdx + 2, 0, 'Class Labels');
            }
        } else {
            sortedHeaders.push('Class Sizes');
            if (headers.includes('Class Labels')) {
                sortedHeaders.push('Class Labels');
            }
        }
        
        rightmostHeaders.forEach(h => {
            if (headers.includes(h)) {
                sortedHeaders.push(h);
            }
        });

        const trHead = document.createElement('tr');
        sortedHeaders.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            if (columnTooltips[h]) {
                th.title = columnTooltips[h];
            }
            th.addEventListener('click', () => handleSort(h));
            if (sortState.column === h) {
                th.textContent += sortState.direction === 'asc' ? ' ▲' : ' ▼';
            }
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Body
        // peerRows are sorted, but we want to render the SBM children directly under the SBM parent.
        const peerRows = tableData.filter(row => !row._isChild);
        const sbmChildren = tableData.filter(row => row._isChild);

        peerRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.dataset.id = row._id;
            tr.addEventListener('click', (e) => {
                // Expand all truncated cells on row click (toggle)
                const tds = tr.querySelectorAll('.truncate-cell');
                const anyExpanded = [...tds].some(td => td.classList.contains('expanded-cell'));
                tds.forEach(td => {
                    if (anyExpanded) td.classList.remove('expanded-cell');
                    else td.classList.add('expanded-cell');
                });
                handleRowClick(row);
            });

            if (row._isParent) {
                tr.classList.add('sbm-parent-row');
            }

            sortedHeaders.forEach(h => {
                const td = document.createElement('td');

                if (h === 'Link' && row[h] && row[h] !== '-') {
                    const a = document.createElement('a');
                    a.href = row[h];

                    // Display domain name
                    try {
                        const url = new URL(row[h]);
                        const domain = url.hostname.replace('www.', '').split('.')[0];
                        a.textContent = `[${domain}]`;
                    } catch (e) {
                        a.textContent = '[link]';
                    }

                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.addEventListener('click', (e) => e.stopPropagation());
                    td.appendChild(a);
                } else {
                    td.textContent = row[h] || '-';

                    // Truncation Logic for specific columns
                    const truncationCols = ['Article', 'Authors', 'Class Sizes', 'Class Labels', 'Description', 'Edge Meaning'];
                    if (truncationCols.includes(h)) {
                        td.classList.add('truncate-cell');
                        if (h === 'Article') td.classList.add('col-article');
                        if (h === 'Authors') td.classList.add('col-authors');
                        if (h === 'Class Sizes') td.classList.add('col-class-sizes');
                        if (h === 'Class Labels') td.classList.add('col-class-labels');
                        if (h === 'Description') td.classList.add('col-description');
                        if (h === 'Edge Meaning') td.classList.add('col-edge-meaning');

                        td.title = row[h]; // Tooltip
                    }
                }

                // Add classes for specific columns
                if (h === 'Dataset') {
                    td.classList.add('col-dataset');
                    if (row._isParent) {
                        td.innerHTML = ''; // clear text
                        const toggleBtn = document.createElement('span');
                        toggleBtn.className = 'sbm-toggle-btn';
                        toggleBtn.innerHTML = sbmExpanded ? '▼ ' : '▶ ';
                        toggleBtn.style.cursor = 'pointer';
                        toggleBtn.style.marginRight = '8px';
                        toggleBtn.style.userSelect = 'none';
                        toggleBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            sbmExpanded = !sbmExpanded;
                            renderStatsTable();
                        });
                        td.appendChild(toggleBtn);
                        const nameSpan = document.createElement('span');
                        nameSpan.textContent = 'SBM';
                        td.appendChild(nameSpan);
                    }
                } else if (h.includes('Inertia')) {
                    td.classList.add('col-inertia');
                }

                tr.appendChild(td);
            });
            tbody.appendChild(tr);

            // If SBM parent is expanded, render SBM child rows immediately below it
            if (row._isParent && sbmExpanded) {
                sbmChildren.forEach(childRow => {
                    const childTr = document.createElement('tr');
                    childTr.dataset.id = childRow._id;
                    childTr.classList.add('sbm-child-row');
                    childTr.addEventListener('click', (e) => {
                        const childTds = childTr.querySelectorAll('.truncate-cell');
                        const anyExpanded = [...childTds].some(td => td.classList.contains('expanded-cell'));
                        childTds.forEach(td => {
                            if (anyExpanded) td.classList.remove('expanded-cell');
                            else td.classList.add('expanded-cell');
                        });
                        handleRowClick(childRow);
                    });

                    sortedHeaders.forEach(h => {
                        const childTd = document.createElement('td');

                        if (h === 'Link' && childRow[h] && childRow[h] !== '-') {
                            const a = document.createElement('a');
                            a.href = childRow[h];
                            try {
                                const url = new URL(childRow[h]);
                                const domain = url.hostname.replace('www.', '').split('.')[0];
                                a.textContent = `[${domain}]`;
                            } catch (e) {
                                a.textContent = '[link]';
                            }
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            a.addEventListener('click', (e) => e.stopPropagation());
                            childTd.appendChild(a);
                        } else {
                            childTd.textContent = childRow[h] || '-';

                            // Truncation Logic for specific columns
                            const truncationCols = ['Article', 'Authors', 'Class Sizes', 'Class Labels', 'Description', 'Edge Meaning'];
                            if (truncationCols.includes(h)) {
                                childTd.classList.add('truncate-cell');
                                if (h === 'Article') childTd.classList.add('col-article');
                                if (h === 'Authors') childTd.classList.add('col-authors');
                                if (h === 'Class Sizes') childTd.classList.add('col-class-sizes');
                                if (h === 'Class Labels') childTd.classList.add('col-class-labels');
                                if (h === 'Description') childTd.classList.add('col-description');
                                if (h === 'Edge Meaning') childTd.classList.add('col-edge-meaning');

                                childTd.title = childRow[h];
                            }
                        }

                        if (h === 'Dataset') {
                            childTd.classList.add('col-dataset');
                            childTd.style.paddingLeft = '28px';
                            childTd.style.fontSize = '0.92em';
                            childTd.style.opacity = '0.9';
                        } else if (h.includes('Inertia')) {
                            childTd.classList.add('col-inertia');
                        }

                        childTr.appendChild(childTd);
                    });
                    tbody.appendChild(childTr);
                });
            }
        });
    }

    function handleSort(column) {
        if (sortState.column === column) {
            // Toggle direction
            sortState.direction = sortState.direction === 'desc' ? 'asc' : 'desc';
        } else {
            sortState.column = column;
            sortState.direction = 'desc'; // Default Descending for new sort
        }

        const peers = tableData.filter(row => !row._isChild);
        const children = tableData.filter(row => row._isChild);

        peers.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // If a value is '-', treat it as very low or high to sort to the end
            if (valA === '-') valA = sortState.direction === 'asc' ? 99999999 : -99999999;
            if (valB === '-') valB = sortState.direction === 'asc' ? 99999999 : -99999999;

            // Try number conversion
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                valA = numA;
                valB = numB;
            }

            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Also sort the children by homophily value
        children.sort((a, b) => {
            return sortState.direction === 'asc' ? a._sbmVal - b._sbmVal : b._sbmVal - a._sbmVal;
        });

        // Rebuild tableData with SBM children grouped directly under SBM parent
        tableData = [];
        peers.forEach(p => {
            tableData.push(p);
            if (p._isParent) {
                children.forEach(c => tableData.push(c));
            }
        });

        renderStatsTable();
        // Re-highlight if a dataset selected
        const currentDataset = datasetSelect.value;
        if (currentDataset) highlightStatsRow(currentDataset);
    }

    function handleRowClick(row) {
        if (row._isParent) {
            sbmExpanded = !sbmExpanded;
            renderStatsTable();
            
            // Highlight current SBM selection
            if (datasetSelect.value !== 'SBM') {
                datasetSelect.value = 'SBM';
                datasetSelect.dispatchEvent(new Event('change'));
            } else {
                highlightStatsRow('SBM');
            }
            return;
        }

        // Selection Logic
        if (row._dataset === 'SBM') {
            sbmSlider.dataset.manualSet = 'true'; // Signal to keep value
            sbmSlider.value = row._sbmVal;
            sbmValue.textContent = row._sbmVal.toFixed(2);
        }

        if (datasetSelect.value !== row._dataset) {
            datasetSelect.value = row._dataset;
            datasetSelect.dispatchEvent(new Event('change'));
        } else if (row._dataset === 'SBM') {
            // Force SBM update if already on SBM but slider changed via row click
            sbmSlider.dispatchEvent(new Event('input'));
            highlightStatsRow('SBM'); // Force re-highlight of correct row
        }

        // Scroll to top to see controls?
        document.querySelector('.controls-section').scrollIntoView({ behavior: 'smooth' });
    }

    function highlightStatsRow(dataset) {
        if (dataset === 'SBM') {
            const hVal = parseFloat(sbmSlider.value).toFixed(2);
            const rowId = `SBM_h=${hVal}`;
            
            const row = statsTable.querySelector(`tr[data-id="${rowId}"]`);
            if (!row && !sbmExpanded) {
                sbmExpanded = true;
                renderStatsTable(); // This will trigger highlightStatsRow again which will highlight correctly
                return;
            }

            // Remove old highlight
            const rows = statsTable.querySelectorAll('tr');
            rows.forEach(r => r.classList.remove('highlighted'));

            if (row) {
                row.classList.add('highlighted');
            }
        } else {
            // Remove old highlight
            const rows = statsTable.querySelectorAll('tr');
            rows.forEach(r => r.classList.remove('highlighted'));

            const row = statsTable.querySelector(`tr[data-id="${dataset}"]`);
            if (row) {
                row.classList.add('highlighted');
            }
        }
    }

    // Update highlight when slider moves for SBM
    sbmSlider.addEventListener('input', () => {
        if (datasetSelect.value === 'SBM') {
            highlightStatsRow('SBM');
        }
    });

    // Theme Logic
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Default to dark
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'dark');
    }

    const savedTheme = localStorage.getItem('theme');
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        syncThemeToIframe();
    });

    function updateThemeIcon(theme) {
        themeToggle.querySelector('.icon').textContent = theme === 'dark' ? '🌙' : '☀️';
    }

    function syncThemeToIframe() {
        if (!graphFrame.contentWindow) return;

        try {
            const currentTheme = html.getAttribute('data-theme');
            const iframeBody = graphFrame.contentWindow.document.body;
            if (currentTheme === 'dark') {
                iframeBody.classList.add('dark');
                iframeBody.classList.remove('light');
            } else {
                iframeBody.classList.add('light');
                iframeBody.classList.remove('dark');
            }
        } catch (e) {
            // console.log("Could not sync theme.");
        }
    }
});
